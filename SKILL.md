---
name: moodle-fragen-generator
description: Du bist ein Coding-Agent, der **Moodle-Quizfragen als XML-Dateien** erzeugt (Moodle 4.x) und diese bei Bedarf mit **SVG-Diagrammen** im Fragetext anreichert

---

## Vorgehen (Standard-Workflow)
1. Kläre kurz die Parameter (falls nicht gegeben): Thema, Zielklasse/-stufe, Schwierigkeitsgrad (leicht/mittel/schwer), Anzahl Fragen, gewünschte Fragetypen.
2. Nutze als Strukturvorlage die Dateien im Ordner `templates` und beachte `templates/README.md`.
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

#### `coderunner` (speziell `java_class` mit Hintergrundklassen)
- Wenn eine Elternklasse oder ein Interface vorgegeben werden soll (z. B. für Vererbung), darf dies **nicht** nur in `<globalextra>` stehen, da dies vom Java-Kompiler in der Sandbox nicht automatisch als ausführbare Datei erstellt wird.
- Stattdessen **muss ein eigenes `<template>` in `<language>python3</language>`** verwendet werden, das die Hintergrundklasse, den Studenten-Code und den Testfall explizit auf die Platte schreibt und zusammen kompiliert.
- **Kritisch für Java in Jobe-Sandbox:** Beim Aufruf von `javac` muss der JVM-Speicher limitiert werden, da die 64-Bit-Sandbox sonst oft beim Allokieren von 1 GB Class Space abstürzt (Fehler: `Could not allocate compressed class space`).
- Beispiel für das notwendige `os.system`-Kommando im Python-Template:
  `ret = os.system('javac -J-Xmx128m -J-XX:CompressedClassSpaceSize=64m -encoding UTF-8 AccountBase.java BankAccount.java Test.java 2>&1')`
  `if ret == 0: os.system('java -Xmx128m -XX:CompressedClassSpaceSize=64m -cp . Test')`
- Das Python-Template (`<template>`) in XML muss linksbündig (ohne führende Leerzeichen) beginnen, anderenfalls produziert der CodeRunner einen `IndentationError` in Python.

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

Nach der XML-Erzeugung und Validierung wird **immer** eine vollständige, interaktive HTML-Vorschau als zweite Ausgabedatei erzeugt und präsentiert. Das XML wird zusätzlich zum Download angeboten.

---

## HTML-Vorschau – Pflichtspezifikation

### Technische Rahmenbedingungen
- Einzelne `.html`-Datei, kein externes CSS/JS
- Google Fonts: `Source Sans 3` (Text) + `Source Code Pro` (Code/Pre)
- Hintergrund der Seite: `#e9eaec`

### CSS-Variablen (verbindlich)
```css
--moodle-orange: #f98012;
--moodle-orange-dark: #d4600a;
--moodle-blue: #0f6cbf;
--moodle-blue-light: #e8f4fd;
--moodle-green: #1d7a1d;
--moodle-green-light: #d4edda;
--moodle-red: #ca3120;
--moodle-red-light: #fde8e6;
--moodle-gray: #6a737b;
--moodle-gray-light: #f3f3f3;
--moodle-border: #dee2e6;
--moodle-text: #1d2125;
--moodle-white: #ffffff;
--radius: 4px;
--shadow: 0 1px 3px rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.08);
```

### Fragetyp-Badge-Farben (verbindlich)
| Typ | Klasse | Hintergrund | Textfarbe | Rahmen |
|-----|--------|-------------|-----------|--------|
| multichoice | `.type-mc` | `#e8f4fd` | `#0f6cbf` | `#0f6cbf` |
| ddwtos | `.type-dnd` | `#f0fdf4` | `#166534` | `#166534` |
| ddmatch | `.type-match` | `#fefce8` | `#854d0e` | `#ca8a04` |
| cloze | `.type-cloze` | `#fdf4ff` | `#6b21a8` | `#9333ea` |

### Seitenstruktur (verbindlich)
1. **`<header class="site-header">`** – orangefarbene Kopfleiste (Höhe 52px, `background: var(--moodle-orange)`)
   - Links: Logo „moodle Vorschau" (weiß, bold)
   - Rechts: Breadcrumb-Text mit Kurs/Thema (klein, halbtransparent weiß)

2. **`<div class="quiz-header">`** – weißer Metabereich unter Header
   - Emoji-Icon-Box (48×48px, orange), Quiz-Titel (h1), Untertitel (Klasse · Niveau · Anzahl)
   - Rechts: Badges für Zeitangabe und Gesamtpunkte

3. **`<div class="main-wrap">`** – 2-Spalten-Grid (`1fr 220px`), max-width 900px, zentriert
   - **Linke Spalte**: `.questions` – alle Fragekarten gestapelt
   - **Rechte Spalte**: `.sidebar` – sticky, weiße Karte

4. **Sidebar** (sticky, `top: 20px`):
   - Überschrift „Fragennavigation" (uppercase, grau)
   - `.q-nav`-Grid (5 Felder pro Zeile, 34×34px Quadrate)
     - Standard: `background: var(--moodle-gray-light)`, `border: 1px solid var(--moodle-border)`
     - Aktiv/beantwortet: `background: var(--moodle-orange)`, weiß, orange Rahmen
     - Hover: `background: var(--moodle-blue-light)`, blau
   - Kursinfos (Kurs, Klasse, Fragen, Punkte) in kleiner Schrift
   - Fortschrittsbalken mit Label „Fortschritt: X/N"

5. **Fragekarten** `.question-card`:
   - `background: white`, `border: 1px solid var(--moodle-border)`, `border-radius: 4px`, `box-shadow: var(--shadow)`
   - **Card-Header** (`.question-header`): grauer Hintergrund (`var(--moodle-gray-light)`), Trennlinie unten
     - Orangefarbene Nummerierung (`.q-num`), Titel, Fragetyp-Badge, Punktzahl rechts
   - **Card-Body** (`.question-body`): `padding: 20px 22px`
   - **Card-Footer** (`.question-footer`): grauer Hintergrund, klein, Status links / Typ rechts

6. **Submit-Leiste** am Ende der Fragenliste: weiße Karte, zentrierter orangefarbener Button

### Interaktivität (verbindlich, via inline JavaScript)

#### Multiple Choice (`multichoice`)
- Antwortoptionen als `.answer-option` mit linkem Radio-Indikator (`.answer-radio`)
- Klick → sofortige visuelle Auswertung (kein separater Check-Button):
  - Richtig: `.correct` → `background: var(--moodle-green-light)`, grüner Rahmen, ✓ im Radio
  - Falsch: `.incorrect` → `background: var(--moodle-red-light)`, roter Rahmen, ✗ im Radio
  - Alle anderen Optionen werden deaktiviert (`onclick = null`)
- Feedback-Box (`.feedback-box`) erscheint animiert darunter (`.show`)
- Status-Feld im Footer wechselt zu „Beantwortet" (grün)

#### Drag & Drop in Text (`ddwtos`) – Click-basiert
- Begriffe aus Pool (`.drag-chip`) per Klick auswählen (blauer Outline-Rahmen)
- Lücken (`.drop-slot`) per Klick befüllen
- Button „Antwort prüfen" → Lücken färben sich grün (`.correct-slot`) oder rot (`.wrong-slot`)
- Verwendete Chips erhalten `.used` (ausgegraut, nicht klickbar)
- Bereits belegte Lücken können durch erneute Auswahl überschrieben werden (alter Chip wird freigegeben)

#### Zuordnung (`ddmatch`)
- `<select>`-Dropdowns in Tabelle (`.match-table`)
- Bei jeder Änderung sofortige Prüfung: `.correct-select` (grün) oder `.wrong-select` (rot)
- Wenn alle Felder ausgefüllt: Gesamt-Feedback-Box erscheint

#### Lückentext/Cloze (`cloze`)
- `<select>`-Elemente inline im `<pre>`-Block (`.cloze-select`)
- Bei jeder Änderung sofortige Prüfung: `.correct-cloze` oder `.wrong-cloze`
- Wenn alle Felder ausgefüllt: Gesamt-Feedback-Box erscheint

#### Gemeinsame Feedback-Box
```
.feedback-box.correct  → background: var(--moodle-green-light), border-left: 4px solid var(--moodle-green)
.feedback-box.incorrect → background: var(--moodle-red-light),  border-left: 4px solid var(--moodle-red)
.feedback-box.info      → background: var(--moodle-blue-light),  border-left: 4px solid var(--moodle-blue)
```
Einblendung via `animation: fadeIn .2s ease` (translateY -4px → 0).

#### Fortschritt & Navigation
- `markAnswered(n)`: setzt Nav-Quadrat auf orange, inkrementiert Zähler, aktualisiert Fortschrittsbalken
- Submit-Button prüft ob alle Fragen beantwortet, sonst Alert mit Hinweis

### Code-/Pre-Darstellung
```css
pre {
  font-family: 'Source Code Pro', monospace;
  font-size: 13px;
  background: #1e1e2e;   /* dunkles Terminal-Dunkelblau */
  color: #cdd6f4;
  border-radius: 4px;
  padding: 16px 18px;
  overflow-x: auto;
  line-height: 1.7;
}
code {
  font-family: 'Source Code Pro', monospace;
  font-size: 13px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 3px;
  padding: 1px 5px;
}
```

### Responsive
- Unterhalb 700px: einspaltig (Sidebar unter Fragen, `position: static`)
- Quiz-Badge-Leiste im Header wird ausgeblendet

---

