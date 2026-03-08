---
applyTo: "app/**"
---

# Copilot Instructions – Moodle KI-Fragen-Generator (Web-App)

## Projekt-Übersicht
Webanwendung zur KI-gestützten Generierung von Moodle-Fragen als valides XML.  
Methode: **Extreme Programming (XP)** | Lastenheft-Version: **1.1**

---

## Wichtige Projektdateien

| Datei | Zweck |
|---|---|
| `app/lastenheft_moodle_ki_webapp.md` | Lastenheft v1.1 – fachliche Anforderungen |
| `app/user-stories.md` | XP User Stories US-00 bis US-20 mit Story Points, Prio, Acceptance Tests |
| `app/README.md` | Technische Projektdokumentation, Architektur, API, Iterationsfortschritt |
| `app/backend/main.py` | FastAPI-Backend (einzige Backend-Sourcedatei) |
| `app/backend/import_res.py` | Utility-Skript: importiert alle XMLs aus `res/` in `questions.db` |
| `app/frontend/index.html` | HTML-Struktur des Frontends |
| `app/frontend/styles.css` | CSS-Stile (ausgelagert) |
| `app/frontend/script.js` | JavaScript-Logik (ausgelagert) |
| `app/backend/requirements.txt` | Python-Abhängigkeiten |
| `app/backend/.env` | Lokale Konfiguration (nicht im Repository) |
| `app/backend/.env.example` | Konfigurationsvorlage mit allen Variablen |
| `app/docker-compose.yml` | Docker-Stack (backend + ollama) |
| `app/backend/Dockerfile` | Container-Image auf Basis `python:3.13-slim` |

---

## Technologie-Stack

- **Python 3.14** – tatsächlich verwendeter Interpreter auf diesem Rechner  
  Pfad: `C:\Users\Horn\AppData\Local\Programs\Python\Python314\python.exe`  
  > Wichtig: `python` auf dem PATH zeigt auf Python 3.13 – für `pip install` immer den vollen Pfad oder `py -3.14` verwenden.
- **FastAPI + uvicorn** – Backend-Framework, Start mit `python -m uvicorn main:app --reload --port 8000`
- **SQLAlchemy 2.x async + aiosqlite** – DB-Schicht, SQLite-Datei `questions.db` im Backend-Verzeichnis
- **Ollama** – lokales LLM auf `http://localhost:11434` (primäre LLM-Quelle)
- **OpenAI SDK** – deferred, ab Iteration 2 (Code vorhanden, kein API-Key gesetzt)
- **Vanilla HTML/JS** – kein Build-Tool, Frontend liegt in `app/frontend/index.html`

---

## Architektur-Entscheidungen

- **Ollama-First:** Iteration 0 + 1 verwenden ausschließlich lokale Modelle via Ollama.  
  OpenAI ist Code-seitig vorbereitet, wird erst in Iteration 2 aktiviert.
- **Single-File-Backend:** Alle Backend-Logik in `app/backend/main.py`  
  (DB-Modell, Routen, LLM-Calls, Prompt-Building, Static-Mount).
- **Split-Frontend:** `app/frontend/` enthält drei separate Dateien:
  - `index.html` – HTML-Struktur (verweist per `<link>`/`<script>` auf die anderen Dateien)
  - `styles.css` – alle CSS-Stile
  - `script.js` – alle JavaScript-Logik
  FastAPI serviert das gesamte Verzeichnis als statische Dateien.
- **Statische Dateien:** FastAPI serviert das Frontend aus `../frontend` (relative zum Backend-Verzeichnis).  
  BACKEND-URL wird im Frontend auto-detektiert: `window.location.port === "8000" ? "" : "http://localhost:8000"`.
- **DB-Initialisierung:** Tabellen werden im `lifespan`-Context-Manager beim Start erstellt.

---

## Datenmodell (SQLite – Tabelle `questions`)

| Spalte | Typ | Bedeutung |
|---|---|---|
| `id` | INTEGER PK | Auto-Increment |
| `question_type` | STRING(50) | z. B. `multichoice`, `cloze`, `coderunner` |
| `difficulty` | STRING(20) | `leicht` / `mittel` / `schwer` |
| `model_source` | STRING(20) | `ollama` oder `openai` |
| `model_name` | STRING(100) | z. B. `gemma3n:latest` |
| `description` | TEXT | Freitext-Aufgabenbeschreibung |
| `xml_output` | TEXT | Generiertes Moodle-XML |
| `created_at` | DATETIME | UTC-Zeitstempel |

---

## API-Endpunkte

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/health` | `{"status": "ok"}` |
| `GET` | `/ollama/models` | Installierte Ollama-Modelle aus `/api/tags` |
| `POST` | `/generate` | Generiert Frage, speichert in DB, gibt `{"xml": ..., "id": ...}` zurück |
| `GET` | `/questions` | Gespeicherte Fragen, optional `?question_type=&difficulty=&limit=` |
| `GET` | `/questions/{id}` | Vollständiger Datensatz inkl. XML |

---

## Konfiguration (.env)

```dotenv
OLLAMA_URL=http://localhost:11434
DATABASE_URL=sqlite+aiosqlite:///./questions.db
OPENAI_API_KEY=sk-...   # erst ab Iteration 2
```

Im Docker-Betrieb: `OLLAMA_URL=http://ollama:11434`, `DATABASE_URL=sqlite+aiosqlite:////data/questions.db`

---

## Installierte Ollama-Modelle (Stand 08.03.2026)

| Modell | Typ |
|---|---|
| `gemma3n:latest` | Textgenerierung ✅ |
| `deepseek-r1:latest` | Textgenerierung ✅ |
| `llama3.2-vision:latest` | Textgenerierung ✅ |
| `gpt-oss:20b` | Textgenerierung ✅ |
| `mxbai-embed-large:latest` | ⚠️ Embedding-Modell – nicht für Generierung geeignet |

---

## Iterationsstand

| Iteration | Inhalt | Status |
|---|---|---|
| **0** | Walking Skeleton (Ollama + DB + Health) | ✅ Abgeschlossen |
| **1** | Fragetyp-UI, Prompt-Templates, Vorschau, Export, DB-UI | ⏳ In Arbeit |
| **2** | Docker-Test, OpenAI, Template-Verwaltung | 🔲 Geplant |
| **3** | Ladeanzeige, Syntaxhervorhebung, Fehlerbehandlung | 🔲 Geplant |
| **4** | Batch-Export, Filter/Suche, Mehrsprachigkeit, … | 🔲 Optional |

Vollständige Story-Liste mit Acceptance Tests: `app/user-stories.md`

---

## XP-Konventionen

- Story Points: Fibonacci-Skala 1–2–3–5–8–13
- Jede Änderung an Scope oder Architektur → `app/user-stories.md` aktualisieren
- Neue Erkenntnisse zu Architektur / Technologie → diese Datei aktualisieren
- Lastenheft-Änderungen → Version in `app/lastenheft_moodle_ki_webapp.md` hochzählen und User Stories anpassen

---

## Bekannte Fallstricke

- `python` auf dem PATH zeigt auf 3.13, uvicorn läuft unter 3.14 → immer mit vollem Interpreter-Pfad arbeiten.
- `mxbai-embed-large` nicht für Textgenerierung verwenden.
- Docker-Compose noch nicht getestet (Iteration 2).
- `questions.db` liegt im Backend-Arbeitsverzeichnis und ist in `.gitignore` (nicht eingecheckt).
- Frontend über Live Server (Port 5500) erfordert laufendes Backend auf Port 8000; CORS ist für `localhost:5500` bereits konfiguriert.
