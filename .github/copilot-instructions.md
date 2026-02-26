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
- **Antworttextlänge neutralisieren:** Die richtige Antwort darf **nicht erkennbar die längste** sein. Alle Distraktoren müssen eine ähnliche Länge und Detailtiefe haben wie die korrekte Antwort – sonst ist die Lösung durch reines Abzählen der Zeichen erratbar.

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

### Netzwerktopologien – Cisco-Symbole (Pflicht)
- Bei **jeder** Netzwerktopologie-Darstellung (VLANs, Routing, Switching, IP-Netze, etc.) **müssen** die Symbole aus `symbols/cisco/` verwendet werden.
- Verfügbare Symbole (Pfad relativ zum Workspace-Root):
  | Datei | Symbol | viewBox |
  |---|---|---|
  | `symbols/cisco/router.svg` | Cisco Router (3D-Zylinder, blau) | `0 0 60 41` |
  | `symbols/cisco/switch.svg` | Cisco L2-Switch (3D-Gehäuse, blau) | `0 0 77 39` |
  | `symbols/cisco/pc.svg` | Cisco PC/Workstation (3D-Arbeitsplatz, blau) | `0 0 59 53` |
- **Einbettung:** Symbol-Pfade werden 1:1 aus der jeweiligen SVG-Datei als `<symbol id="...">` in den `<defs>`-Block des Fragen-SVG übernommen (CSS-Klassen als direkte Attribute auflösen, `xlink:href`-Referenzen intern umbenennen, damit pro Diagramm eindeutige IDs entstehen).
- **Keine selbst gezeichneten** Router/Switch/PC-Primitive (Kreise, Rechtecke, etc.) – ausschließlich die Inhalte aus `symbols/cisco/`.
- Trunk-Links und einfache Verbindungslinien werden weiterhin als SVG-`<line>`-Elemente gezeichnet (kein Symbol notwendig).

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
### Lösungsneutralität in SVG-Grafiken (kritisch)
**Die Grafik darf niemals die Lösung vorwegnehmen oder visuell verraten.** Konkret:
- **Keine farbliche Hervorhebung** von Elementen, die die gesuchte Antwort darstellen (z. B. eine gesuchte Zwischentabelle nicht orange/gelb einfärben, wenn „Zwischentabelle" die korrekte Antwort ist).
- **Keine Legenden**, die direkt auf die richtige Antwort hinweisen (z. B. „Pfeile = Fremdschlüsselbezüge" in einer Farbe, die mit der zu identifizierenden Sonderrolle assoziiert ist).
- **Alle gleichwertigen Elemente** (z. B. mehrere Tabellen, Klassen, Knoten) erhalten **einheitliche Farben und Rahmen** – es sei denn, die Aufgabe lautet ausdrücklich, den Unterschied der Farbe zu erklären.
- **Vor der Fertigstellung prüfen:** Könnte ein Schüler die richtige Antwort allein aus dem Diagramm ableiten, ohne die Frage zu lösen? Wenn ja → Grafik anpassen.

### Überschneidungsfreiheit in SVG-Grafiken (kritisch)
**Kein grafisches Element darf ein anderes überlagern oder unleserlich machen.**
- **Koordinaten rechnerisch prüfen:** Rechtecke, Ellipsen, Texte und Verbindungslinien dürfen sich nicht überlappen.
- **Mindestabstände einhalten:** Zwischen Boxen ≥ 10 px; Beschriftungen vollständig innerhalb der Box oder mit ≥ 5 px Abstand zur nächsten Box; Linien kreuzen keine Boxen, wenn eine Umgehung möglich ist.
- **Beschriftungen nicht durch Linien kreuzen lassen:** Verbindungslinien dürfen keine Texte schneiden; bei Bedarf Texte rechts/links/oberhalb der Grafik platzieren.
- **SVG `width`/`height` groß genug wählen**, sodass alle Elemente inkl. Markerspitzen innerhalb des sichtbaren Bereichs liegen (`refX`/`refY` des Markers einkalkulieren).
- **Textlänge schätzen:** Bei `font-size:13px` ≈ 7–8 px pro Zeichen; Boxbreite ≥ Textlänge × 8 px + 16 px Innenabstand.
- **Callout-Nummern (①②…)** dürfen keine anderen Elemente überdecken – Platz vor dem Element reservieren.

## Validierung (vor dem finalen Ergebnis)
Führe eine schnelle XML-Validierung aus (Beispiel in PowerShell):

```powershell
python -c "import xml.etree.ElementTree as ET; ET.parse(r'res\\DATEI.xml'); print('XML valid')"
```

Wenn möglich: zusätzlich nach `<text>` ohne CDATA suchen, sobald HTML vorkommt.

## Standard-Ausgabeformat im Chat
- Erzeuge/aktualisiere die XML-Datei unter `res/`.
- **Aktualisiere anschließend den Abschnitt „Enthaltene Fragendateien" in `README.md`**: neue Zeile in die Tabelle eintragen (Dateiname, Thema, Zielgruppe, Anzahl Fragen, Fragetypen) sowie den Eintrag in der Verzeichnisstruktur ergänzen.
- Gib am Ende kurz an:
  - Dateiname
  - Anzahl Fragen + verwendete Fragetypen
  - ob SVG enthalten ist
