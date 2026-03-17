# Moodle-XML Struktur-Referenz

Kompakte technische Schnellreferenz für XML-Aufbau, Import-Fallstricke und Validierung.

Diese Datei ist **nicht** die führende Regelquelle.
Bei Abweichungen gelten in dieser Reihenfolge:
1. `.github/instructions/questions.instructions.md`
2. `SKILL.md`
3. diese Datei

## Zweck
- schneller Lookup für XML-Grundstruktur
- kompakte Skelette für häufige Fragetypen
- Import-Checks vor dem Moodle-Import

## Allgemeine Grundstruktur

```xml
<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <!-- question: q1 -->
  <question type="TYPE">
    <name><text>Fragetitel</text></name>
    <questiontext format="html">
      <text><![CDATA[<p>Fragetext</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>Erläuterung</p>]]></text>
    </generalfeedback>
    <defaultgrade>1</defaultgrade>
    <penalty>0.1</penalty>
    <hidden>0</hidden>
    <idnumber></idnumber>
  </question>
</quiz>
```

## Pflichtregeln

### 1. Frage-Marker vor jeder Frage

```xml
<!-- question: q1 -->
<question type="multichoice">
```

Ohne diese Marker kann der Import still mit 0 Fragen enden.

### 2. CDATA bei HTML-Inhalt
Alle `<text>`-Elemente mit HTML-Inhalt gehören in CDATA.
Das betrifft typischerweise:
- `<questiontext><text>`
- `<answer><text>` bei HTML
- `<feedback><text>` bei HTML
- `<generalfeedback><text>` bei HTML
- `<subquestion><text>` bei HTML

Beispiel:

```xml
<text><![CDATA[<p>Text mit <strong>HTML</strong></p>]]></text>
```

### 3. Templates aus `templates/` verwenden
Für neue Dateien die Vorlagen aus dem Ordner `templates/` und `templates/README.md` nutzen.

### 4. HTML-Vorschau ist Pflicht
Neben der XML-Datei wird immer auch eine HTML-Vorschau erzeugt.

## Fragetypen – Schnellskizzen

### ddmatch

```xml
<question type="ddmatch">
  <questiontext format="html">
    <text><![CDATA[<p>Ordne zu.</p>]]></text>
  </questiontext>
  <defaultgrade>2</defaultgrade>
  <shuffleanswers>true</shuffleanswers>

  <subquestion format="html">
    <text><![CDATA[<p>Begriff A</p>]]></text>
    <answer format="html">
      <text><![CDATA[<p>Erklärung A</p>]]></text>
    </answer>
  </subquestion>
</question>
```

Kurzregeln:
- `<defaultgrade>` = Anzahl der Zuordnungspaare.
- HTML-Inhalte in CDATA.

### ddwtos

```xml
<question type="ddwtos">
  <questiontext format="html">
    <text><![CDATA[<p>Text mit [[1]] und [[2]].</p>]]></text>
  </questiontext>
  <defaultgrade>2</defaultgrade>

  <dragbox><text>Antwort 1</text><group>1</group></dragbox>
  <dragbox><text>Antwort 2</text><group>2</group></dragbox>
  <dragbox><text>Distractor 1</text><group>1</group></dragbox>
  <dragbox><text>Distractor 2</text><group>2</group></dragbox>
</question>
```

Kurzregeln:
- Lücken im Text als `[[1]]`, `[[2]]`, ...
- Richtige Antworten zuerst, Distractoren danach.
- `<defaultgrade>` = Anzahl der Lücken.
- Details zu Reihenfolge, `infinite` und Gruppenlogik stehen in `SKILL.md`.

### multichoice

```xml
<question type="multichoice">
  <questiontext format="html">
    <text><![CDATA[<p>Welche Aussage ist richtig?</p>]]></text>
  </questiontext>
  <defaultgrade>1</defaultgrade>
  <single>true</single>
  <shuffleanswers>true</shuffleanswers>

  <answer fraction="100" format="html">
    <text><![CDATA[<p>Richtige Antwort</p>]]></text>
  </answer>
  <answer fraction="-33.33333" format="html">
    <text><![CDATA[<p>Falsche Antwort</p>]]></text>
  </answer>
</question>
```

Kurzregeln:
- `single=true`: genau eine richtige Antwort.
- `single=false`: richtige Antworten summieren sich zu etwa 100 %.
- `<defaultgrade>` richtet sich nach der Zahl der Bewertungseinheiten.
- Keine Antworttexte mit führendem `+`, `-` oder `~`.

### cloze

```xml
<question type="cloze">
  <questiontext format="html">
    <text><![CDATA[
<p>{1:MULTICHOICE:Option A~Option B~=Richtig~Option C}</p>
    ]]></text>
  </questiontext>
</question>
```

Kurzregeln:
- `=` markiert die richtige Option.
- `~` trennt Optionen.
- MULTICHOICE-Blöcke immer auf einer einzigen Zeile.
- Kein zusätzliches `<defaultgrade>` nötig.

## SVG und Diagramme
SVG-spezifische Detailregeln werden nicht in dieser Datei gepflegt.
Für SVG, Cisco-Symbole, Base64-Einbettung, responsive HTML-Vorschau und Diagrammregeln ist `SKILL.md` maßgeblich.

## Validierung vor dem Abschluss

### XML-Syntax prüfen

```powershell
python -c "import xml.etree.ElementTree as ET; ET.parse(r'res\DATEI.xml'); print('XML valid')"
```

### Marker prüfen

```powershell
grep -c "<!-- question:" res/DATEI.xml
```

Die Zahl sollte der Anzahl der Fragen entsprechen.

### Cloze-MULTICHOICE prüfen

```powershell
grep -n "MULTICHOICE" res/DATEI.xml
```

Jeder MULTICHOICE-Block muss vollständig auf einer Zeile stehen.

### CDATA-Lücken suchen

```powershell
grep -n "<text>[^<]*<[a-z]" res/DATEI.xml
```

## Einsatzgrenze dieser Datei
Diese Datei dient nur als Schnellreferenz.
Sie soll keine vollständige Fachspezifikation mehr enthalten.
Für Detailregeln immer die führende Instruktionsdatei und `SKILL.md` heranziehen.
