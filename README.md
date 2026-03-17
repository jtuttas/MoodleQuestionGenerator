# MoodleQuestionGenerator

Dieses Repository dient der Erstellung von Moodle-Quizfragen für Moodle 4.x.
Die Ausgabe besteht standardmäßig aus einer XML-Datei für den Import und einer HTML-Vorschau zur Sichtprüfung.

## Zweck
- Generierung von Moodle-Quizfragen aus Themenvorgaben
- Unterstützung für SVG-Diagramme im Fragetext
- Erzeugung einer HTML-Vorschau zusätzlich zur XML-Datei
- Ablage der erzeugten Dateien im Ordner `res/`

## Führende Dokumente
Die README ist bewusst nur eine Übersicht. Fachliche Regeln werden nicht doppelt gepflegt.

Maßgeblich sind diese Dateien in dieser Reihenfolge:
1. `.github/instructions/questions.instructions.md`
2. `SKILL.md`
3. `moodle-xml-struktur-referenz.md`
4. `templates/README.md`

Hinweis zum Dokumentstatus:
- `moodle-xml-struktur-referenz.md` ist nur noch ein technischer Schnelllookup für XML-Struktur und Importprüfungen.
- Die frühere Datei `moodle-xml-svg-fragen.instructions.md` wurde entfernt, damit keine konkurrierende Alt-Spezifikation mehr im Repository liegt.

## Arbeitsprinzip
Für neue Aufgaben werden passende Vorlagen aus dem Ordner `templates/` verwendet.
Die frühere Sammelvorlage `template-alle-fragetypen-mit-svg.xml` wird nicht mehr verwendet.
Erzeugte Ergebnisse werden unter `res/` gespeichert.
Pro Lieferung werden in der Regel erzeugt:

- eine XML-Datei im Format `quiz_<thema>_<datum>.xml`
- eine HTML-Vorschau mit passendem Namen

## Wichtige Ordner
- `res/`: erzeugte XML-Dateien und HTML-Vorschauen
- `templates/`: Vorlagen für Fragetypen und Aufgabenschemata
- `symbols/cisco/`: Cisco-Symbole für Netzwerktopologien
- `app/`: Anwendungslogik, Tests und Hilfswerkzeuge

## Enthaltene Fragendateien
Dieser Abschnitt dient nur als knappe Übersicht und kann bei neuen Generierungen ergänzt werden.

| Datei | Thema | Zielgruppe | Fragen | Fragetypen |
|---|---|---|---|---|
| `quiz_klassendiagramm_ddwtos_20260315.xml` | UML-Klassendiagramme | FOS/BOS Informatik / OOP | 3 | ddwtos, ddmatch |
| `quiz_klassendiagramm_tierheim_komposition_20260316.xml` | UML-Komposition, Aggregation, Assoziation | FOS/BOS Informatik / OOP | 1 | ddwtos |
| `quiz_vlsm_systemintegration_20260316.xml` | VLSM-Netzplanung | FI Systemintegration | 3 | multichoice, ddwtos, cloze |
| `quiz_vlsm_systemintegration_weiterfuehrend_20260316.xml` | VLSM-Netzplanung weiterführend | FI Systemintegration | 3 | ddmatch, ddwtos, ordering |

## Nutzung
Für eine neue Generierung sind typischerweise diese Angaben nötig:

- Thema
- Zielgruppe
- Schwierigkeitsgrad
- Anzahl Fragen
- gewünschte Fragetypen

## Import in Moodle
1. Kurs öffnen.
2. Fragensammlung aufrufen.
3. Fragen importieren wählen.
4. Format `Moodle XML` auswählen.
5. XML-Datei aus `res/` hochladen.

## Hinweise
- Die HTML-Vorschau ist für die Sichtprüfung gedacht, nicht für den Moodle-Import.
- Detailregeln zu CDATA, SVG, CodeRunner, Fragetypen und HTML-Vorschau stehen ausschließlich in den führenden Dokumenten.
