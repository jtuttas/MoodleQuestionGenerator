# Moodle KI-Fragen-Generator – Web-App

KI-gestützte Webanwendung zur Generierung von Moodle-Fragen als valides XML.  
Methode: **Extreme Programming (XP)** | Stand: **08.03.2026**

---

## Architektur

```
app/
├── backend/
│   ├── main.py              # FastAPI-Backend (REST-API + statische Dateien)
│   ├── import_res.py        # Utility: res/-XMLs in questions.db importieren
│   ├── requirements.txt     # Python-Abhängigkeiten
│   ├── .env                 # Lokale Konfiguration (nicht im Repository)
│   ├── .env.example         # Konfigurationsvorlage
│   ├── Dockerfile           # Container-Image (python:3.13-slim)
│   └── questions.db         # SQLite-Datenbank (auto-erstellt)
├── frontend/
│   ├── index.html           # HTML-Struktur (verweist auf styles.css + script.js)
│   ├── styles.css           # CSS-Stile (ausgelagert)
│   └── script.js            # JavaScript-Logik (ausgelagert)
├── docker-compose.yml       # Backend + Ollama als Docker-Stack
├── lastenheft_moodle_ki_webapp.md
├── user-stories.md
└── README.md                # diese Datei
```

### Technologie-Stack

| Schicht | Technologie |
|---|---|
| Backend | Python 3.14, FastAPI, uvicorn |
| Datenbank | SQLite via SQLAlchemy 2.x async + aiosqlite |
| LLM (lokal) | Ollama (HTTP-API auf Port 11434) |
| LLM (cloud) | OpenAI SDK (ab Iteration 2) |
| Frontend | Vanilla HTML / JavaScript (keine Build-Tools) |
| Deployment | Docker + docker-compose |

---

## Schnellstart (lokal)

### Voraussetzungen
- Python 3.11+ (getestet mit 3.14)
- [Ollama](https://ollama.ai) läuft lokal (`http://localhost:11434`)
- Mindestens ein Ollama-Modell geladen (z. B. `ollama pull gemma3n`)

### Installation & Start

```powershell
# Abhängigkeiten installieren
cd app/backend
python -m pip install -r requirements.txt

# Backend starten
python -m uvicorn main:app --reload --port 8000
```

Anwendung öffnen: **http://localhost:8000**

### Automatisierter Smoke-Test (Iteration 1)

```powershell
cd app
powershell -ExecutionPolicy Bypass -File .\test\iteration1-smoketest.ps1
```

Der Standardlauf ist ein schneller API-Smoketest (ohne LLM-Generierung).

Ergebnisse werden automatisch als JSON unter `app/test/results/` gespeichert.

Optional mit Parametern:

```powershell
powershell -ExecutionPolicy Bypass -File .\test\iteration1-smoketest.ps1 -BackendUrl "http://localhost:8000" -PreferredModel "gemma3n:latest"
```

Vollständiger End-to-End-Lauf inklusive echter Generierung:

```powershell
powershell -ExecutionPolicy Bypass -File .\test\iteration1-smoketest.ps1 -IncludeGeneration
```

### Konfiguration

`.env.example` → `.env` kopieren und anpassen:

```dotenv
OLLAMA_URL=http://localhost:11434
DATABASE_URL=sqlite+aiosqlite:///./questions.db
OPENAI_API_KEY=sk-...   # nur für Iteration 2 benötigt
```

---

## Docker-Deployment (Iteration 2)

```powershell
cd app
docker compose up --build
```

Dienste:
- **backend** – Port 8000 (FastAPI + Frontend)
- **ollama** – Port 11434 (lokales LLM)

Daten werden in Docker-Volumes persistiert (`db-data`, `ollama-models`).

---

## API-Endpunkte

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/health` | Liveness-Check → `{"status": "ok"}` |
| `GET` | `/openai/status` | Prüft ob Key gesetzt **und gültig** ist → `{configured, valid, error}` |
| `GET` | `/openai/models` | Dynamische Liste verfügbarer OpenAI-Chat-Modelle |
| `GET` | `/ollama/models` | Liste installierter Ollama-Modelle |
| `POST` | `/generate` | Frage generieren und in DB speichern |
| `GET` | `/questions` | Gespeicherte Fragen (optional: `?question_type=&difficulty=`) |
| `GET` | `/questions/{id}` | Einzelne Frage mit vollständigem XML |

### POST /generate – Request-Body

```json
{
  "question_type": "multichoice",
  "difficulty": "mittel",
  "description": "Frage über Java-Vererbung mit 4 Antworten",
  "model_source": "ollama",
  "model_name": "gemma3n:latest"
}
```

---

## Projektfortschritt

### ✅ Iteration 0 – Walking Skeleton (abgeschlossen)

| Story | Titel | SP | Status |
|---|---|---|---|
| US-00 | Technischer Durchstich | 5 | ✅ Done |

Ergebnis: End-to-End-Strecke (Eingabe → Ollama → XML → SQLite) funktioniert.  
Bonus: Dynamische Ollama-Modellliste (`GET /ollama/models`) bereits implementiert.

---

### ✅ Iteration 1 – Kernanwendung (abgeschlossen)

| Story | Titel | SP | Status |
|---|---|---|---|
| US-01 | Fragetyp auswählen | 3 | ✅ Done |
| US-02 | Aufgabenbeschreibung & Parameter | 3 | ✅ Done |
| US-03 | KI-Generierung mit Ollama | 3 | ✅ Done |
| US-04 | Prompt aus Template automatisch bauen | 3 | ✅ Done |
| US-05 | Vorschaufenster | 3 | ✅ Done |
| US-06 | Moodle-XML exportieren | 3 | ✅ Done |
| US-07 | Fragen in Datenbank speichern | 3 | ✅ Done |
| US-08 | Gespeicherte Fragen anzeigen und laden | 3 | ✅ Done |

Ergebnis: Alle Kern-Stories implementiert und per Smoke-Test + manuellen API-Checks abgenommen (08.03.2026).  
Validierungsergebnisse und Acceptance-Test-Protokolle: `app/user-stories.md` (Abschnitt „Arbeitsplan Heute“).

---

### ⏳ Iteration 2 – Docker, OpenAI, Templates (in Arbeit)

| Story | Titel | SP | Status |
|---|---|---|---|
| US-09 | Docker-Deployment | 3 | ⏳ Offen |
| US-10 | KI-Generierung mit OpenAI | 3 | ✅ Done |
| US-11 | Templates und Beispiele verwalten | 5 | ⏳ Offen |

> `Dockerfile` und `docker-compose.yml` sind bereits erstellt, aber noch nicht getestet.  
> OpenAI-Code ist im Backend vorhanden, aber deaktiviert (kein API-Key gesetzt).

---

### 🔲 Iteration 3 – Komfort & Qualität

| Story | Titel | SP | Status |
|---|---|---|---|
| US-12 | Ladeanzeige während Generierung | 2 | 🔲 Geplant |
| US-13 | XML-Ansicht mit Syntaxhervorhebung | 2 | 🔲 Geplant |
| US-14 | Fehlerbehandlung & Nutzerhinweise | 3 | 🔲 Geplant |

---

### 🔲 Iteration 4 – Optionaler Backlog

| Story | Titel | SP | Status |
|---|---|---|---|
| US-15 | Mehrere Fragen auf einmal generieren | 5 | 🔲 Optional |
| US-16 | Generierungshistorie filtern & suchen | 3 | 🔲 Optional |
| US-17 | Fragen bearbeiten und neu generieren | 5 | 🔲 Optional |
| US-18 | Fragen aus DB als XML-Batch exportieren | 3 | 🔲 Optional |
| US-19 | Mehrsprachigkeit (EN/DE) | 3 | 🔲 Optional |
| US-20 | Benutzerverwaltung | 8 | 🔲 Optional |

---

## Bekannte Einschränkungen

- `mxbai-embed-large` ist ein Embedding-Modell und eignet sich nicht für die Textgenerierung – wähle stattdessen z. B. `gemma3n:latest` oder `deepseek-r1:latest`.
- Das Frontend wird direkt von FastAPI als statische Dateien ausgeliefert. Bei Entwicklung über Live Server (Port 5500) muss der Backend-Port manuell angepasst werden (automatische Erkennung via `window.location.port` ist eingebaut).
- Die Datenbankdatei `questions.db` wird im Arbeitsverzeichnis des Backends erstellt und ist nicht im Repository eingecheckt.
