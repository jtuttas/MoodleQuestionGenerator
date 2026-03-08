const BACKEND = window.location.port === "8000" ? "" : "http://localhost:8000";

// Fallback used only when OpenAI API is unreachable but key is valid
const OPENAI_MODELS_FALLBACK = ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-3.5-turbo"];

function showOpenAIBanner(type, msg) {
  const warn = document.getElementById("openaiWarning");
  const styles = {
    error:   { bg: "#fdecea", border: "#e74c3c", color: "#7b2020" },
    warning: { bg: "#fef9e7", border: "#f0b429", color: "#7d5a00" },
    success: { bg: "#eafaf1", border: "#27ae60", color: "#1a5c38" },
  };
  const s = styles[type] || styles.warning;
  warn.style.cssText =
    `display:block;background:${s.bg};border:1px solid ${s.border};` +
    `border-radius:4px;padding:8px 10px;font-size:0.82rem;color:${s.color};`;
  warn.textContent = msg;
}

const _TYPE_TEMPLATE_HINTS_UNUSED = {  // kept for prompt-building reference only
  multichoice: "Template: Eine Frage mit 4 Antwortoptionen, davon mindestens eine korrekt. Nutze fraction-Werte passend zur Bewertung.",
  cloze: "Template: Lückentext mit Moodle-Cloze-Syntax wie {1:MULTICHOICE:...~=Richtig...} direkt im Fragetext.",
  ddwtos: "Template: Text mit Lücken [[1]], [[2]] plus dragbox-Einträge je Gruppe inklusive Distraktoren.",
  ddmatch: "Template: Zuordnungsfrage mit subquestion/answer-Paaren (Begriff -> Definition).",
  numerical: "Template: Numerische Frage mit einer richtigen Zahl und Toleranzbereich.",
  shortanswer: "Template: Kurzantwort mit mindestens einer exakten korrekten Lösung.",
  coderunner: "Template: CodeRunner-Aufgabe mit Aufgabenstellung, Startercode und automatisch auswertbaren Tests."
};

const _TYPE_EXAMPLES_UNUSED = {
  multichoice: "Beispiel: Welche OSI-Schicht ist fuer Routing zustaendig? A) Sicherung B) Vermittlung C) Sitzung D) Darstellung",
  cloze: "Beispiel: Die IPv4-Adresse 192.168.1.0/24 hat die Netzmaske {1:SHORTANSWER:=255.255.255.0}.",
  ddwtos: "Beispiel: Ziehe die Fachbegriffe in den Satz: Ein [[1]] verbindet Netzwerke auf Layer [[2]].",
  ddmatch: "Beispiel: Ordne Protokolle zu: HTTP -> Anwendungsschicht, IP -> Vermittlungsschicht.",
  numerical: "Beispiel: Wie viele Hosts sind in einem /27-Netz maximal nutzbar?",
  shortanswer: "Beispiel: Wie heisst das Protokoll fuer sichere Webverbindungen?",
  coderunner: "Beispiel: Implementiere in Java eine Methode isPrime(int n) und pruefe sie mit Unit-Tests."
};

// initialize with Ollama models
updateModelOptions();
updateTypeGuidance();

function updateTypeGuidance() {
  const type = document.getElementById("questionType").value;
  // typeTemplate field removed from UI
  // typeExample field removed from UI
}

async function updateModelOptions() {
  const source = document.getElementById("modelSource").value;
  const sel = document.getElementById("modelName");
  const warn = document.getElementById("openaiWarning");
  warn.style.display = "none";
  sel.innerHTML = '<option disabled>Lade Modelle …</option>';

  if (source === "ollama") {
    try {
      const resp = await fetch(`${BACKEND}/ollama/models`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const models = data.models ?? [];
      if (!models.length) {
        sel.innerHTML = '<option disabled>Keine Modelle gefunden</option>';
        return;
      }
      populateSelect(sel, models);
    } catch (e) {
      sel.innerHTML = '<option disabled>Ollama nicht erreichbar</option>';
    }
  } else {
    // OpenAI: fetch model list dynamically (validates key implicitly)
    try {
      const resp = await fetch(`${BACKEND}/openai/models`);
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg = err.detail || `HTTP ${resp.status}`;
        if (resp.status === 503) {
          showOpenAIBanner("error",
            "⚠️ Kein API-Key konfiguriert. Bitte OPENAI_API_KEY in der .env-Datei setzen und Backend neu starten.");
        } else if (resp.status === 401) {
          showOpenAIBanner("error", "❌ API-Key ungültig oder abgelaufen: " + msg);
        } else {
          showOpenAIBanner("warning", "⚠️ Modelle konnten nicht geladen werden: " + msg +
            " – Standardliste wird verwendet.");
          populateSelect(sel, OPENAI_MODELS_FALLBACK);
        }
        sel.innerHTML = sel.innerHTML || '<option disabled>Keine Modelle verfügbar</option>';
        return;
      }
      const data = await resp.json();
      const models = data.models ?? [];
      if (!models.length) {
        showOpenAIBanner("warning", "⚠️ Keine geeigneten Chat-Modelle gefunden – Standardliste wird verwendet.");
        populateSelect(sel, OPENAI_MODELS_FALLBACK);
      } else {
        populateSelect(sel, models);
        showOpenAIBanner("success", "✓ API-Key gültig – " + models.length + " Modelle verfügbar.");
      }
    } catch (e) {
      showOpenAIBanner("warning",
        "⚠️ Netzwerkfehler beim Laden der Modelle – Standardliste wird verwendet.");
      populateSelect(sel, OPENAI_MODELS_FALLBACK);
    }
  }
}

function populateSelect(sel, models) {
  sel.innerHTML = "";
  models.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    sel.appendChild(opt);
  });
}

function switchTab(tab) {
  const isPreview = tab === "preview";
  document.getElementById("tabBtnPreview").classList.toggle("active", isPreview);
  document.getElementById("tabBtnXml").classList.toggle("active", !isPreview);
  document.getElementById("tabPreview").style.display = isPreview ? "" : "none";
  document.getElementById("tabXml").style.display = isPreview ? "none" : "";
}

async function generate() {
  const description = document.getElementById("description").value.trim();
  const questionType = document.getElementById("questionType").value;
  const difficulty = document.getElementById("difficulty").value;
  const modelSource = document.getElementById("modelSource").value;
  const modelName = document.getElementById("modelName").value?.trim();
  const errorMsg = document.getElementById("errorMsg");
  errorMsg.textContent = "";

  if (!description) {
    errorMsg.textContent = "Bitte eine Aufgabenbeschreibung eingeben.";
    return;
  }
  if (description.length < 10) {
    errorMsg.textContent = "Bitte mindestens 10 Zeichen in der Aufgabenbeschreibung eingeben.";
    return;
  }
  if (!questionType) {
    errorMsg.textContent = "Bitte einen Fragetyp auswaehlen.";
    return;
  }
  if (!["leicht", "mittel", "schwer"].includes(difficulty)) {
    errorMsg.textContent = "Bitte einen gueltigen Schwierigkeitsgrad auswaehlen.";
    return;
  }
  if (!["ollama", "openai"].includes(modelSource)) {
    errorMsg.textContent = "Bitte eine gueltige Modellquelle auswaehlen.";
    return;
  }
  if (!modelName) {
    errorMsg.textContent = "Bitte ein Modell auswaehlen.";
    return;
  }

  const btn = document.getElementById("generateBtn");
  const spinner = document.getElementById("spinner");
  btn.disabled = true;
  spinner.classList.add("active");

  const payload = {
    description,
    question_type: questionType,
    difficulty,
    model_source: modelSource,
    model_name: modelName,
  };

  try {
    const resp = await fetch(`${BACKEND}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${resp.status}`);
    }

    const data = await resp.json();
    renderResult(data.xml);
    loadSaved();
  } catch (e) {
    errorMsg.textContent = "Fehler: " + e.message;
  } finally {
    btn.disabled = false;
    spinner.classList.remove("active");
  }
}

// ── Quiz state ────────────────────────────────────────────────
let _quiz = {};

// Safe XML helper: first child element with tagName inside parent
function gEl(parent, tag) {
  if (!parent) return null;
  return parent.getElementsByTagName(tag)[0] || null;
}

function renderResult(xml) {
  document.getElementById("xmlContent").textContent = xml;
  var preview = document.getElementById("tabPreview");
  try {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xml, "application/xml");

    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      preview.innerHTML = '<p style="color:#c0392b;padding:8px 0;">Das XML konnte nicht geparst werden. Bitte XML-Tab prüfen.</p>';
      switchTab("preview");
      return;
    }

    // Find the actual question element (skip <question type="category">)
    var allQ = Array.prototype.slice.call(xmlDoc.getElementsByTagName("question"));
    var qEl = allQ.find(function(q) { return q.getAttribute("type") !== "category"; }) || allQ[0];
    if (!qEl) {
      preview.innerHTML = '<p style="color:#888;padding:8px 0;">Kein &lt;question&gt;-Element gefunden.</p>';
      switchTab("preview");
      return;
    }

    var qtypeRaw = (qEl.getAttribute("type") || "").toLowerCase().replace(/\s/g, "");
    // Normalize LLM variants → canonical Moodle type names
    var QTYPE_MAP = {
      "multiplechoice": "multichoice",
      "multiple_choice": "multichoice",
      "true_false": "truefalse",
      "short_answer": "shortanswer",
      "shorttext": "shortanswer",
      "numeric": "numerical",
      "drag_and_drop_into_text": "ddwtos",
      "drag_drop_into_text": "ddwtos",
      "drag_and_drop_matching": "ddmatch",
      "matching": "ddmatch"
    };
    var qtype = QTYPE_MAP[qtypeRaw] || qtypeRaw;
    var nameEl        = gEl(gEl(qEl, "name"), "text");
    var qtextContainer = gEl(qEl, "questiontext");
    var qtextEl       = qtextContainer ? gEl(qtextContainer, "text") : null;
    var qname = nameEl ? nameEl.textContent.trim() : "";
    // Multi-level fallback for qtext:
    // 1. <questiontext><text> (standard Moodle)
    // 2. <questiontext> textContent directly
    // 3. <text> directly inside <question> (some LLM outputs)
    var qtext = "";
    if (qtextEl && qtextEl.textContent.trim()) {
      qtext = qtextEl.textContent;
    } else if (qtextContainer && qtextContainer.textContent.trim()) {
      qtext = qtextContainer.textContent.trim();
    } else {
      // Direct <text> child of <question> (non-standard LLM output)
      var directText = gEl(qEl, "text");
      if (directText && directText.textContent.trim()) {
        qtext = directText.textContent.trim();
      }
    }
    _quiz = {};

    var html = "";
    if (qname) {
      html += '<div class="preview-name">' + escapeHtml(qname) + '</div>';
    }

    if (qtype === "multichoice" || qtype === "truefalse") {
      var singleEl = qEl.getElementsByTagName("single")[0];
      _quiz.isSingle = !singleEl || singleEl.textContent.trim() !== "false";
      if (qtext) html += '<div class="preview-qtext">' + qtext + '</div>';
      html += buildMCHtml(Array.prototype.slice.call(qEl.getElementsByTagName("answer")));

    } else if (qtype === "shortanswer") {
      _quiz.answers = Array.prototype.slice.call(qEl.getElementsByTagName("answer"))
        .filter(function(a) { return parseFloat(a.getAttribute("fraction") || 0) > 0; })
        .map(function(a) { var t = gEl(a, "text"); return t ? t.textContent.trim() : ""; });
      if (qtext) html += '<div class="preview-qtext">' + qtext + '</div>';
      html += buildSAHtml();

    } else if (qtype === "numerical") {
      var numanswers = Array.prototype.slice.call(qEl.getElementsByTagName("answer"));
      var ans = numanswers.find(function(a) { return parseFloat(a.getAttribute("fraction") || 0) > 0; });
      _quiz.answer    = ans && gEl(ans, "text")    ? gEl(ans, "text").textContent.trim()    : "";
      _quiz.tolerance = ans && gEl(ans, "tolerance") ? parseFloat(gEl(ans, "tolerance").textContent) : 0;
      if (qtext) html += '<div class="preview-qtext">' + qtext + '</div>';
      html += buildNumHtml();

    } else if (qtype === "cloze") {
      html += buildClozeHtml(qtext, qEl);

    } else if (qtype === "ddmatch") {
      if (qtext) html += '<div class="preview-qtext">' + qtext + '</div>';
      html += buildDDMatchHtml(Array.prototype.slice.call(qEl.getElementsByTagName("subquestion")));

    } else {
      if (qtext) html += '<div class="preview-qtext">' + qtext + '</div>';
      var fbAnswers = Array.prototype.slice.call(qEl.getElementsByTagName("answer"));
      if (fbAnswers.length) {
        html += '<div style="margin-top:8px;">';
        fbAnswers.forEach(function(a, i) {
          var t = gEl(a, "text");
          html += '<div style="padding:7px 12px;margin:5px 0;border:1px solid #d5d8dc;border-radius:5px;font-size:0.88rem;">' +
            String.fromCharCode(65 + i) + ") " + escapeHtml(t ? t.textContent : "") + '</div>';
        });
        html += '</div><p style="color:#888;font-size:0.8rem;margin-top:6px;">Fragetyp &laquo;' +
          escapeHtml(qtype) + '&raquo; – interaktive Prüfung nicht verfügbar.</p>';
      } else if (!qtext) {
        html += '<pre style="font-size:0.78rem;white-space:pre-wrap;word-break:break-all;">' + escapeHtml(xml) + '</pre>';
      }
    }

    preview.innerHTML = html;
  } catch (err) {
    preview.innerHTML = '<p style="color:#c0392b;padding:8px 0;">Rendering-Fehler: ' + escapeHtml(String(err)) + '</p>';
  }
  switchTab("preview");
}

// ── Multiple Choice ───────────────────────────────────────────────────────
function buildMCHtml(answers) {
  var icon = _quiz.isSingle ? "○" : "☐";
  var html = '<div id="answerOpts">';
  answers.forEach(function(a, i) {
    var frac = parseFloat(a.getAttribute("fraction") || 0);
    var txtEl = gEl(a, "text");
    var txt = txtEl ? txtEl.textContent : "";
    html += '<div class="ans-card" data-i="' + i + '" data-f="' + frac + '" onclick="pickAns(this)">' +
      '<span class="ans-ind">' + icon + '</span>' +
      '<span>' + escapeHtml(txt) + '</span>' +
      '</div>';
  });
  html += '</div>' +
    '<div class="quiz-actions">' +
    '<button class="btn-check" onclick="checkMC()">Prüfen</button>' +
    '<button class="btn-solution" onclick="revealMC()">Richtige Lösung anzeigen</button>' +
    '<button class="btn-reset" onclick="resetMC()">↺ Neu</button>' +
    '</div>' +
    '<div id="qfb" class="quiz-feedback"></div>';
  return html;
}

function pickAns(el) {
  var opts = Array.prototype.slice.call(document.querySelectorAll("#answerOpts .ans-card"));
  var fb = document.getElementById("qfb");
  if (fb) fb.style.display = "none";
  opts.forEach(function(o) {
    o.classList.remove("selected", "correct-selected", "wrong-selected", "correct-reveal", "missed");
  });
  if (_quiz.isSingle) {
    opts.forEach(function(o) { o.querySelector(".ans-ind").textContent = "○"; });
    el.classList.add("selected");
    el.querySelector(".ans-ind").textContent = "●";
  } else {
    var was = el.dataset.sel === "1";
    el.dataset.sel = was ? "0" : "1";
    el.classList.toggle("selected", !was);
    el.querySelector(".ans-ind").textContent = !was ? "☑" : "☐";
  }
}

function checkMC() {
  var opts = Array.prototype.slice.call(document.querySelectorAll("#answerOpts .ans-card"));
  var fb = document.getElementById("qfb");
  if (!opts.length || !fb) return;
  var hasSel = opts.some(function(o) {
    return o.classList.contains("selected") || o.dataset.sel === "1";
  });
  if (!hasSel) { setQfb(fb, "fb-wrong", "Bitte zuerst eine Antwort auswählen."); return; }
  // Sum of all positive fractions = maximum achievable score (works for fraction="100" AND fraction="1")
  var maxScore = opts.reduce(function(s, o) {
    var f = parseFloat(o.dataset.f); return f > 0 ? s + f : s;
  }, 0);
  var score = 0;
  opts.forEach(function(o) {
    var frac = parseFloat(o.dataset.f);
    var sel = o.classList.contains("selected") || o.dataset.sel === "1";
    if (sel) score += frac;
    if (sel && frac > 0)  o.classList.add("correct-selected");
    else if (sel)         o.classList.add("wrong-selected");
    else if (frac > 0)   o.classList.add("missed");
  });
  var threshold = maxScore > 0 ? maxScore * 0.99 : 99;
  if (score >= threshold)          setQfb(fb, "fb-correct", "✓ Richtig!");
  else if (score > 0)              setQfb(fb, "fb-partial", "◐ Teilweise richtig.");
  else                             setQfb(fb, "fb-wrong",   "✗ Falsch.");
}

function revealMC() {
  var opts = Array.prototype.slice.call(document.querySelectorAll("#answerOpts .ans-card"));
  var iconY = _quiz.isSingle ? "●" : "☑";
  var iconN = _quiz.isSingle ? "○" : "☐";
  opts.forEach(function(o) {
    o.classList.remove("selected", "correct-selected", "wrong-selected", "missed");
    o.dataset.sel = "0";
    if (parseFloat(o.dataset.f) > 0) {
      o.classList.add("correct-reveal");
      o.querySelector(".ans-ind").textContent = iconY;
    } else {
      o.querySelector(".ans-ind").textContent = iconN;
    }
  });
  setQfb(document.getElementById("qfb"), "fb-info", "Richtige Antwort(en) sind grün markiert.");
}

function resetMC() {
  var opts = Array.prototype.slice.call(document.querySelectorAll("#answerOpts .ans-card"));
  var icon = _quiz.isSingle ? "○" : "☐";
  opts.forEach(function(o) {
    o.classList.remove("selected", "correct-selected", "wrong-selected", "correct-reveal", "missed");
    o.dataset.sel = "0";
    o.querySelector(".ans-ind").textContent = icon;
  });
  var fb = document.getElementById("qfb");
  if (fb) fb.style.display = "none";
}

// ── Short Answer ──────────────────────────────────────────────────────────
function buildSAHtml() {
  return '<div style="margin:12px 0 8px;">' +
    '<input id="saInput" type="text" autocomplete="off"' +
    ' style="width:100%;padding:9px 11px;border:1.5px solid #bdc3c7;border-radius:5px;font-size:0.9rem;"' +
    ' placeholder="Antwort eingeben …">' +
    '</div>' +
    '<div class="quiz-actions">' +
    '<button class="btn-check" onclick="checkSA()">Prüfen</button>' +
    '<button class="btn-solution" onclick="revealSA()">Richtige Lösung anzeigen</button>' +
    '</div>' +
    '<div id="qfb" class="quiz-feedback"></div>';
}

function checkSA() {
  var inp = document.getElementById("saInput");
  var fb  = document.getElementById("qfb");
  if (!inp || !fb) return;
  var val = inp.value.trim();
  if (!val) { setQfb(fb, "fb-wrong", "Bitte eine Antwort eingeben."); return; }
  inp.addEventListener("keydown", function(e) { if(e.key==="Enter") checkSA(); }, {once:true});
  var ok = (_quiz.answers || []).some(function(a) {
    return a.toLowerCase() === val.toLowerCase();
  });
  inp.style.borderColor = ok ? "#27ae60" : "#e74c3c";
  setQfb(fb, ok ? "fb-correct" : "fb-wrong", ok ? "✓ Richtig!" : "✗ Falsch.");
}

function revealSA() {
  var inp = document.getElementById("saInput");
  var fb  = document.getElementById("qfb");
  if (!inp) return;
  inp.value = (_quiz.answers || ["?"])[0];
  inp.style.borderColor = "#27ae60";
  var extra = (_quiz.answers || []).length > 1
    ? " (auch: " + _quiz.answers.slice(1).join(", ") + ")" : "";
  setQfb(fb, "fb-info", "Lösung: " + inp.value + extra);
}

// ── Numerical ─────────────────────────────────────────────────────────────
function buildNumHtml() {
  var tolNote = _quiz.tolerance > 0
    ? ' <span style="color:#888;font-size:0.8rem;">(±' + _quiz.tolerance + ')</span>' : "";
  return '<div style="margin:12px 0 8px;display:flex;align-items:center;gap:10px;">' +
    '<input id="numInput" type="number" step="any"' +
    ' style="width:180px;padding:9px 11px;border:1.5px solid #bdc3c7;border-radius:5px;font-size:0.9rem;"' +
    ' placeholder="Zahl …">' +
    tolNote + '</div>' +
    '<div class="quiz-actions">' +
    '<button class="btn-check" onclick="checkNum()">Prüfen</button>' +
    '<button class="btn-solution" onclick="revealNum()">Richtige Lösung anzeigen</button>' +
    '</div>' +
    '<div id="qfb" class="quiz-feedback"></div>';
}

function checkNum() {
  var inp = document.getElementById("numInput");
  var fb  = document.getElementById("qfb");
  if (!inp || !fb) return;
  var val = parseFloat(inp.value);
  var correct = parseFloat(_quiz.answer || 0);
  if (isNaN(val)) { setQfb(fb, "fb-wrong", "Bitte eine Zahl eingeben."); return; }
  var ok = Math.abs(val - correct) <= (_quiz.tolerance || 0);
  inp.style.borderColor = ok ? "#27ae60" : "#e74c3c";
  if (ok) {
    setQfb(fb, "fb-correct", "✓ Richtig!");
  } else {
    var t = _quiz.tolerance > 0 ? " ±" + _quiz.tolerance : "";
    setQfb(fb, "fb-wrong", "✗ Falsch. Richtige Antwort: " + _quiz.answer + t);
  }
}

function revealNum() {
  var inp = document.getElementById("numInput");
  var fb  = document.getElementById("qfb");
  if (!inp) return;
  inp.value = _quiz.answer;
  inp.style.borderColor = "#27ae60";
  var t = _quiz.tolerance > 0 ? " (±" + _quiz.tolerance + ")" : "";
  setQfb(fb, "fb-info", "Richtige Antwort: " + _quiz.answer + t);
}

// ── Cloze ─────────────────────────────────────────────────────────────────
function buildClozeHtml(qtext, qEl) {
  if (!qtext) {
    return '<p style="color:#e67e22;font-size:0.88rem;">⚠ Kein Fragetext gefunden.</p>';
  }
  _quiz.clozeItems = [];
  var itemCount = 0;

  // Regex: optional weight prefix {N:TYPE:opts} or {TYPE:opts}
  var filled = qtext.replace(/\{(?:\d+:)?([A-Z_]+):([^}]+)\}/gi, function(m, type, optStr) {
    var idx = itemCount++;
    type = type.toUpperCase();

    // Parse options: split by ~ (ignore leading ~ from some LLM outputs)
    var opts = optStr.split('~').map(function(o) { return o.trim(); }).filter(function(o) { return o.length > 0; });
    var correct = '';
    var tolerance = 0;
    var cleanOpts = [];

    opts.forEach(function(o) {
      if (o.charAt(0) === '%') {
        // %100%Answer format
        var m2 = o.match(/^%([0-9.]+)%(.+)$/);
        if (m2) {
          if (parseFloat(m2[1]) >= 99) correct = m2[2].trim();
          cleanOpts.push(m2[2].trim());
        }
      } else if (o.charAt(0) === '=') {
        correct = o.slice(1).trim();
        // For numerical: =42:0.5  (value:tolerance)
        var colon = correct.indexOf(':');
        if (colon >= 0 && (type === 'NUMERICAL' || type === 'NUMERIC')) {
          tolerance = parseFloat(correct.slice(colon + 1)) || 0;
          correct = correct.slice(0, colon).trim();
        }
        cleanOpts.push(correct);
      } else {
        // For NUMERICAL: bare value:tolerance without =
        if ((type === 'NUMERICAL' || type === 'NUMERIC') && !correct) {
          var colon = o.indexOf(':');
          if (colon >= 0) { correct = o.slice(0, colon).trim(); tolerance = parseFloat(o.slice(colon + 1)) || 0; }
          else { correct = o; }
        }
        cleanOpts.push(o);
      }
    });

    if (!correct && cleanOpts.length) correct = cleanOpts[0];

    if (type === 'MULTICHOICE' || type === 'MULTICHOICE_S' || type === 'MULTICHOICE_H' ||
        type === 'MCS' || type === 'MCH' || type === 'SINGLESELECT' ||
        type === 'SELECT' || type === 'DROPDOWN') {
      _quiz.clozeItems[idx] = { type: 'mc', correct: correct };
      var sel = '<select class="cloze-input" data-idx="' + idx + '">' +
        '<option value="">– wählen –</option>';
      cleanOpts.forEach(function(o) {
        sel += '<option value="' + escapeHtml(o) + '">' + escapeHtml(o) + '</option>';
      });
      return sel + '</select>';

    } else if (type === 'SHORTANSWER' || type === 'SHORTANSWER_C' || type === 'SA' || type === 'SAC') {
      _quiz.clozeItems[idx] = { type: 'sa', correct: correct, caseSensitive: type.endsWith('_C') || type === 'SAC' };
      return '<input class="cloze-input" type="text" data-idx="' + idx + '" autocomplete="off" style="width:130px;">';

    } else if (type === 'NUMERICAL' || type === 'NUMERIC' || type === 'NM') {
      _quiz.clozeItems[idx] = { type: 'num', correct: correct, tolerance: tolerance };
      return '<input class="cloze-input" type="number" step="any" data-idx="' + idx + '" style="width:100px;">';

    } else {
      // Unknown cloze type – show placeholder
      _quiz.clozeItems[idx] = { type: 'sa', correct: correct };
      return '<input class="cloze-input" type="text" data-idx="' + idx + '" autocomplete="off" ' +
        'style="width:130px;" placeholder="(' + escapeHtml(type) + ')">';
    }
  });

  if (itemCount === 0) {
    // No {N:TYPE:...} cloze patterns – check for [[n]] style gaps (ddwtos-style syntax in cloze question)
    if (!/\[\[\d+\]\]/.test(qtext)) {
      return '<div class="preview-qtext">' + qtext + '</div>' +
        '<p style="color:#e67e22;font-size:0.82rem;margin-top:8px;">⚠ Keine Cloze-Muster ({N:TYP:...}) im Fragetext gefunden.</p>' +
        '<div class="quiz-actions"><button class="btn-solution" onclick="toggleClozeRaw()">Rohtext anzeigen</button></div>' +
        '<pre id="clozeRaw" style="display:none;font-size:0.78rem;background:#f8f9fa;padding:10px;border-radius:4px;white-space:pre-wrap;word-break:break-all;margin-top:8px;">' +
        escapeHtml(qtext) + '</pre>';
    }
    // [[n]] gaps found – build text inputs; try to get correct answers from dragbox or answer elements
    var slotAnswers = {};
    if (qEl) {
      var dragboxes = Array.prototype.slice.call(qEl.getElementsByTagName('dragbox'));
      if (dragboxes.length) {
        // dragbox position (1-based) maps to [[n]]
        dragboxes.forEach(function(db, pos) {
          var t = gEl(db, 'text');
          if (t) slotAnswers[pos + 1] = t.textContent.trim();
        });
      } else {
        // Fallback: <answer fraction="100"> elements in document order
        Array.prototype.slice.call(qEl.getElementsByTagName('answer'))
          .filter(function(a) { return parseFloat(a.getAttribute('fraction') || 0) >= 99; })
          .forEach(function(a, i) {
            var t = gEl(a, 'text');
            if (t) slotAnswers[i + 1] = t.textContent.trim();
          });
      }
    }
    _quiz.clozeItems = [];
    var gapIdx = 0;
    var filledGaps = qtext.replace(/\[\[(\d+)\]\]/g, function(m, n) {
      var idx = gapIdx++;
      var correct = slotAnswers[parseInt(n)] || '';
      _quiz.clozeItems[idx] = { type: 'sa', correct: correct };
      return '<input class="cloze-input" type="text" data-idx="' + idx + '" autocomplete="off" style="width:130px;">';
    });
    return '<div class="preview-qtext" style="line-height:2.2;">' + filledGaps + '</div>' +
      '<div class="quiz-actions">' +
      '<button class="btn-check" onclick="checkCloze()">Prüfen</button>' +
      '<button class="btn-solution" onclick="revealCloze()">Richtige Lösung anzeigen</button>' +
      '</div>' +
      '<div id="qfb" class="quiz-feedback"></div>';
  }

  return '<div class="preview-qtext" style="line-height:2.2;">' + filled + '</div>' +
    '<div class="quiz-actions">' +
    '<button class="btn-check" onclick="checkCloze()">Prüfen</button>' +
    '<button class="btn-solution" onclick="revealCloze()">Richtige Lösung anzeigen</button>' +
    '</div>' +
    '<div id="qfb" class="quiz-feedback"></div>';
}

function checkCloze() {
  var inputs = Array.prototype.slice.call(document.querySelectorAll(".cloze-input"));
  var fb = document.getElementById("qfb");
  if (!inputs.length || !fb) return;
  var hasEmpty = inputs.some(function(el) { return !el.value.trim(); });
  if (hasEmpty) { setQfb(fb, "fb-wrong", "Bitte alle Lücken ausfüllen."); return; }
  var correct = 0;
  inputs.forEach(function(el) {
    var idx = parseInt(el.dataset.idx);
    var item = (_quiz.clozeItems || [])[idx];
    if (!item) return;
    var val = el.value.trim();
    var ok = false;
    var hasCorrect = !!(item.correct);
    if (!hasCorrect) {
      // No known answer – neutral border, don't count
      el.style.borderColor = '#bdc3c7';
      return;
    }
    if (item.type === 'mc') {
      ok = val.toLowerCase() === (item.correct || '').toLowerCase();
    } else if (item.type === 'sa') {
      ok = item.caseSensitive ? val === item.correct : val.toLowerCase() === (item.correct || '').toLowerCase();
    } else if (item.type === 'num') {
      var num = parseFloat(val);
      ok = !isNaN(num) && Math.abs(num - parseFloat(item.correct || 0)) <= (item.tolerance || 0);
    }
    el.style.borderColor = ok ? '#27ae60' : '#e74c3c';
    if (ok) correct++;
  });
  var gradeable = inputs.filter(function(el) {
    var item = (_quiz.clozeItems || [])[parseInt(el.dataset.idx)];
    return item && !!item.correct;
  });
  var total = gradeable.length;
  if (total === 0) {
    setQfb(fb, 'fb-info', 'ℹ Keine Musterlösung im XML. Bitte prüfen Sie Ihre Antworten manuell.');
  } else if (correct === total)  setQfb(fb, 'fb-correct', '✓ Alle ' + total + ' Lücken richtig!');
  else if (correct > 0)   setQfb(fb, 'fb-partial', '◐ ' + correct + ' von ' + total + ' Lücken richtig.');
  else                    setQfb(fb, 'fb-wrong',   '✗ Keine Lücke korrekt ausgefüllt.');
}

function revealCloze() {
  var inputs = Array.prototype.slice.call(document.querySelectorAll(".cloze-input"));
  var fb = document.getElementById("qfb");
  inputs.forEach(function(el) {
    var idx = parseInt(el.dataset.idx);
    var item = (_quiz.clozeItems || [])[idx];
    if (!item) return;
    if (el.tagName === 'SELECT') {
      Array.prototype.slice.call(el.options).forEach(function(o) {
        if (o.value.toLowerCase() === (item.correct || '').toLowerCase()) el.value = o.value;
      });
    } else {
      el.value = item.correct || '';
    }
    el.style.borderColor = '#27ae60';
  });
  if (fb) setQfb(fb, 'fb-info', 'Lösungen eingeblendet.');
}

function toggleClozeRaw() {
  var el = document.getElementById("clozeRaw");
  if (el) el.style.display = el.style.display === "none" ? "block" : "none";
}

// ── Helpers ───────────────────────────────────────────────────────────────
function stripHtml(str) {
  var d = document.createElement("div");
  d.innerHTML = str;
  return (d.textContent || d.innerText || "").trim();
}

// ── DDMatch ───────────────────────────────────────────────────────────────
function buildDDMatchHtml(subqs) {
  if (!subqs.length) return '<p style="color:#888;">Keine Zuordnungspaare gefunden.</p>';

  function normalizeVisibleText(raw) {
    // Strip any HTML tags first (e.g. <p></p> → ""), then clean whitespace/invisibles
    var d = document.createElement("div");
    d.innerHTML = String(raw || "");
    var text = d.textContent || d.innerText || "";
    return text
      .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Extract only required pairs {q, a}: rows must contain both question and answer text.
  var pairs = [];
  subqs.forEach(function(sq) {
    var qTextEl = gEl(sq, "text");
    var ansEl   = sq.getElementsByTagName("answer")[0];
    var aTextEl = ansEl ? gEl(ansEl, "text") : null;
    var q = qTextEl ? normalizeVisibleText(qTextEl.textContent) : "";
    var a = aTextEl ? normalizeVisibleText(aTextEl.textContent) : "";
    if (q && a) pairs.push({ q: q, a: a });
  });
  if (!pairs.length) return '<p style="color:#888;">Keine Zuordnungspaare gefunden.</p>';

  // Build option pool limited to required number of mappings.
  var requiredCount = pairs.length;
  var optPool = [];
  pairs.forEach(function(p) {
    var plain = stripHtml(p.a);
    if (plain && optPool.indexOf(plain) === -1) optPool.push(plain);
  });

  // Keep exactly as many options as mappings are required.
  var limitedPool = optPool.slice(0, requiredCount);
  var shuffled = limitedPool.slice().sort(function() { return Math.random() - 0.5; });

  _quiz.pairs = pairs;

  // Build select options HTML (answer text may contain HTML – strip for plain-text comparison)
  function buildOptions() {
    var o = '<option value="">– bitte wählen –</option>';
    shuffled.forEach(function(plain) {
      o += '<option value="' + escapeHtml(plain) + '">' + escapeHtml(plain) + '</option>';
    });
    return o;
  }

  var html = '<table class="match-table" id="ddmatch-table"><thead>'
    + '<tr><th>Begriff / Aussage</th><th>Zuordnung</th></tr></thead><tbody>';

  pairs.forEach(function(p, i) {
    html += '<tr id="ddmatch-row-' + i + '">'
      + '<td>' + p.q + '</td>'   // render HTML content (e.g. <p>, symbols) natively
      + '<td><select class="ddmatch-select" data-idx="' + i + '">'
      + buildOptions()
      + '</select></td></tr>';
  });

  html += '</tbody></table>'
    + '<div id="ddmatch-fb" class="quiz-feedback" style="display:none;"></div>'
    + '<div class="quiz-actions">'
    + '<button class="btn-check" onclick="checkDDMatch()">Prüfen</button>'
    + '<button class="btn-solution" onclick="revealDDMatch()">Richtige Lösung</button>'
    + '<button class="btn-reset" onclick="resetDDMatch()">Neu</button>'
    + '</div>';

  return html;
}

function checkDDMatch() {
  var pairs = _quiz.pairs || [];
  var wrong = 0, empty = 0;
  pairs.forEach(function(p, i) {
    var sel = document.querySelector('.ddmatch-select[data-idx="' + i + '"]');
    var row = document.getElementById('ddmatch-row-' + i);
    if (!sel || !row) return;
    if (!sel.value) { empty++; row.style.background = ""; return; }
    if (sel.value === stripHtml(p.a)) {
      row.style.background = "#eafaf1";
    } else {
      row.style.background = "#fdf2f8";
      wrong++;
    }
  });
  var fb = document.getElementById("ddmatch-fb");
  if (empty) {
    setQfb(fb, "fb-info", "Bitte alle Felder ausfüllen (" + empty + " noch offen).");
  } else if (wrong === 0) {
    setQfb(fb, "fb-correct", "✔ Alle Zuordnungen korrekt!");
  } else {
    setQfb(fb, "fb-wrong", "✘ " + wrong + " falsche Zuordnung" + (wrong > 1 ? "en" : "") + ".");
  }
}

function revealDDMatch() {
  var pairs = _quiz.pairs || [];
  pairs.forEach(function(p, i) {
    var sel = document.querySelector('.ddmatch-select[data-idx="' + i + '"]');
    var row = document.getElementById('ddmatch-row-' + i);
    if (!sel || !row) return;
    sel.value = stripHtml(p.a);
    row.style.background = "#eafaf1";
  });
  setQfb(document.getElementById("ddmatch-fb"), "fb-info", "Richtige Lösung eingeblendet.");
}

function resetDDMatch() {
  var pairs = _quiz.pairs || [];
  pairs.forEach(function(p, i) {
    var sel = document.querySelector('.ddmatch-select[data-idx="' + i + '"]');
    var row = document.getElementById('ddmatch-row-' + i);
    if (sel) sel.value = "";
    if (row) row.style.background = "";
  });
  var fb = document.getElementById("ddmatch-fb");
  if (fb) { fb.style.display = "none"; fb.textContent = ""; }
}

// ── Shared feedback helper ────────────────────────────────────────────────
function setQfb(el, cls, msg) {
  if (!el) return;
  el.className = "quiz-feedback " + cls;
  el.textContent = msg;
  el.style.display = "block";
}

function escapeHtml(str) {

  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function copyXml() {
  const xml = document.getElementById("xmlContent").textContent;
  await navigator.clipboard.writeText(xml);
  const btn = event.target;
  const orig = btn.textContent;
  btn.textContent = "Kopiert ✓";
  setTimeout(() => { btn.textContent = orig; }, 2000);
}

function downloadXml() {
  const xml  = document.getElementById("xmlContent").textContent;
  const blob = new Blob([xml], { type: "application/xml" });
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(blob);
  const qtype = document.getElementById("questionType").value || "frage";
  const date  = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  a.download = `${qtype}-${date}.xml`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Saved Questions ───────────────────────────────────────
async function loadSaved() {
  try {
    const resp = await fetch(`${BACKEND}/questions?limit=30`);
    if (!resp.ok) return;
    const items = await resp.json();
    const list = document.getElementById("savedList");
    if (!items.length) {
      list.innerHTML = '<li class="empty">Noch keine Fragen gespeichert.</li>';
      return;
    }
    list.innerHTML = items.map(q => {
      const d = new Date(q.created_at);
      const ts = d.toLocaleDateString("de-DE") + " " + d.toLocaleTimeString("de-DE", {hour:"2-digit", minute:"2-digit"});
      const desc = q.description.length > 55 ? q.description.slice(0, 55) + "…" : q.description;
      return `<li onclick="loadQuestion(${q.id})">
        <span>${escapeHtml(desc)}</span>
        <span class="meta">${escapeHtml(q.question_type)} · ${escapeHtml(q.difficulty)}<br>${ts}</span>
      </li>`;
    }).join("");
  } catch (_) { /* silent – server may be starting */ }
}

async function loadQuestion(id) {
  try {
    const resp = await fetch(`${BACKEND}/questions/${id}`);
    if (!resp.ok) return;
    const q = await resp.json();
    renderResult(q.xml_output);
  } catch (e) {
    document.getElementById("errorMsg").textContent = "Fehler beim Laden: " + e.message;
  }
}

// Load saved questions on startup
loadSaved();

