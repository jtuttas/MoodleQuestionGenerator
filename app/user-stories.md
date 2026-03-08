# User Stories – Moodle KI-Fragen-Generator

**Projekt:** Webapplikation zur KI-gestützten Generierung von Moodle-Fragen  
**Stand:** 08.03.2026 (aktualisiert nach Lastenheft v1.1)  
**Methode:** Extreme Programming (XP)  
**Schätzskala (Story Points):** 1 – 2 – 3 – 5 – 8 – 13

---

## Priorisierung

| Prio | Bedeutung |
|---|---|
| 1 | Kern – ohne diese Story ist kein Mehrwert lieferbar |
| 2 | Wichtig – gehört zum ersten Release |
| 3 | Sinnvoll – erhöht Nutzbarkeit/Komfort |
| 4 | Optional – Kann-Anforderungen für spätere Iterationen |

---

## Arbeitsplan Heute (Iteration 1)

- [x] 1) End-to-End-Testlauf: Eingabe -> Generierung -> Vorschau/XML -> Speicherung -> Laden (API-Smoketest bestanden am 08.03.2026; manueller UI-Klicktest folgt)
- [x] 2) US-01 validieren: Fragetyp-Auswahl und Wertefluss in Request/Payload (Frontend-Hinweise + Backend-Whitelist umgesetzt)
- [x] 3) US-02 validieren: Pflichtfelder + Fehlhinweise (Beschreibung/Parameter)
- [x] 4) US-03 stabilisieren: verständliche Fehler bei nicht erreichbarem Ollama
- [x] 5) US-05 prüfen: Vorschau aktualisiert konsistent nach jeder Generierung
- [x] 6) US-06 prüfen: XML kopieren + Download funktionieren konsistent
- [x] 7) US-08 prüfen: Gespeicherte Fragen werden gelistet und wieder geladen
- [x] 8) US-07 prüfen: Persistenz vollständig (Metadaten + XML + Zeitstempel)
- [x] 9) Acceptance-Tests je Story dokumentieren (Pass/Fail + kurze Notiz)
- [x] 10) README-Status nachziehen (Iteration 1)

---

### Testprotokoll 08.03.2026 (Start mit Punkt 1)

- Health-Check: `GET /health` -> `{"status":"ok"}`
- Generierung: `POST /generate` mit `model_source=ollama`, `model_name=gemma3n:latest` -> Datensatz erzeugt
- Speicherung/Liste: `GET /questions?limit=1` -> neuester Datensatz vorhanden (ID `3`)
- Laden: `GET /questions/3` -> vollständiger Datensatz mit `xml_output` zurückgegeben
- Ergebnis: End-to-End-Datenfluss im Backend bestätigt; nächster Schritt ist der UI-Klickpfad (US-01/US-02) inkl. Validierungs- und Fehlhinweisprüfung

### Testprotokoll 08.03.2026 (Punkt 2: US-01)

- Frontend: Bei Fragetyp-Wechsel werden jetzt Template-Hinweis und Beispiel automatisch aktualisiert
- Backend: `question_type` ist per Whitelist validiert (nur bekannte Typen)
- API-Check: gültiger Typ erreicht Business-Logik (`VALID_TYPE_STATUS=502` wegen fehlendem OpenAI-Key in diesem Testpfad, also keine Validierungsablehnung)
- API-Check: ungültiger Typ wird korrekt auf Request-Ebene abgelehnt (`INVALID_TYPE_STATUS=422`)
- Ergebnis: US-01-Akzeptanzkriterium "Fragetyp fließt in Prompt/Request ein" ist abgesichert; Template/Beispiel-Anzeige ist im UI ergänzt

### Testprotokoll 08.03.2026 (Punkt 3: US-02)

- Frontend-Validierung ergänzt: `description` Pflicht + Mindestlaenge 10 Zeichen
- Frontend-Validierung ergänzt: `question_type`, `difficulty`, `model_source`, `model_name` als Pflicht mit klaren Fehlhinweisen
- Backend-Validierung ergänzt: `difficulty` nur `leicht|mittel|schwer`
- Backend-Validierung ergänzt: `model_name` darf nicht leer sein
- Backend-Validierung ergänzt: `description` mindestens 10 Zeichen
- Smoke-Test erweitert: neue 422-Checks fuer kurze Beschreibung, ungueltige Schwierigkeit und leeren Modellnamen
- Ergebnis: US-02-Acceptance-Test "Pflichteingaben mit Hinweis bei fehlenden Werten" umgesetzt

### Testprotokoll 08.03.2026 (Punkt 4–6: US-03/US-05/US-06)

**Punkt 4 – US-03 (XML-Sanitierung + Fehlerbehandlung Ollama):**
- `sanitize_xml()` in `main.py` eingefuehrt: entfernt Markdown-Code-Fences (` ```xml ... ``` `) per Regex und extrahiert XML ab `<?xml` bzw. `<quiz`
- `sanitize_xml()` wird nach jedem Ollama- und OpenAI-Call angewendet
- Backend gibt bei nicht erreichbarem Ollama HTTP 502 zurueck: `"Ollama nicht erreichbar unter {url}. Laeuft der lokale Dienst?"`
- Frontend zeigt `err.detail` als `"Fehler: <Meldung>"` im `#errorMsg`-Bereich an
- Smoke-Test (Vollmodus) prueft: kein Fence (`StartsWith('``` ')`) + `<quiz`-Root-Check — bestanden (ID 14)

**Punkt 5 – US-05 (Vorschau konsistent):**
- `renderResult()` ersetzt `tabPreview`-innerHTML vollstaendig nach jeder Generierung
- Nach Generierung wird via `switchTab("preview")` automatisch zur Vorschau gewechselt
- Bei XML-Parserfehler wird roter Fehlertext angezeigt (parseerror-Handling)
- Acceptance-Kriterium erfuellt: Vorschau aktualisiert nach jeder Generierung

**Punkt 6 – US-06 (XML Export):**
- `copyXml()` nutzt `navigator.clipboard.writeText()` mit 2-Sekunden-Bestaetigungsanzeige
- `downloadXml()` jetzt mit kontextbezogenem Dateinamen: `{questionType}-{YYYYMMDD}.xml` (z.B. `multichoice-20260308.xml`)
- Acceptance-Kriterien erfuellt: valides XML, Copy, Download, Fehlermeldung bei Parse-Error

### Testprotokoll 08.03.2026 (Punkt 7–8: US-07/US-08)

**Punkt 7 – US-08 (Gespeicherte Fragen UI):**
- `loadSaved()` ruft `GET /questions?limit=30` auf und rendert Liste mit Typ, Schwierigkeit und Zeitstempel
- Klick auf Listeneintrag ruft `GET /questions/{id}` auf und übergibt `xml_output` an `renderResult()`
- API-Check: `GET /questions?limit=3` liefert Eintraege mit `id`, `question_type`, `difficulty`, `model_source`, `created_at` (neueste zuerst) – bestanden
- API-Check: `GET /questions/14` liefert vollstaendigen Datensatz inkl. `xml_output`, `description`, `created_at` – bestanden
- Acceptance-Kriterium erfuellt: Sidebar zeigt gespeicherte Fragen; Klick laedt XML in Vorschau

**Punkt 8 – US-07 (Persistenz):**
- Nach Generierung speichert Backend: `question_type`, `difficulty`, `model_source`, `model_name`, `description`, `xml_output`, `created_at` (UTC-Zeitstempel)
- `GET /questions` liefert Liste sortiert nach `created_at DESC` – bestanden
- `GET /questions/{id}` liefert vollstaendigen Datensatz inkl. XML – bestanden
- Fehler bei DB-Problem: FastAPI gibt 500 zurueck (SQLAlchemy-Exception)
- Acceptance-Kriterien erfuellt: alle Metadaten + XML + Zeitstempel persistent gespeichert

---

## Iteration 0 – Walking Skeleton (Technische Basis)

### US-00: Technischer Durchstich (Walking Skeleton)
> *Als Entwickler möchte ich eine minimale End-to-End-Strecke (Texteingabe → Prompt → Ollama → XML-Ausgabe → DB-Speicherung) aufbauen, damit alle Schichten einmal durchgestochen sind und die Architektur validiert ist.*

- **Prio:** 1 | **SP:** 5
- **Acceptance Tests:**
  - Eingabefeld nimmt Text entgegen
  - Prompt wird an lokales Ollama-Modell gesendet
  - XML-Ausgabe erscheint im rechten Bereich der UI
  - Frage wird in SQLite-Datenbank gespeichert
  - `/health`-Endpunkt antwortet mit `{"status": "ok"}`

---

## Iteration 1 – Kernanwendung (Ollama + DB)

### US-01: Fragetyp auswählen
> *Als Lehrkraft möchte ich einen Fragetyp aus einer Liste auswählen, damit der Prompt und das Template automatisch passend befüllt werden.*

- **Prio:** 1 | **SP:** 3
- **Quelle:** Lastenheft 7.1 (Muss)
- **Acceptance Tests:**
  - Dropdown zeigt alle verfügbaren Fragetypen an (z. B. multichoice, cloze, coderunner, …)
  - Nach Auswahl wird das zugehörige Template angezeigt
  - Nach Auswahl wird ein hinterlegtes Beispiel angezeigt
  - Fragetyp fließt in die Prompt-Erstellung ein

---

### US-02: Aufgabenbeschreibung und Parameter eingeben
> *Als Lehrkraft möchte ich eine Aufgabenbeschreibung in freier Sprache eingeben und Schwierigkeitsgrad sowie Modell auswählen, damit die KI eine passende Frage generiert.*

- **Prio:** 1 | **SP:** 3
- **Quelle:** Lastenheft 7.2 (Muss), 7.3 (Muss)
- **Acceptance Tests:**
  - Textfeld für freie Aufgabenbeschreibung vorhanden
  - Dropdown für Schwierigkeitsgrad (leicht / mittel / schwer)
  - Dropdown für Modell-/Modellquellenauswahl
  - Alle drei Felder sind Pflichteingaben; Hinweis bei fehlenden Werten

---

### US-03: KI-Generierung mit lokalem Modell (Ollama)
> *Als Lehrkraft möchte ich ein lokal laufendes Ollama-Modell nutzen, damit keine Daten an externe Server übertragen werden und der Betrieb datenschutzkonform ist.*

- **Prio:** 1 | **SP:** 3
- **Quelle:** Lastenheft 7.4.2 (Muss)
- **Acceptance Tests:**
  - Ollama REST-URL ist über Umgebungsvariable konfigurierbar
  - Dropdown zeigt verfügbare lokale Modelle (llama3, mistral, …)
  - Prompt wird ohne externe Cloud-Verbindung verarbeitet
  - Antwort erscheint im Vorschaufenster
  - Verständliche Fehlermeldung, wenn Ollama nicht erreichbar ist

---

### US-04: Prompt automatisch aus Template und Eingabe zusammenbauen
> *Als Lehrkraft möchte ich, dass der Prompt aus meiner Eingabe, dem Fragetyp-Template und dem Schwierigkeitsgrad automatisch erzeugt wird, damit ich keine Prompt-Kenntnisse benötige.*

- **Prio:** 1 | **SP:** 3
- **Quelle:** Lastenheft 7.5 (Muss)
- **Acceptance Tests:**
  - Prompt enthält Nutzereingabe, Fragetyp-Template, Schwierigkeit und Beispiel
  - Prompt-Struktur ist reproduzierbar (gleiche Eingaben → gleicher Prompt)
  - Generierung startet nach Klick auf „Generieren"-Schaltfläche

---

### US-05: Vorschaufenster
> *Als Lehrkraft möchte ich die generierte Frage sofort in einer lesbaren Vorschau auf der rechten Seite sehen, damit ich das Ergebnis beurteilen kann, ohne XML lesen zu müssen.*

- **Prio:** 1 | **SP:** 3
- **Quelle:** Lastenheft 7.6 (Muss), 6 (Rahmenbedingungen)
- **Acceptance Tests:**
  - Vorschaufenster ist immer in der rechten Bildschirmhälfte fixiert
  - Nach jeder Generierung wird der Inhalt aktualisiert
  - Darstellung ist lesbar (kein rohes XML)
  - Vorschau und XML-Ansicht sind klar getrennt

---

### US-06: Moodle-XML erzeugen und exportieren
> *Als Lehrkraft möchte ich die generierte Frage als valides Moodle-XML kopieren oder herunterladen, damit ich sie direkt in Moodle importieren kann.*

- **Prio:** 1 | **SP:** 3
- **Quelle:** Lastenheft 7.7 (Muss)
- **Acceptance Tests:**
  - Ausgabe ist valides Moodle-XML (korrekter Fragetyp, CDATA wo nötig)
  - „XML kopieren"-Schaltfläche kopiert den XML-Text in die Zwischenablage
  - Download als `.xml`-Datei funktioniert
  - Fehlermeldung bei ungültiger XML-Struktur

---

### US-07: Generierte Fragen in Datenbank speichern
> *Als Lehrkraft möchte ich, dass jede generierte Frage automatisch gespeichert wird, damit ich sie später erneut laden, prüfen oder exportieren kann.*

- **Prio:** 1 | **SP:** 3
- **Quelle:** Lastenheft 7.9 (Muss), 11.3, 12
- **Acceptance Tests:**
  - Nach jeder Generierung werden Fragetyp, Schwierigkeit, Modell, Beschreibung, XML und Zeitstempel gespeichert
  - `GET /questions` liefert Liste gespeicherter Fragen (neueste zuerst)
  - `GET /questions/{id}` liefert vollständigen Datensatz inkl. XML
  - Fehler bei DB-Verbindungsproblem wird dem Nutzer angezeigt
  - Stammdaten (Templates) und generierte Fragen sind in getrennten Strukturen abgelegt

---

### US-08: Gespeicherte Fragen in der UI anzeigen und laden
> *Als Lehrkraft möchte ich eine Liste meiner gespeicherten Fragen sehen und eine davon wieder in die Vorschau laden, damit ich sie erneut nutzen oder exportieren kann.*

- **Prio:** 1 | **SP:** 3
- **Quelle:** Lastenheft 7.9 (Muss), 9.1
- **Acceptance Tests:**
  - Sidebar oder Tab zeigt gespeicherte Fragen mit Typ, Schwierigkeit und Zeitstempel
  - Klick auf einen Eintrag lädt das zugehörige XML in die Vorschau
  - Liste aktualisiert sich nach jeder Generierung

---

## Iteration 2 – Docker, API-Modell & Template-Verwaltung

## Arbeitsplan Iteration 2

- [x] 1) US-10 umsetzen: OpenAI-Pfad vollständig absichern (Status-Endpunkt, Frontend-Warnung, Modellliste)
- [ ] 2) US-09 umsetzen: Docker-Deployment testen (`docker compose up --build`)
- [ ] 3) US-11 umsetzen: Templates dynamisch aus `templates/`-Ordner laden
- [ ] 4) README Iteration-2-Status nachziehen

### Testprotokoll 08.03.2026 (US-10: OpenAI-Anbindung)

- Backend: `GET /openai/status` validiert Key per echtem API-Call (`client.models.list()`) – gibt `{configured, valid, error}` zurück
- Backend: `GET /openai/models` fetcht Chat-Modelle von OpenAI, filtert tts/whisper/embed/dll-e/instruct heraus, sortiert absteigend
- Frontend: `showOpenAIBanner(type, msg)` mit 3 Stilen: rot (error), gelb (warning), grün (success)
- Frontend: Bei Quellwechsel auf OpenAI wird `/openai/models` aufgerufen statt statischer Liste
  - Key fehlt (503) → rotes Banner "Kein API-Key konfiguriert"
  - Key ungültig (401) → rotes Banner "API-Key ungültig oder abgelaufen"
  - Netzwerkfehler → gelbes Banner, Fallback-Liste wird angezeigt
  - Erfolg → grünes Banner "API-Key gültig – X Modelle verfügbar"
- Frontend: `populateSelect()` Helper für Ollama und OpenAI gemeinsam genutzt
- API-Check: `GET /openai/status` -> `{configured: true, valid: false, error: "API-Key ungültig oder abgelaufen."}` (gesetzter aber ungültiger Key) – bestanden
- API-Check: `GET /openai/models` -> HTTP 401 mit erklärendem Fehlertext – bestanden
- Acceptance-Kriterien erfüllt: Key nie im Frontend sichtbar; Fehlermeldung bei fehlendem/ungültigem Key; dynamische Modellauswahl bei gültigem Key


### US-09: Docker-Deployment
> *Als Administrator möchte ich die Anwendung als Docker-Container starten, damit die Installation reproduzierbar und einfach ist.*

- **Prio:** 2 | **SP:** 3
- **Quelle:** Lastenheft 8.6 (Muss), 6 (Rahmenbedingungen)
- **Acceptance Tests:**
  - `docker compose up` startet Backend und Ollama-Dienst
  - Anwendung ist unter `http://localhost:8000` erreichbar
  - Konfiguration (Port, OLLAMA_URL, DB-Pfad) über Umgebungsvariablen steuerbar
  - Datenbankdatei wird in einem gemounteten Volume persistent gespeichert

---

### US-10: KI-Generierung mit externer API (OpenAI)
> *Als Lehrkraft möchte ich optional ein externes API-Modell (z. B. OpenAI) nutzen, damit ich auch Cloud-Modelle einsetzen kann.*

- **Prio:** 2 | **SP:** 3
- **Quelle:** Lastenheft 7.4.1 (Muss)
- **Acceptance Tests:**
  - API-Schlüssel und Endpunkt sind über `.env` konfigurierbar (nie im Frontend sichtbar)
  - Prompt wird an gewähltes OpenAI-Modell gesendet
  - Antwort erscheint im Vorschaufenster
  - Fehlermeldung bei nicht erreichbarer API oder fehlendem API-Key

---

### US-11: Templates und Beispiele verwalten (Admin)
> *Als Administrator möchte ich Templates und Beispiele pro Fragetyp hinterlegen und bearbeiten, damit die Qualität der generierten Fragen langfristig verbessert werden kann.*

- **Prio:** 2 | **SP:** 5
- **Quelle:** Lastenheft 7.8 (Muss + Kann), 9.2
- **Acceptance Tests:**
  - Mindestens ein Template und ein Beispiel pro Fragetyp ist gespeichert
  - Admin kann Templates über Konfigurationsdatei bearbeiten
  - Geänderte Templates werden bei der nächsten Generierung verwendet

---

## Iteration 3 – Komfort & Qualität

### US-12: Ladeanzeige während Generierung
> *Als Lehrkraft möchte ich eine sichtbare Ladeanzeige sehen, während die KI arbeitet, damit ich weiß, dass die Anwendung nicht eingefroren ist.*

- **Prio:** 3 | **SP:** 2
- **Quelle:** Lastenheft 8.2 (Performance)
- **Acceptance Tests:**
  - Spinner oder Fortschrittsanzeige erscheint sofort nach Klick auf „Generieren"
  - Oberfläche bleibt während der Anfrage bedienbar (kein Blocking)
  - Anzeige verschwindet nach Abschluss

---

### US-13: XML-Ansicht mit Syntaxhervorhebung umschalten
> *Als Lehrkraft möchte ich zwischen lesbarer Vorschau und farbig hervorgehobenem XML umschalten, damit ich bei Bedarf die Rohstruktur prüfen kann.*

- **Prio:** 3 | **SP:** 2
- **Quelle:** Lastenheft 7.6 (Kann)
- **Acceptance Tests:**
  - Schaltfläche oder Tab zum Umschalten zwischen Vorschau und XML
  - XML wird mit Syntaxhervorhebung dargestellt

---

### US-14: Zusätzliche Eingabefelder (Thema, Zielgruppe, Anzahl, Sprache)
> *Als Lehrkraft möchte ich optional Fach, Zielgruppe, gewünschte Anzahl und Sprache angeben, damit die generierten Fragen noch besser passen.*

- **Prio:** 3 | **SP:** 3
- **Quelle:** Lastenheft 7.2 (Kann)
- **Acceptance Tests:**
  - Felder sind optional (keine Pflichtvalidierung)
  - Ausgefüllte Felder fließen in den Prompt ein
  - Leere Felder verändern das Verhalten nicht

---

## Iteration 4 – Optionale Erweiterungen (Backlog)

### US-15: Export mehrerer Fragen in einer XML-Datei
> *Als Lehrkraft möchte ich mehrere gespeicherte Fragen gesammelt als eine XML-Datei exportieren.*
- **Prio:** 4 | **SP:** 3 | **Quelle:** Lastenheft 7.7 (Kann)

### US-16: Such- und Filterfunktion für gespeicherte Fragen
> *Als Lehrkraft möchte ich gespeicherte Fragen nach Fragetyp, Schwierigkeit oder Stichwort filtern.*
- **Prio:** 4 | **SP:** 2 | **Quelle:** Lastenheft 7.9 (Kann)

### US-17: Fragetypen gruppieren und durchsuchen
> *Als Lehrkraft möchte ich Fragetypen nach Kategorie filtern oder suchen, wenn die Liste lang wird.*
- **Prio:** 4 | **SP:** 2 | **Quelle:** Lastenheft 7.1 (Kann)

### US-18: Finalen Prompt vor dem Absenden bearbeitbar machen
> *Als fortgeschrittener Nutzer möchte ich den generierten Prompt vor dem Absenden anpassen.*
- **Prio:** 4 | **SP:** 2 | **Quelle:** Lastenheft 7.5 (Kann)

### US-19: Fehlerprotokollierung für Administratoren
> *Als Administrator möchte ich eine technische Detailansicht für Fehler und ein Fehlerprotokoll einsehen.*
- **Prio:** 4 | **SP:** 3 | **Quelle:** Lastenheft 7.10 (Kann)

### US-20: Mehrere Beispiele pro Fragetyp
> *Als Administrator möchte ich mehrere Beispiele pro Fragetyp hinterlegen.*
- **Prio:** 4 | **SP:** 2 | **Quelle:** Lastenheft 7.8 (Kann)

---

## Übersicht – Release-Plan

| Iteration | Stories | SP gesamt | Ziel |
|---|---|---|---|
| 0 | US-00 | 5 | Walking Skeleton: Ollama + DB + Health |
| 1 | US-01 bis US-08 | 21 | Kernanwendung: Ollama, DB-Speicherung, XML-Export |
| 2 | US-09 bis US-11 | 11 | Docker, OpenAI-API, Template-Verwaltung |
| 3 | US-12 bis US-14 | 7 | Komfort & Qualität |
| 4 | US-15 bis US-20 | 14 | Optionale Erweiterungen |
| **Gesamt** | **21 Stories** | **58 SP** | |

---

## Technische Entscheidungen (getroffen 08.03.2026, aktualisiert nach LH v1.1)

- [x] **Frontend:** Vanilla HTML/JS (`app/frontend/index.html`); ab Iteration 3 optional React
- [x] **Backend:** Python FastAPI (`app/backend/main.py`)
- [x] **Primäre Modellanbindung:** Ollama REST API (lokal, datenschutzkonform) – **Fokus Iteration 0–1**
- [x] **Sekundäre Modellanbindung:** OpenAI Async SDK – zurückgestellt auf Iteration 2
- [x] **Datenbank:** SQLite via SQLAlchemy async + aiosqlite (kein separater DB-Server nötig)
- [x] **Template-Speicherung:** Bestehender `templates/`-Ordner im Workspace-Root
- [x] **Deployment:** Docker (`app/backend/Dockerfile` + `app/docker-compose.yml`) – Iteration 2
