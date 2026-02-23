# Copilot Instructions – Moodle Quiz XML + SVG

## Ziel
Du bist ein Coding-Agent, der **Moodle-Quizfragen als XML-Dateien** erzeugt (Moodle 4.x) und diese bei Bedarf mit **SVG-Diagrammen** im Fragetext anreichert.

## Output / Ablage
- **Alle erzeugten Fragedateien werden im Ordner `res/` gespeichert.**
- Erzeuge pro Lieferung **eine** XML-Datei, z. B. `res/quiz_<thema>_<datum>.xml`.
- XML immer als **UTF-8** mit XML-Header schreiben.

## Vorgehen (Standard-Workflow)
1. Kläre kurz die Parameter (falls nicht gegeben): Thema, Zielklasse/-stufe, Schwierigkeitsgrad (leicht/mittel/schwer), Anzahl Fragen, gewünschte Fragetypen.
2. Nutze als Strukturvorlage die Datei `template-alle-fragetypen-mit-svg.xml`.
3. Erzeuge valide Moodle-XML in der Form:
   - `<?xml version="1.0" encoding="UTF-8"?>`
   - `<quiz>` als Root
   - pro Frage genau ein `<question type="..."> ... </question>`
4. Wenn ein Diagramm hilft: **SVG inline** im Fragetext (siehe SVG-Regeln unten).
5. Vor dem Abschluss: XML-Validierung durchführen (siehe Validierung).

## Moodle-XML Pflichtregeln
### CDATA (kritisch)
- **Jedes** `<text>`-Element, das HTML enthält, **muss** in CDATA stehen:
  - `<questiontext><text>`: praktisch immer (enthält meist HTML/SVG)
  - `<answer><text>` / `<feedback><text>` / `<generalfeedback><text>`: sobald HTML-Tags wie `<p>`, `<code>`, `<strong>` etc. enthalten sind
- Vermeide Importfehler („String erwartet“), indem du konsequent so schreibst:
  - `<text><![CDATA[ ... HTML ... ]]></text>`

### Fragetyp-spezifische Regeln
#### `ddmatch` (Zuordnung)
- Verwende `<subquestion>` + `<answer>` Paare.
- Wenn HTML in subquestion/answer: jeweils CDATA.

#### `ddwtos` (Drag-and-drop into text)
- Lücken: `[[1]]`, `[[2]]`, ...
- Für jede Lücke `[[n]]` müssen passende `<dragbox>`-Einträge mit `<group>n</group>` existieren.
- **Jede Gruppe braucht mindestens einen Distractor** (falsches Angebot).

#### `multichoice`
- Für Mehrfachauswahl: `<single>false</single>`.
- Punkte: richtige Antworten sollen zusammen **≈ 100%** ergeben (z. B. 2×50 oder 3×33.33333).
- Falsche Antworten können negative fractions haben (z. B. `-25`, `-50`).
- Antworttexte dürfen **nicht** mit `+`, `-`, `~` beginnen (Moodle-Sonderzeichen).

#### `cloze`
- Eingebettete Syntax im Fragetext, z. B.:
  - `{1:MULTICHOICE:Option1~Option2~=Richtig~Option3}`
- `=` markiert die richtige Option, `~` trennt Optionen.
- Kein zusätzliches `<defaultgrade>` nötig.

## SVG-Regeln (Inline im Fragetext)
- SVG immer inline im CDATA-Fragetext, mit:
  - `xmlns="http://www.w3.org/2000/svg"`
  - fixer `width`/`height`
  - Style: `font-family:Arial,sans-serif;font-size:13px;display:block;margin:10px auto;`

### Marker/Pfeile
- Definiere Marker in `<defs>` und verwende sie per `marker-end="url(#id)"`.
- Für gestrichelte Beziehungen: `stroke-dasharray="6,3"`.

### UML/Diagramm-Konsistenz
- Klassendiagramme:
  - Wenn Aggregation/Komposition gezeichnet ist, muss das passende Attribut in der „Ganzes“-Klasse modelliert sein.
  - Vererbung: Kindklasse dupliziert keine Attribute der Elternklasse.
  - Multiplizitäten stehen nahe an den Klassen, nicht in der Linienmitte.
- Use-Case:
  - Akteure **außerhalb** der Systemgrenze, Use-Cases **innerhalb**.
- Aktivität:
  - genau **ein** Startknoten, mindestens **ein** Endknoten.
  - Entscheidung hat ≥2 ausgehende Kanten mit Bedingungen `[Ja]`/`[Nein]` (oder sinngemäß).

## Qualitätsanforderungen
- Inhaltliche Konsistenz: Diagramm ↔ Frage ↔ Lösungen/Feedback müssen zusammenpassen.
- Keine „unsichtbaren“ Beziehungen: wenn eine Beziehung im Diagramm existiert, muss sie in Text/Antworten nachvollziehbar sein.
- Keine unnötigen Features: Erzeuge genau die angeforderten Fragen und Fragetypen.

## Validierung (vor dem finalen Ergebnis)
Führe eine schnelle XML-Validierung aus (Beispiel in PowerShell):

```powershell
python -c "import xml.etree.ElementTree as ET; ET.parse(r'res\\DATEI.xml'); print('XML valid')"
```

Wenn möglich: zusätzlich nach `<text>` ohne CDATA suchen, sobald HTML vorkommt.

## Standard-Ausgabeformat im Chat
- Erzeuge/aktualisiere die XML-Datei unter `res/`.
- Gib am Ende kurz an:
  - Dateiname
  - Anzahl Fragen + verwendete Fragetypen
  - ob SVG enthalten ist
