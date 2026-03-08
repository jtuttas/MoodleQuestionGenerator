param(
  [string]$BackendUrl = "http://localhost:8000",
  [string]$PreferredModel = "gemma3n:latest",
  [switch]$IncludeGeneration,
  [string]$ResultsDir = "$PSScriptRoot\results"
)

$ErrorActionPreference = "Stop"

function Assert-True {
  param(
    [bool]$Condition,
    [string]$Message
  )
  if (-not $Condition) {
    throw "ASSERT FAILED: $Message"
  }
}

function Step {
  param([string]$Message)
  Write-Host "[STEP] $Message"
  $script:ExecutedSteps += $Message
}

function To-Array {
  param($Value)
  if ($null -eq $Value) { return @() }
  if ($Value -is [System.Array]) { return $Value }
  return @($Value)
}

$ExecutedSteps = @()
$runStarted = Get-Date
$resultStatus = "failed"
$errorMessage = $null
$generatedId = $null
$modelName = $null

try {
  if (-not (Test-Path -Path $ResultsDir)) {
    New-Item -ItemType Directory -Path $ResultsDir -Force | Out-Null
  }

  Write-Host "Running Iteration-1 API smoke test against: $BackendUrl"

  Step "Health check"
  $health = Invoke-RestMethod -Uri "$BackendUrl/health" -TimeoutSec 10
  Assert-True ($health.status -eq "ok") "health status must be 'ok'"

  Step "Load Ollama models"
  $modelsResp = Invoke-RestMethod -Uri "$BackendUrl/ollama/models" -TimeoutSec 20
  $models = @($modelsResp.models)
  Assert-True ($models.Count -gt 0) "at least one local model must be available"

  # Pick preferred model if available, otherwise first non-embedding model, else first.
  if ($models -contains $PreferredModel) {
    $modelName = $PreferredModel
  } else {
    $modelName = $models | Where-Object { $_ -notmatch "embed" } | Select-Object -First 1
    if (-not $modelName) {
      $modelName = $models[0]
    }
  }

  Step "Validate invalid question_type -> 422"
  $invalidPayload = @{
    description = "Validierungscheck"
    question_type = "invalid_type"
    difficulty = "mittel"
    model_source = "ollama"
    model_name = $modelName
  } | ConvertTo-Json

  try {
    Invoke-RestMethod -Uri "$BackendUrl/generate" -Method Post -ContentType "application/json" -Body $invalidPayload -TimeoutSec 30 | Out-Null
    throw "Expected HTTP 422 for invalid question_type"
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-True ($status -eq 422) "invalid question_type must return HTTP 422"
  }

  Step "Validate empty description -> 422"
  $emptyPayload = @{
    description = "   "
    question_type = "multichoice"
    difficulty = "mittel"
    model_source = "ollama"
    model_name = $modelName
  } | ConvertTo-Json

  try {
    Invoke-RestMethod -Uri "$BackendUrl/generate" -Method Post -ContentType "application/json" -Body $emptyPayload -TimeoutSec 30 | Out-Null
    throw "Expected HTTP 422 for empty description"
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-True ($status -eq 422) "empty description must return HTTP 422"
  }

  Step "Validate too short description -> 422"
  $shortDescriptionPayload = @{
    description = "zu kurz"
    question_type = "multichoice"
    difficulty = "mittel"
    model_source = "ollama"
    model_name = $modelName
  } | ConvertTo-Json

  try {
    Invoke-RestMethod -Uri "$BackendUrl/generate" -Method Post -ContentType "application/json" -Body $shortDescriptionPayload -TimeoutSec 30 | Out-Null
    throw "Expected HTTP 422 for too short description"
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-True ($status -eq 422) "too short description must return HTTP 422"
  }

  Step "Validate invalid difficulty -> 422"
  $invalidDifficultyPayload = @{
    description = "Dies ist eine gueltige Beschreibung."
    question_type = "multichoice"
    difficulty = "ungueltig"
    model_source = "ollama"
    model_name = $modelName
  } | ConvertTo-Json

  try {
    Invoke-RestMethod -Uri "$BackendUrl/generate" -Method Post -ContentType "application/json" -Body $invalidDifficultyPayload -TimeoutSec 30 | Out-Null
    throw "Expected HTTP 422 for invalid difficulty"
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-True ($status -eq 422) "invalid difficulty must return HTTP 422"
  }

  Step "Validate empty model_name -> 422"
  $emptyModelNamePayload = @{
    description = "Dies ist eine gueltige Beschreibung."
    question_type = "multichoice"
    difficulty = "mittel"
    model_source = "ollama"
    model_name = "   "
  } | ConvertTo-Json

  try {
    Invoke-RestMethod -Uri "$BackendUrl/generate" -Method Post -ContentType "application/json" -Body $emptyModelNamePayload -TimeoutSec 30 | Out-Null
    throw "Expected HTTP 422 for empty model_name"
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    Assert-True ($status -eq 422) "empty model_name must return HTTP 422"
  }

  if ($IncludeGeneration) {
    Step "Generate a valid question"
    $fence = ([string][char]96) * 3
    $payload = @{
      description = "Erstelle eine kurze Multiple-Choice-Frage zu IPv4 Subnetting mit 4 Antwortoptionen."
      question_type = "multichoice"
      difficulty = "mittel"
      model_source = "ollama"
      model_name = $modelName
    } | ConvertTo-Json

    $generated = Invoke-RestMethod -Uri "$BackendUrl/generate" -Method Post -ContentType "application/json" -Body $payload -TimeoutSec 240
    Assert-True ($null -ne $generated.id) "generate response must contain id"
    Assert-True (-not [string]::IsNullOrWhiteSpace($generated.xml)) "generate response must contain xml"
    Assert-True (-not $generated.xml.TrimStart().StartsWith('``')) "generate xml must not start with markdown code fence"
    Assert-True ($generated.xml -match '<quiz') "generate xml must contain <quiz root"

    $generatedId = [int]$generated.id

    Step "Verify detail retrieval for generated id"
    $detail = Invoke-RestMethod -Uri "$BackendUrl/questions/$generatedId" -TimeoutSec 20
    Assert-True ("$($detail.id)" -eq "$generatedId") "detail endpoint must return the same id"
    Assert-True (-not [string]::IsNullOrWhiteSpace($detail.xml_output)) "detail response must include xml_output"
    Assert-True (-not $detail.xml_output.TrimStart().StartsWith('``')) "stored xml must not start with markdown code fence"
    Assert-True ($detail.xml_output -match '<quiz') "stored xml must contain <quiz root"

    Step "Verify questions list endpoint returns items"
    $listResp = Invoke-RestMethod -Uri "$BackendUrl/questions?limit=5" -TimeoutSec 20
    $list = To-Array $listResp
    Assert-True ($list.Count -ge 1) "/questions must return at least one item after generation"

    Write-Host "[OK] Iteration-1 smoke test passed (full mode). Generated question id: $generatedId (model: $modelName)"
  } else {
    Step "Verify questions list endpoint"
    $list = Invoke-RestMethod -Uri "$BackendUrl/questions?limit=1" -TimeoutSec 20
    Assert-True ($null -ne $list) "/questions should return a JSON array (possibly empty)"
    Write-Host "[OK] Iteration-1 smoke test passed (quick mode). Use -IncludeGeneration for full end-to-end generation."
  }

  $resultStatus = "passed"
} catch {
  $errorMessage = $_.Exception.Message
  Write-Host "[FAIL] $errorMessage"
  throw
} finally {
  $runEnded = Get-Date
  $timestamp = $runStarted.ToString("yyyyMMdd-HHmmss")
  $resultPath = Join-Path $ResultsDir ("iteration1-smoketest-{0}.json" -f $timestamp)

  $result = [pscustomobject]@{
    startedAt = $runStarted.ToString("s")
    endedAt = $runEnded.ToString("s")
    durationSeconds = [math]::Round(($runEnded - $runStarted).TotalSeconds, 2)
    status = $resultStatus
    backendUrl = $BackendUrl
    mode = $(if ($IncludeGeneration) { "full" } else { "quick" })
    selectedModel = $modelName
    generatedQuestionId = $generatedId
    executedSteps = $ExecutedSteps
    error = $errorMessage
  }

  $result | ConvertTo-Json -Depth 5 | Set-Content -Path $resultPath -Encoding UTF8
  Write-Host "[RESULT] Saved: $resultPath"
}
