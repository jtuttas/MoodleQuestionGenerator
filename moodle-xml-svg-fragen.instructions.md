# Vorlage & Regeln: Moodle-XML-Fragedateien mit SVG-Diagrammen

> Erkenntnisse aus der Erstellung von `klassenarbeit_UML_Diagramme_Vertiefung.xml`  
> Gültig für: Moodle 4.x, Fragetypen ddmatch / ddwtos / multichoice / cloze

---

## 1. Dateistruktur

```xml
<?xml version="1.0" encoding="UTF-8"?>
<quiz>

<!-- ==================== EINFACHE FRAGEN (1-3) ==================== -->
  <question type="ddmatch"> ... </question>

<!-- ==================== MITTLERE FRAGEN (4-7) ==================== -->
  <question type="cloze"> ... </question>

<!-- ==================== SCHWERE FRAGEN (8-10) ==================== -->
  <question type="multichoice"> ... </question>

</quiz>
```

---

## 2. CDATA – Pflichtregeln

**Jedes `<text>`-Element, das HTML enthält, MUSS in CDATA wrapped werden.**

```xml
<!-- ✅ Korrekt -->
<text><![CDATA[<p>Text mit <code>code</code> und <strong>fett</strong></p>]]></text>

<!-- ❌ Falsch – führt zu Moodle-Importfehler "String erwartet" -->
<text><p>Text mit <code>code</code></text>
```

### Betrifft zwingend:
| Element | CDATA nötig wenn... |
|---|---|
| `<questiontext><text>` | immer (enthält SVG + HTML) |
| `<answer><text>` | wenn HTML-Tags enthalten |
| `<feedback><text>` | wenn `<code>`, `<strong>`, `<a>` etc. enthalten |
| `<generalfeedback><text>` | wenn HTML-Tags enthalten |
| `<subquestion><text>` | wenn HTML-Tags enthalten |

### Kein CDATA nötig bei:
- `<name><text>` (reiner Text)
- `<dragbox><text>` (reiner Text)
- `<correctfeedback><text>` / `<partiallycorrectfeedback><text>` / `<incorrectfeedback><text>` (wenn kein HTML)

### Häufige Fehlerquelle – `<feedback>` innerhalb von `<answer>`:
```xml
<!-- ❌ Vergessenes CDATA in feedback -->
<answer fraction="33.33333" format="html">
  <text><![CDATA[<p>Antworttext</p>]]></text>
  <feedback format="html">
    <text>Feedback mit <code>variable</code> hier.</text>  <!-- FEHLER! -->
  </feedback>
</answer>

<!-- ✅ Korrekt -->
  <feedback format="html">
    <text><![CDATA[Feedback mit <code>variable</code> hier.]]></text>
  </feedback>
```

---

## 3. SVG-Diagramme – Technische Regeln

### 3.1 Grundgerüst der SVG-Grafik mit eingebettetem draw.io-Modell
- Eine draw.io-editierbare SVG besteht aus zwei Schichten:
  - Sichtbare SVG-Vorschau (normales SVG für Browser/Renderer)
  - Eingebettetes draw.io-Diagramm (mxfile) im content-Attribut des <svg>
```xml
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="420" height="200" viewBox="0 0 420 200"
     style="font-family:Arial,sans-serif;font-size:13px;display:block;margin:10px auto;"
     content="&lt;mxfile ...&gt;...&lt;/mxfile&gt;">
  <!-- Sichtbare SVG-Vorschau -->
</svg>
```
#### 3.1.1 Pflichtstruktur des eingebetteten draw.io-Modells
```xml
<mxfile ...>
  <diagram id="..." name="Page-1">
    <mxGraphModel ...>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>

        <!-- Form/Knoten -->
        <mxCell id="node1" value="..." style="..." vertex="1" parent="1">
          <mxGeometry x="..." y="..." width="..." height="..." as="geometry"/>
        </mxCell>

        <!-- Verbindung/Kante -->
        <mxCell id="edge1" style="..." edge="1" parent="1" source="node1" target="node2">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

#### 3.1.2 XML-Escaping-Regeln für content (Pflicht)
- Das eingebettete `mxfile` muss im `content`-Attribut XML-escaped werden:
  - < → &lt;
  - > → &gt;
  - " → &quot;
  - & → &amp;

Beispiel:
```xml
content="&lt;mxfile host=&quot;app.diagrams.net&quot; ...&gt;...&lt;/mxfile&gt;"
```

#### 3.1.3 Synchronisationsregel: SVG-Vorschau ↔ mxfile
- Die Vorschau und das eingebettete `mxfile` müssen semantisch dasselbe Diagramm abbilden.

Pflicht:
  - Jede sichtbare Form im SVG hat ein entsprechendes `vertex` im `mxfile`
  - Jede sichtbare Linie/Verbindung im SVG hat eine `edge` im `mxfile`
  - Alle sichtbaren Labels/Texte sind im `mxfile` enthalten (als `value` oder Textobjekt)

#### 3.1.4 Kompatibilitätsregel für <use>
- Für SVG-Symbole (<defs><symbol>...) ist in <use> immer zu verwenden:
```xml
<use xlink:href="#symbolId" x="..." y="..." width="..." height="..."/>
```
Nicht nur `href`, sondern `xlink:href` (plus `xmlns:xlink` am Root).

#### 3.1.5 Pflicht: feste Größe und viewBox
- Die SVGs müssen immer enthalten:
  - width
  - height
  - viewBox
(Das verhindert fehlerhafte Skalierung in Editoren/Renderern.)

#### 3.1.6 Draw.io-Styles im mxfile (empfohlen)
Für gute Weiterbearbeitbarkeit in draw.io sollen mxCell-Styles draw.io-konform gesetzt werden.

- Empfohlene Basis-Styles (Knoten):
  - html=1
  - align=center
  - verticalAlign=middle
  - strokeColor=#333333
  - strokeWidth=1.5

Empfohlene Basis-Styles (Kanten):
  - endArrow=none (wenn keine Pfeilspitze)
  - rounded=0
  - strokeWidth=1.5
  - dashed=1;dashPattern=6 3 (für gestrichelt)

#### 3.1.7 Cisco-/Spezial-Symbole in draw.io
Wenn Cisco-Symbole editierbar in draw.io sein sollen, müssen sie im `mxfile` als draw.io-Shape referenziert werden (nicht nur als SVG-Pfade in der Vorschau).

Beispiele für `style`:
- shape=mxgraph.cisco.routers.router
- shape=mxgraph.cisco.switches.workgroup_switch
- shape=mxgraph.cisco.computers_and_peripherals.pc

#### 3.1.8 Vorschau-Regel für AI-Agenten (Pflicht)
Die SVG-Vorschau muss eigenständig renderbar sein, auch ohne draw.io.

Daher:
- Alle sichtbaren Elemente normal als SVG zeichnen (`path`, `line`, `rect`, `ellipse`, `text`, `use`, ...)
- Nicht darauf verlassen, dass ein SVG-Viewer das `content`-Attribut interpretiert

#### 3.1.9 Operativer Ablauf für den AI-Agenten (Pflichtprozess)
- Wenn ein SVG erzeugt werden soll:
  - Sichtbares SVG nach den Diagrammregeln erzeugen
  - Parallel ein passendes draw.io-mxfile aufbauen
  - mxfile XML-escapen
  - Escaped mxfile in content="..." des <svg> einfügen

### 3.2 Pfeilspitzen (Marker)
```xml
<defs>
  <!-- Normaler Pfeil (Kontrollfluss) -->
  <marker id="ah1" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
    <polygon points="0 0,8 3,0 6" fill="#333"/>
  </marker>

  <!-- Vererbungspfeil (hohles Dreieck) -->
  <marker id="inh" markerWidth="12" markerHeight="10" refX="11" refY="5" orient="auto">
    <polygon points="0,0 0,10 11,5" fill="#fff" stroke="#333" stroke-width="1.2"/>
  </marker>

  <!-- Gestrichelter Pfeil (include/extend) -->
  <marker id="ahU" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
    <polygon points="0,0 8,3 0,6" fill="#333"/>
  </marker>
</defs>

<!-- Verwendung -->
<line x1="..." y1="..." x2="..." y2="..." stroke="#333" stroke-width="1.5" marker-end="url(#ah1)"/>
<line ... stroke-dasharray="6,3" marker-end="url(#ahU)"/>   <!-- gestrichelt für include/extend -->
```

### 3.3 UML-Klassendiagramm – Aufbau
```xml
<!-- Klassenbox: 3 Kompartimente (Name / Attribute / Methoden) -->
<rect x="100" y="10" width="160" height="22" fill="#dce8fc" stroke="#333" stroke-width="1.5"/>
<text x="180" y="26" text-anchor="middle" font-weight="bold">KlassenName</text>

<rect x="100" y="32" width="160" height="40" fill="#fff" stroke="#333" stroke-width="1.5"/>
<text x="108" y="50" font-size="12">+ attribut: Typ</text>
<text x="108" y="66" font-size="12"># _attribut: Typ</text>

<rect x="100" y="72" width="160" height="22" fill="#fff" stroke="#333" stroke-width="1.5"/>
<text x="108" y="88" font-size="12">+ methode(): void</text>
```

### 3.4 Beziehungen im Klassendiagramm
| Beziehung | SVG-Symbol | Raute/Pfeil |
|---|---|---|
| Assoziation | einfache Linie | — |
| Aggregation | offene Raute am **Ganzen** | `fill="#fff"` |
| Komposition | gefüllte Raute am **Ganzen** | `fill="#333"` |
| Vererbung | hohler Dreieckspfeil zur **Elternklasse** | Marker `inh` |
| Include/Extend | gestrichelter Pfeil | `stroke-dasharray="6,3"` |

**Rautenpositionen:** Die Raute sitzt direkt am unteren Rand der „Ganzes"-Klasse, NICHT in der Mitte der Verbindungslinie:
```xml
<!-- ✅ Raute direkt am Ende der Klasse (y=52 wenn class-bottom=52) -->
<polygon points="200,52 192,60 200,68 208,60" fill="#fff" stroke="#333" stroke-width="1.5"/>
<line x1="200" y1="68" x2="200" y2="118" stroke="#333" stroke-width="1.5"/>
```

**Wichtig** eine Annotation der Symbolik im Klassendiagramm ist zu unterlassen!

### 3.5 Aktivitätsdiagramm – Symbole
```xml
<!-- Startknoten -->
<circle cx="200" cy="20" r="13" fill="#333"/>

<!-- Aktion -->
<rect x="125" y="40" width="150" height="32" rx="8" fill="#fff" stroke="#333" stroke-width="1.5"/>

<!-- Entscheidungsknoten (Raute) -->
<polygon points="200,80 260,105 200,130 140,105" fill="#fffde7" stroke="#f9a825" stroke-width="1.5"/>

<!-- Fork / Join – schwarzer Balken -->
<rect x="60" y="150" width="280" height="10" fill="#333"/>

<!-- Endknoten -->
<circle cx="200" cy="280" r="13" fill="#fff" stroke="#333" stroke-width="1.5"/>
<circle cx="200" cy="280" r="8"  fill="#333"/>
```

### 3.6 UseCase-Diagramm – Aufbau
```xml
<!-- Systemgrenze -->
<rect x="80" y="10" width="380" height="220" rx="4" fill="#f9f9f9" stroke="#333" stroke-width="2"/>
<text x="270" y="28" text-anchor="middle" font-weight="bold">Systemname</text>

<!-- Akteur (Strichmännchen) – IMMER AUSSERHALB der Systemgrenze -->
<circle cx="30" cy="55" r="13" fill="#fff" stroke="#333" stroke-width="1.5"/>
<line x1="30" y1="68" x2="30" y2="105" stroke="#333" stroke-width="1.5"/>
<line x1="10" y1="82" x2="50" y2="82" stroke="#333" stroke-width="1.5"/>
<line x1="30" y1="105" x2="12" y2="130" stroke="#333" stroke-width="1.5"/>
<line x1="30" y1="105" x2="48" y2="130" stroke="#333" stroke-width="1.5"/>
<text x="30" y="148" text-anchor="middle">Akteurname</text>

<!-- UseCase (Ellipse) – IMMER INNERHALB der Systemgrenze -->
<ellipse cx="250" cy="100" rx="110" ry="28" fill="#fff" stroke="#333" stroke-width="1.5"/>
<text x="250" y="105" text-anchor="middle">UseCase-Name</text>
```

### 3.7 Nummerierte Callouts für Lernende
```xml
<!-- Rote Nummer mit gestrichelter Hilfslinie -->
<text x="36" y="33" font-size="14" font-weight="bold" fill="#c00">①</text>
<line x1="62" y1="30" x2="184" y2="28" stroke="#c00" stroke-width="1" stroke-dasharray="4,3"/>
```

### 3.8 Lösungsneutralität in Grafiken (kritisch)
**Die Grafik darf niemals die Lösung vorwegnehmen oder visuell verraten.**
- **Keine farbliche Hervorhebung** von Elementen, deren Rolle die gesuchte Antwort ist (z. B. eine gesuchte Zwischentabelle nicht orange/gelb einfärben, wenn „Zwischentabelle" die korrekte Antwort ist).
- **Keine Legenden**, die direkt auf die richtige Antwort hindeuten (z. B. Beschriftungen in einer Sonderfarbe, die mit dem zu erkennenden Konzept assoziiert ist).
- **Alle gleichwertigen Elemente** (z. B. mehrere Tabellen, Klassen, Knoten) erhalten **einheitliche Farben und Rahmen** – es sei denn, der Unterschied ist ausdrücklicher Prüfungsgegenstand.
- **Abschluss-Kontrollfrage:** Kann ein Schüler die richtige Antwort allein durch Betrachten der Grafik erschließen, ohne die Aufgabe zu lösen? → Wenn ja, Grafik anpassen.

---

## 4. Logik-Konsistenz – Pflichtprüfung

Vor dem Import immer prüfen:

### Alle Diagrammtypen
- [ ] **Lösungsneutralität:** Kein Element ist durch Farbe, Rahmen oder Beschriftung so hervorgehoben, dass die gesuchte Antwort daraus direkt ablesbar ist (siehe 3.8)

### Klassendiagramme
- [ ] Jede Klasse hat **nur Attribute, die darin modelliert sind** – keine „unsichtbaren" Beziehungen
- [ ] Wenn Kompositions-/Aggregationspfeil vorhanden → **Attribut in der „Ganzes"-Klasse** vorhanden (z. B. `- akkus: List[Akku]`)
- [ ] Wenn Vererbungspfeil vorhanden → Kindklasse hat **keine doppelten Attribute** der Elternklasse
- [ ] Multiplizitätslabels (`1`, `0..*`, `1..*`) stehen **nahe der jeweiligen Klasse**, nicht in der Mitte

### Aktivitätsdiagramme
- [ ] Genau **ein** Startknoten, mindestens **ein** Endknoten
- [ ] Jede Entscheidungsraute hat **mindestens zwei** ausgehende Kanten mit Bedingungen `[Ja]`/`[Nein]`
- [ ] Fork und Join passen zusammen (gleiche Anzahl paralleler Zweige)

### UseCase-Diagramme
- [ ] Alle **Akteure außerhalb** der Systemgrenze
- [ ] Alle **UseCases innerhalb** der Systemgrenze
- [ ] `<<include>>` = obligatorisch (Pfeil vom Basis-UC zum eingebundenen UC)
- [ ] `<<extend>>` = optional (Pfeil vom Erweiterungs-UC zum Basis-UC)

---

## 5. Fragetypen – Besonderheiten

### ddwtos (Drag-and-drop into text)
- Lückenstellen: `[[1]]`, `[[2]]`, `[[3]]` – **jede Nummer = eigene Gruppe**
- Jede Gruppe braucht **mindestens einen Distractor** (falsches Angebot)
- Dragboxes mit `<group>1</group>` passen nur in `[[1]]`-Lücken

```xml
<dragbox><text>richtigeAntwort</text><group>1</group></dragbox>
<dragbox><text>Distractor</text><group>1</group></dragbox>
```

### ddmatch (Drag-and-drop matching)
- Verwendet `<subquestion>` + `<answer>` Paare
- Kein CDATA nötig wenn reiner Text, aber bei HTML-Inhalt CDATA verwenden

### multichoice (Multiple Choice)
- `<single>false</single>` für Mehrfachauswahl
- Punkte für richtige Antworten summieren sich zu 100% (z. B. 3× `33.33333`)
- Negativpunkte für falsche: z. B. `fraction="-25"`
- Antworttexte dürfen **nicht mit** `+`, `-`, `~` **beginnen** (Moodle-Sonderzeichen)

### cloze (Lückentext mit eingebetteten Fragen)
- Syntax: `{1:MULTICHOICE:Option1~Option2~=RichtigeOption~Option3}`
- `=` vor der richtigen Antwort
- `~` trennt Optionen
- Kein extra `<defaultgrade>` nötig

---

## 6. XML-Validierung

```powershell
# Schnelle Validierung in PowerShell
python -c "import xml.etree.ElementTree as ET; ET.parse(r'PFAD\datei.xml'); print('XML valid')"
```

```powershell
# Alle text-Elemente mit HTML OHNE CDATA finden (potenzielle Importfehler)
$content = Get-Content 'PFAD\datei.xml' -Encoding UTF8
$lineNum = 0
foreach ($line in $content) {
    $lineNum++
    if ($line -match '<text>' -and $line -notmatch 'CDATA' -and
        ($line -match '<[a-zA-Z]' -or $line -match '&lt;' -or $line -match '&gt;')) {
        Write-Output "Line $lineNum : $line"
    }
}
```

---

## 7. Typische Fehler & Lösungen

| Fehler | Ursache | Lösung |
|---|---|---|
| „String erwartet (CDATA?)" | HTML-Tags in `<text>` ohne CDATA | `<text><![CDATA[...]]></text>` |
| Pfeile falsch rotiert | `refX`/`refY` im Marker falsch | Für vertikale Pfeile: `refX="7" refY="3"`, `points="0 0,8 3,0 6"` |
| Vererbungspfeil zeigt falsche Richtung | Linie von Kindklasse zum Marker, Marker zeigt zur Elternklasse | Linie startet bei Kind, `marker-end` zeigt zur Elternklasse |
| Raute in der Linienmitte | Polygon-Punkte berechnet von Linienmittelpunkt | Raute direkt am Ende der „Ganzes"-Klasse platzieren |
| Klasse hat Beziehungspfeil aber kein passendes Attribut | Logikfehler im Diagramm | Attribut zur Klasse hinzufügen (z. B. `- akkus: List[Akku]`) |
| MULTICHOICE-Option beginnt mit `~` oder `+` | Moodle interpretiert als Trennzeichen | Option umbenennen, z. B. `"public (+)"` statt `"+ public"` |
| Import: „10 Fragen erkannt, 0 importiert" | Mind. 1 Fehler bricht den gesamten Import ab | Fehlerhafte Fragen einzeln prüfen, XML validieren |
