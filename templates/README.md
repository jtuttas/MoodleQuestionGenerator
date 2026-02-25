# Moodle Quiz XML Templates

## 📋 Übersicht

Dieser Ordner enthält **generische Moodle Quiz Templates** in XML-Format, die für alle Kurse und Themen verwendet werden können. Die Templates sind themenunabhängig gestaltet und enthalten Platzhalter sowie ausführliche Kommentare zur Anpassung.

### ✨ Neu: SVG-basierte Templates

Neben den klassischen Templates stehen jetzt auch **5 SVG-erweiterte Varianten** zur Verfügung:
- ✅ Vollständig **fachunabhängig** (geometrische Formen, Farben, Prozessschritte)
- ✅ Skalierbare Vektorgrafiken (keine Qualitätsverluste)
- ✅ Direkt einsetzbar für visuelles Lernen
- ✅ Detaillierte Kommentare zur Anpassung

Siehe Abschnitt **"SVG-Diagramme in Fragen einbinden"** für technische Details.

## 📁 Verfügbare Templates

| Template | Fragetyp | Verwendung |
|----------|----------|------------|
| `template-ddmatch-zuordnung.xml` | ddmatch | Zuordnungsaufgaben (Links ↔ Rechts) |
| `template-ddwtos-lueckentext.xml` | ddwtos | Lückentext mit Drag-and-Drop |
| `template-gapselect-lueckentextauswahl.xml` | gapselect | Lückentext mit Dropdown-Auswahl |
| `template-multichoice-mehrfachauswahl.xml` | multichoice | Multiple-Choice (eine oder mehrere richtige Antworten) |
| `template-numerical-numerisch.xml` | numerical | Numerische Antworten mit Toleranz |
| `template-ddimageortext-drag-auf-bild.xml` | ddimageortext | Drag-and-Drop auf Bilder |
| `template-cloze-eingebettete-antworten.xml` | cloze | Eingebettete Antworten (komplex) |
| `template-ordering-anordnung.xml` | ordering ⚠️ | Elemente in richtige Reihenfolge bringen (Plugin benötigt) |
| `template-cloze-mit-svg.xml` | cloze + SVG | Cloze mit SVG-Flussdiagramm (Formen und Prozessschritte) |
| `template-ddimageortext-drag-auf-svg.xml` | ddimageortext + SVG | Drag-Drop auf SVG-Grafik (Farben zuordnen) |
| `template-ddmatch-zuordnung-mit-svg.xml` | ddmatch + SVG | Zuordnung mit geometrischen Formen (Kreis, Quadrat, Dreieck) |
| `template-ddwtos-lueckentext-mit-svg.xml` | ddwtos + SVG | Lückentext mit Prozess-Diagramm (Eingabe → Verarbeitung → Ausgabe) |
| `template-multichoice-mit-svg.xml` | multichoice + SVG | Multiple-Choice mit Workflow-Diagramm (START → Schritte) |


> **⚠️ Hinweis:** Der Fragetyp **ordering** erfordert ein zusätzliches Moodle-Plugin.  
> Installation: [https://moodle.org/plugins/qtype_ordering](https://moodle.org/plugins/qtype_ordering)

## 🚀 Schnellstart

### 1. Template auswählen

Wählen Sie das passende Template für Ihren Fragetyp aus:

```bash
# Beispiel: Zuordnungsaufgabe erstellen
cd HTML/fragen/templates
copy template-ddmatch-zuordnung.xml ../../meine-neue-frage.xml
```

### 2. Template anpassen

Öffnen Sie die Datei in einem Texteditor und suchen Sie nach Platzhaltern in **eckigen Klammern**:

- `[TITEL DER AUFGABE]`
- `[HIER IHRE AUFGABENSTELLUNG EINFÜGEN]`
- `[Begriff 1]`, `[Begriff 2]`, etc.

**Wichtig:** Belassen Sie die XML-Struktur und CDATA-Blöcke unverändert!

### 3. In Moodle importieren

1. Moodle-Kurs öffnen
2. Fragensammlung → Importieren
3. Format: **Moodle XML**
4. Datei hochladen
5. Importieren

## 📖 Detaillierte Anleitungen

### Template: ddmatch (Zuordnung)

**Verwendung:** Begriffe, Definitionen, Konzepte einander zuordnen

**Anpassungen:**
```xml
<name>
  <text>Grundbegriffe der Veranstaltungstechnik</text>  <!-- Ihr Titel -->
</name>
<questiontext format="html">
  <text><![CDATA[<p>Ordnen Sie die technischen Begriffe den Definitionen zu.</p>]]></text>
</questiontext>

<!-- Zuordnungspaare -->
<subquestion format="html">
  <text><![CDATA[<p>DMX512</p>]]></text>  <!-- Links: Begriff -->
  <answer format="html">
    <text><![CDATA[<p>Protokoll zur Lichtsteuerung</p>]]></text>  <!-- Rechts: Definition -->
  </answer>
</subquestion>
```

**Distractor hinzufügen** (falsche Antwort ohne Zuordnung):
```xml
<subquestion format="html">
  <text><![CDATA[<p></p>]]></text>  <!-- Leer! -->
  <answer format="html">
    <text><![CDATA[<p>MIDI-Controller</p>]]></text>  <!-- Erscheint als Falschoption -->
  </answer>
</subquestion>
```

---

### Template: ddwtos (Lückentext)

**Verwendung:** Begriffe in Textlücken einsetzen

**Lücken definieren:**
```xml
<questiontext format="html">
  <text><![CDATA[
    <p>Ein Prozess besteht aus mehreren [[1]]. Das Endergebnis wird über die [[2]] ausgegeben.</p>
  ]]></text>
</questiontext>
```

**Begriffe zuordnen:**
```xml
<!-- Gruppe 1 = Lücke [[1]] -->
<dragbox><text>Arbeitsschritten</text><group>1</group></dragbox>  <!-- Richtig -->
<dragbox><text>Komponenten</text><group>1</group></dragbox>       <!-- Distractor -->

<!-- Gruppe 2 = Lücke [[2]] -->
<dragbox><text>Schnittstelle</text><group>2</group></dragbox>      <!-- Richtig -->
<dragbox><text>Eingabeeinheit</text><group>2</group></dragbox>    <!-- Distractor -->
```

---

### Template: multichoice (Multiple-Choice)

**Verwendung:** Eine oder mehrere richtige Antworten auswählen

**Wichtig:** `fraction` muss sich bei mehreren richtigen Antworten zu **100%** addieren!

**Beispiel: 2 richtige Antworten**
```xml
<single>false</single>  <!-- false = Mehrfachauswahl -->

<answer fraction="50" format="html">  <!-- 50% weil 2 richtige -->
  <text><![CDATA[<p>Kreise haben keine Ecken</p>]]></text>
</answer>

<answer fraction="50" format="html">  <!-- 50% weil 2 richtige -->
  <text><![CDATA[<p>Quadrate haben vier gleich lange Seiten</p>]]></text>
</answer>

<answer fraction="-25" format="html">  <!-- Negativ = Abzug bei falscher Wahl -->
  <text><![CDATA[<p>Dreiecke haben vier Ecken</p>]]></text>
</answer>
```

**Beispiel: Nur 1 richtige Antwort**
```xml
<single>true</single>  <!-- true = Einzelauswahl -->

<answer fraction="100" format="html">  <!-- 100% -->
  <text><![CDATA[<p>Die richtige Antwort</p>]]></text>
</answer>

<answer fraction="0" format="html">  <!-- 0% -->
  <text><![CDATA[<p>Falsche Antwort</p>]]></text>
</answer>
```

---

### Template: ddimageortext (Drag-Drop auf Bild)

**Verwendung:** Begriffe auf Bildbereiche ziehen (Beschriftung, Zuordnung)

#### 1. Bild vorbereiten

- **Format:** PNG, JPG oder SVG
- **Auflösung:** 600-800px Breite (für Moodle optimal)
- **SVG-Empfehlung:** Für Diagramme bevorzugt, da skalierbar

#### 2. Bild in base64 konvertieren

**PowerShell:**
```powershell
# PNG/JPG konvertieren
$bytes = [System.IO.File]::ReadAllBytes("C:\pfad\zum\bild.png")
$base64 = [Convert]::ToBase64String($bytes)
$base64 | Out-File base64.txt

# SVG konvertieren
$svg = Get-Content diagram.svg -Raw
$base64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($svg))
$base64 | Out-File -Encoding ASCII base64.txt
```

**Linux/Mac:**
```bash
base64 bild.png > base64.txt
```

**Online:** [https://www.base64-image.de/](https://www.base64-image.de/)

#### 3. Koordinaten ermitteln

##### Bei nummerierte Kreisen im SVG (Radius = 11 px)

Wenn Sie rote Nummernkreise im SVG verwenden:

```xml
<!-- Kreis mit Nummer im SVG (Radius = 11) -->
<circle cx="200" cy="63" r="11" fill="#c00" stroke="#fff" stroke-width="1.5"/>
<text x="200" y="67" text-anchor="middle" font-size="11" fill="#fff">1</text>
```

**Koordinatenberechnung:**
```
xleft = cx - r = 200 - 11 = 189
ytop  = cy - r = 63 - 11 = 52
```

```xml
<drop>
  <no>1</no>
  <choice>1</choice>
  <xleft>189</xleft>
  <ytop>52</ytop>
</drop>
```

##### Bei Rechtecken im SVG

Wenn Sie Rechtecke als Drop-Zonen verwenden:

```xml
<!-- Rechteck im SVG -->
<rect x="100" y="50" width="150" height="40" fill="#f0f0f0"/>
```

**Koordinatenberechnung:**
```
xleft = x = 100
ytop  = y = 50
```

##### Koordinaten mit Grafikprogramm ablesen

1. Öffnen Sie das Bild in **GIMP**, **Photoshop**, **Paint.NET** oder **Inkscape**
2. Bewegen Sie die Maus über die gewünschte Position
3. Lesen Sie die Pixel-Koordinaten ab (meist links unten oder oben angezeigt)
4. Notieren Sie X- und Y-Werte

#### 4. XML-Struktur

```xml
<file name="background.svg" path="/" encoding="base64">BASE64-STRING-HIER</file>

<drag>
  <no>1</no>
  <text><![CDATA[Begriff 1]]></text>
  <draggroup>1</draggroup>
</drag>

<drag>
  <no>2</no>
  <text><![CDATA[Begriff 2]]></text>
  <draggroup>2</draggroup>
  <infinite/>  <!-- Kann mehrfach verwendet werden (optional) -->
</drag>

<drop>
  <text></text>
  <no>1</no>
  <choice>1</choice>  <!-- Verweist auf drag no="1" -->
  <xleft>189</xleft>  <!-- X-Position in Pixel -->
  <ytop>52</ytop>     <!-- Y-Position in Pixel -->
</drop>

<drop>
  <text></text>
  <no>2</no>
  <choice>2</choice>  <!-- Verweist auf drag no="2" -->
  <xleft>320</xleft>
  <ytop>145</ytop>
</drop>
```

#### 5. ⚠️ Überlappung von Drop-Zonen vermeiden

**Problem:** Moodle rendert jedes Drag-Label als schwebende Box an der Drop-Position. Zu nah beieinander liegende Zonen überlappen und sind nicht bedienbar.

**Mindestabstände:**
- **Vertikal:** ≥ 80 px zwischen Drop-Zonen
- **Horizontal:** ≥ 150 px zwischen Drop-Zonen
- **Keine Überlappung:** Maximal eine Zone pro 80 × 40 px Bereich

**Empfohlene Positionen für Nummernkreise:**
- ✅ An Rändern von Rechtecken (oben, links, rechts)
- ✅ In leeren Außenbereichen des Diagramms
- ✅ Entlang von Pfeilen (nicht an Pfeilspitzen)
- ❌ NICHT über Diagrammelemente (Text, Rechtecke, Ellipsen)
- ❌ NICHT in dichten Bereichen mit vielen Elementen

**Beispiel-Positionen (bei 600 × 400 px SVG):**

| Zone | Beschreibung | cx | cy | xleft | ytop |
|------|--------------|----|----|-------|------|
| 1 | Oben links (Rand) | 20 | 20 | 9 | 9 |
| 2 | Oben rechts (Rand) | 580 | 20 | 569 | 9 |
| 3 | Linker Rand (Mitte) | 20 | 200 | 9 | 189 |
| 4 | Rechter Rand (Mitte) | 580 | 200 | 569 | 189 |
| 5 | Unten links (Rand) | 20 | 380 | 9 | 369 |
| 6 | Unten rechts (Rand) | 580 | 380 | 569 | 369 |

#### 6. Distractors (falsche Angebote)

Drag-Items **ohne** zugehörige Drop-Zone = Distractors (falsche Antworten).

**Mit Distractors:**
```xml
<drag><no>1</no><text>Richtig</text><draggroup>1</draggroup></drag>
<drag><no>2</no><text>Falsch 1</text><draggroup>1</draggroup></drag>  <!-- Keine Drop-Zone -->
<drag><no>3</no><text>Falsch 2</text><draggroup>1</draggroup></drag>  <!-- Keine Drop-Zone -->

<drop><no>1</no><choice>1</choice><xleft>100</xleft><ytop>50</ytop></drop>
<!-- Nur Zone für drag no="1" - drag no="2" und "3" passen nirgendwo -->
```

**WICHTIG:** Im Fragetext ankündigen:
```xml
<questiontext format="html">
  <text><![CDATA[
    <p>Ordnen Sie die Begriffe den nummerierten Positionen zu.</p>
    <p><em>Es gibt 2 zusätzliche Begriffe, die nicht passen.</em></p>
  ]]></text>
</questiontext>
```

**Ohne Distractors:** Jeden `<drag>` eine `<drop>`-Zone zuordnen, kein Hinweis nötig.

#### 7. Canvas-Größe wählen

- **4 oder weniger Zonen:** 420 × 200 px (für schmale Labels)
- **5-6 Zonen:** 600 × 400 px (empfohlen)
- **7+ Zonen oder breite Text-Labels:** 780 × 520 px

#### 8. Checkliste vor dem Import

- [ ] Bild als base64 kodiert und in `<file>` eingebunden
- [ ] `path="/"` bei `<file>` gesetzt
- [ ] Jedes `<drag>` hat eindeutige `<no>`
- [ ] Jedes `<drop>` verweist via `<choice>` auf existierendes `<drag>`
- [ ] Koordinaten liegen innerhalb der Bildgröße
- [ ] Mindestabstand von 80 px zwischen Drop-Zonen eingehalten
- [ ] Distractors im Fragetext angekündigt (falls vorhanden)
- [ ] SVG-Dateiname ist `background.svg` (nicht `diagram.svg` etc.)

---

### Template: numerical (Numerische Antworten)

**Verwendung:** Berechnungen, Messungen, Zahlenwerte

**Mit Toleranzbereich:**
```xml
<answer fraction="100" format="moodle_auto_format">
  <text>42</text>  <!-- Richtige Antwort -->
  <tolerance>0.5</tolerance>  <!-- Akzeptiert 41.5 bis 42.5 -->
</answer>
```

**Exakte Antwort:**
```xml
<answer fraction="100" format="moodle_auto_format">
  <text>100</text>
  <tolerance>0</tolerance>  <!-- Nur exakt 100 ist richtig -->
</answer>
```

---

### Template: gapselect (Lückentextauswahl)

**Verwendung:** Lückentext mit Dropdown-Auswahlmenüs (nicht Drag-and-Drop)

**Unterschied zu ddwtos:**
- **gapselect** = Dropdown-Menü direkt in der Lücke
- **ddwtos** = Begriffe per Drag-and-Drop ziehen

**Beispiel:**
```xml
<questiontext format="html">
  <text><![CDATA[
    <p>Ein Quadrat hat [[1]] Ecken und [[2]] Symmetrieachsen.</p>
  ]]></text>
</questiontext>

<!-- Optionen für Lücke [[1]] -->
<selectoption>
  <text>4</text>  <!-- Richtige Antwort -->
  <group>1</group>
</selectoption>
<selectoption>
  <text>3</text>  <!-- Falsch -->
  <group>1</group>
</selectoption>

<!-- Optionen für Lücke [[2]] -->
<selectoption>
  <text>4</text>  <!-- Richtige Antwort -->
  <group>2</group>
</selectoption>
<selectoption>
  <text>2</text>  <!-- Falsch -->
  <group>2</group>
</selectoption>
```

**Wichtig:**
- Erste `selectoption` jeder Gruppe = richtige Antwort
- `shuffleanswers="true"` mischt die Reihenfolge im Dropdown

---

### Template: cloze (Eingebettete Antworten)

**Verwendung:** Komplexe Fragen mit verschiedenen Antworttypen in einem Text

**Syntax:** `{PUNKTE:FRAGETYP:ANTWORTEN}`

**Verfügbare Fragetypen:**

| Typ | Syntax | Beispiel |
|-----|--------|----------|
| **MULTICHOICE** | `{1:MULTICHOICE:=Richtig~Falsch1~Falsch2}` | Einzelauswahl |
| **MULTIRESPONSE** | `{1:MULTIRESPONSE:~%50%Richtig1~%50%Richtig2}` | Mehrfachauswahl |
| **NUMERICAL** | `{1:NUMERICAL:=42:0.1}` | Zahl mit Toleranz |

> **⚠️ Nicht verwenden:** `SHORTANSWER` und `SHORTANSWER_C` (Freitext) sind in cloze-Fragen technisch möglich, aber in diesem Kurs **nicht erlaubt** – kein Template vorhanden. Stattdessen `MULTICHOICE` oder `gapselect` verwenden.

**Beispiel:**
```xml
<questiontext format="html">
  <text><![CDATA[
    <p>Ein Dreieck hat {1:NUMERICAL:=3:0} Ecken und ein Quadrat hat 
    {1:MULTICHOICE:=vier~drei} Seiten.</p>
    
    <p>Die Winkelsumme im Dreieck beträgt {1:NUMERICAL:=180:0} Grad.</p>
  ]]></text>
</questiontext>
```

**Wichtige Zeichen:**
- `=` = markiert richtige Antwort
- `~` = trennt verschiedene Antworten
- `%PROZENT%` = Punkteverteilung bei MULTIRESPONSE
- `:TOLERANZ` = Ungenauigkeit bei NUMERICAL

**Multiresponse-Beispiel (mehrere richtige):**
```
{2:MULTIRESPONSE:~%33.33%Rot~%33.33%Gelb~%33.33%Blau~%-100%Grün}
```
→ Rot, Gelb, Blau sind richtig (je 33%), Grün kostet 100% Abzug

---

### Template: ordering (Anordnung)

**⚠️ WICHTIG:** Dieser Fragetyp erfordert das **Moodle-Plugin "Ordering"**
- Plugin-Installation: [https://moodle.org/plugins/qtype_ordering](https://moodle.org/plugins/qtype_ordering)
- Standardmäßig nicht in Moodle enthalten

**Verwendung:** Elemente in die richtige Reihenfolge bringen

**Beispiele:**
- Prozessschritte chronologisch ordnen
- Signalkette von Quelle zu Ausgang
- OSI-Schichten von oben nach unten

**Struktur:**
```xml
<question type="ordering">
  <shuffleanswers>1</shuffleanswers>
  <layouttype>0</layouttype>  <!-- 0=VERTICAL, 1=HORIZONTAL -->
  <selecttype>0</selecttype>   <!-- 0=ALL anzeigen -->
  <selectcount>0</selectcount> <!-- 0=alle Elemente -->
  <gradingtype>0</gradingtype> <!-- 0=ALL_OR_NOTHING -->
  <showgrading>1</showgrading>
  
  <!-- Elemente in der RICHTIGEN Reihenfolge auflisten -->
  <answer fraction="1" format="html">
    <text><![CDATA[<p>Schritt 1: Planung</p>]]></text>
    <feedback format="html"><text></text></feedback>
    <md5key></md5key>
  </answer>
  
  <answer fraction="2" format="html">
    <text><![CDATA[<p>Schritt 2: Durchführung</p>]]></text>
    <feedback format="html"><text></text></feedback>
    <md5key></md5key>
  </answer>
  
  <answer fraction="3" format="html">
    <text><![CDATA[<p>Schritt 3: Kontrolle</p>]]></text>
    <feedback format="html"><text></text></feedback>
    <md5key></md5key>
  </answer>
  
  <correctfeedback format="html">
    <text>Die Reihenfolge ist vollständig korrekt!</text>
  </correctfeedback>
  <shownumcorrect/>
</question>
```

**Bewertungstypen (gradingtype):**
- `0` = ALL_OR_NOTHING (Alles richtig oder 0 Punkte)
- `1` = ABSOLUTE (Punkte für jedes richtig platzierte Element)
- `2` = LONGEST_CONTIGUOUS_SUBSET (Längste zusammenhängende Teilfolge)
- `3` = LONGEST_ORDERED_SUBSET (Längste korrekte Teilsequenz)

**Wichtig:**
- `fraction` = Position (1, 2, 3, 4, ...)
- `md5key` wird automatisch von Moodle generiert (leer lassen)
- Die Reihenfolge im XML IST die richtige Reihenfolge
- Moodle mischt automatisch beim Anzeigen
- **Zahlenwerte verwenden**, nicht Text (0 statt "VERTICAL")

---

## 🎨 SVG-Diagramme in Fragen einbinden

### Grundlagen

SVG-Grafiken können direkt im `<questiontext>` eingebettet werden:

```xml
<questiontext format="html">
  <text><![CDATA[<p>Betrachten Sie das Diagramm:</p>
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150">
  <rect x="50" y="30" width="200" height="80" fill="#ddd" stroke="#000"/>
  <text x="150" y="75" text-anchor="middle">Prozess A</text>
</svg>]]></text>
</questiontext>
```

**Vorteile von SVG:**
- Skaliert ohne Qualitätsverlust
- Editierbar im Code
- Kleine Dateigröße
- Funktioniert in allen Browsern

### SVG-Marker für Pfeile

Pfeile müssen im SVG definiert werden. Fügen Sie diese Marker-Definitionen am Anfang Ihres SVG ein:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
  <defs>
    <!-- Einfacher Pfeil -->
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" 
            orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#333"/>
    </marker>
    
    <!-- Vererbungspfeil (hohles Dreieck) -->
    <marker id="inherit" markerWidth="12" markerHeight="12" refX="10" refY="6"
            orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,12 L12,6 z" fill="#fff" stroke="#333" stroke-width="2"/>
    </marker>
    
    <!-- Gestrichelter Pfeil für optionale Beziehungen -->
    <marker id="dashed-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3"
            orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#666"/>
    </marker>
  </defs>
  
  <!-- Linien mit Markern -->
  <line x1="100" y1="50" x2="200" y2="50" stroke="#333" stroke-width="2" 
        marker-end="url(#arrow)"/>
  <line x1="100" y1="100" x2="200" y2="100" stroke="#333" stroke-width="2" 
        stroke-dasharray="6,3" marker-end="url(#dashed-arrow)"/>
</svg>
```

### HTML-Entities in SVG

**WICHTIG:** HTML-Entities wie `&auml;`, `&ouml;`, `&ndash;` dürfen NICHT außerhalb von CDATA verwendet werden!

**Falsch (führt zu Parse-Fehlern):**
```xml
<text>F&uuml;r Aktivit&auml;ten</text>  <!-- ❌ XML-Parser-Fehler -->
```

**Richtig - Option 1 (CDATA verwenden):**
```xml
<text><![CDATA[Für Aktivitäten]]></text>  <!-- ✅ -->
```

**Richtig - Option 2 (Unicode direkt):**
```xml
<text>Für Aktivitäten</text>  <!-- ✅ Bei UTF-8-Encoding -->
```

**Richtig - Option 3 (Numerische Entities):**
```xml
<text>F&#252;r Aktivit&#228;ten</text>  <!-- ✅ -->
```

### SVG-Editoren

- **[Inkscape](https://inkscape.org/)** - Kostenlos, professionell
- **[draw.io](https://app.diagrams.net/)** - Online, kostenlos, ideal für Diagramme
- **Adobe Illustrator** - Kostenpflichtig, Industrie-Standard
- **Figma** - Online, kostenlos für Einzelnutzer

### SVG für ddimageortext (Drag-Drop auf SVG)

Bei ddimageortext-Fragen wird das SVG als base64-kodierte Datei eingebunden:

```xml
<file name="background.svg" path="/" encoding="base64">BASE64-STRING-HIER</file>
```

**SVG in Base64 konvertieren (PowerShell):**
```powershell
$svg = Get-Content diagram.svg -Raw
$base64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($svg))
$base64 | Out-File -Encoding ASCII base64.txt
```

**Koordinatenberechnung für Drop-Zonen:**

Wenn Sie nummerierte Kreise im SVG verwenden (Radius r=11):
```xml
<!-- Kreis im SVG -->
<circle cx="200" cy="63" r="11" fill="#c00"/>
<text x="200" y="67" text-anchor="middle">1</text>
```

Die Drop-Zone-Koordinaten berechnen sich:
```xml
<drop>
  <xleft>189</xleft>  <!-- cx - r = 200 - 11 -->
  <ytop>52</ytop>     <!-- cy - r = 63 - 11 -->
</drop>
```

**⚠️ Überlappung von Drop-Zonen vermeiden:**

Moodle rendert Drag-Labels als schwebende Boxen. Zu nah beieinander liegende Zonen überlappen und sind nicht bedienbar.

**Regeln:**
- Mindestabstand: **≥ 80 px** vertikal oder **≥ 150 px** horizontal
- Nummernkreise in **leere Randbereiche** setzen
- **NICHT** über Diagrammelemente (Rechtecke, Ellipsen, Text) platzieren
- Gute Positionen: Ränder von Boxen, Außenbereiche, entlang von Pfeilen

---

## ⚙️ CDATA-Regeln

### Wann ist CDATA erforderlich?

**CDATA ist PFLICHT bei:**
- HTML-Tags im Text (`<p>`, `<strong>`, `<em>`, `<ul>`, `<li>`, etc.)
- SVG-Code innerhalb des questiontext
- HTML-Entities (`&auml;`, `&ouml;`, `&nbsp;`, etc.)

**CDATA ist NICHT nötig bei:**
- Reinem Text ohne HTML-Tags
- Numerischen Werten (`<text>42</text>`)
- Base64-kodierten Dateien

### Richtig vs. Falsch

**❌ Falsch (XML-Parser-Fehler):**
```xml
<text><p>Text mit <strong>HTML</strong></p></text>
```

**✅ Richtig:**
```xml
<text><![CDATA[<p>Text mit <strong>HTML</strong></p>]]></text>
```

### HTML-Entities außerhalb von CDATA

**❌ FEHLER - Entities außerhalb CDATA:**
```xml
<text>M&uuml;nchen hat sch&ouml;ne Pl&auml;tze</text>
<!-- Parse-Fehler: undefined entity &uuml; -->
```

**✅ Lösung 1 - CDATA verwenden:**
```xml
<text><![CDATA[München hat schöne Plätze]]></text>
```

**✅ Lösung 2 - Numerische Entities:**
```xml
<text>M&#252;nchen hat sch&#246;ne Pl&#228;tze</text>
```

**✅ Lösung 3 - UTF-8 direkt (bei korrektem Encoding):**
```xml
<text>München hat schöne Plätze</text>
```

### CDATA innerhalb von CDATA (NICHT möglich)

CDATA-Blöcke können **nicht verschachtelt** werden. Wenn Sie `]]>` im Text benötigen, teilen Sie CDATA:

**❌ Falsch:**
```xml
<text><![CDATA[Code: <![CDATA[...]]>]]></text>  <!-- Fehler! -->
```

**✅ Richtig:**
```xml
<text><![CDATA[Code: ]]]]><![CDATA[>]]></text>
```

### Warum CDATA?

**CDATA** = "Character Data" → Alles zwischen `<![CDATA[` und `]]>` wird als **reiner Text** behandelt, nicht als XML-Struktur.

- XML-Parser ignoriert `<`, `>`, `&` innerhalb von CDATA
- HTML-Tags werden nicht als XML-Tags interpretiert
- Ermöglicht sichere Einbettung von Code-Beispielen und HTML

---

## 🔢 Bewertung und Feedback

### Feedback-Typen

**Allgemeines Feedback** (nach Beantwortung):
```xml
<generalfeedback format="html">
  <text>Erklärung der richtigen Lösung...</text>
</generalfeedback>
```

**Antwortspezifisches Feedback:**
```xml
<answer fraction="100" format="html">
  <text><![CDATA[<p>Richtige Antwort</p>]]></text>
  <feedback format="html">
    <text>Sehr gut! Das ist korrekt weil...</text>
  </feedback>
</answer>
```

### Punkteverteilung

| Fragetyp | fraction | Bedeutung |
|----------|----------|-----------|
| Eine richtige Antwort | 100 | 100% der Punkte |
| Zwei richtige Antworten | 50 + 50 | Je 50% = 100% gesamt |
| Drei richtige Antworten | 33.33 + 33.33 + 33.34 | Je ~33% = 100% gesamt |
| Falsche Antwort | 0 oder negativ | Kein Punktabzug oder Abzug |

**Penalty** (Bestrafung für Wiederholung):
```xml
<penalty>0.3333333</penalty>  <!-- Nach 1. Versuch: -33% bei erneutem Versuch -->
```

---

## 📦 Mehrere Fragen in einer Datei

Sie können mehrere `<question>` Blöcke in einer XML-Datei kombinieren:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="multichoice">
    <!-- Frage 1 -->
  </question>
  
  <question type="ddmatch">
    <!-- Frage 2 -->
  </question>
  
  <question type="gapselect">
    <!-- Frage 3 -->
  </question>
</quiz>
```

Beim Import werden alle Fragen gleichzeitig importiert.

---

## 🛠️ Häufige Fehler und Lösungen

| Fehler | Ursache | Lösung |
|--------|---------|--------|
| **Import schlägt fehl** | XML-Syntaxfehler | 1. XML validieren: [xmlvalidation.com](https://www.xmlvalidation.com/)<br>2. Alle Tags geschlossen? `<text>...</text>`<br>3. CDATA korrekt? `<![CDATA[...]]>`<br>4. Encoding UTF-8? |
| **Umlaute falsch dargestellt** | Datei nicht als UTF-8 gespeichert | VS Code: Rechts unten auf Encoding klicken → "UTF-8"<br>Notepad++: Encoding → UTF-8 (ohne BOM) |
| **ParseError: undefined entity** | HTML-Entities (`&auml;`, `&uuml;`) außerhalb CDATA | Option 1: `<text><![CDATA[...]]></text>`<br>Option 2: Unicode direkt (ä, ö, ü)<br>Option 3: Numerische Entities (`&#228;`) |
| **String erwartet (CDATA?)** | HTML-Tags in `<text>` ohne CDATA | Text mit HTML muss in CDATA: `<text><![CDATA[<p>...</p>]]></text>` |
| **fraction addiert sich nicht zu 100%** | Bei multichoice: Punkte für richtige Antworten summieren sich nicht zu 100 | Beispiel: 3 richtige → je 33.33, 33.33, 33.34<br>2 richtige → je 50, 50 |
| **Drag-Drop: Bild erscheint nicht** | `<file>`-Name oder base64 fehlerhaft | 1. Dateiname muss `background.svg` sein (nicht `diagram.svg`)<br>2. `path="/"` gesetzt?<br>3. Base64 mit PowerShell neu erzeugen |
| **Drag-Drop: Koordinaten falsch** | xleft/ytop falsch berechnet | Bei Kreisen (r=11): `xleft = cx−11`, `ytop = cy−11`<br>Bei Rechtecken: `xleft = x`, `ytop = y` |
| **Drop-Label-Boxen überlappen** | Zonen zu nah (< 80 px) | Mindestabstand: ≥ 80 px vertikal, ≥ 150 px horizontal<br>Nummernkreise an Ränder setzen, nicht über Diagrammelemente |
| **Drop-Labels verdecken Diagramm** | Nummernkreise über Inhalt platziert | Kreise in Leerräume: Ränder, außerhalb, auf Pfeilen |
| **Distractors ohne Hinweis** | Überzählige drag-Items, aber kein Hinweistext | Im questiontext ankündigen: `<em>Es gibt X zusätzliche Begriffe, die nicht passen.</em>` |
| **Ankündigungssatz trotz fehlender Distractors** | Distractors entfernt, Text vergessen | Beim Entfernen von Distractors auch Ankündigungssatz löschen |
| **ordering: Import-Fehler** | Plugin nicht installiert | Plugin installieren: [moodle.org/plugins/qtype_ordering](https://moodle.org/plugins/qtype_ordering) |
| **ordering: "String erwartet"** | layouttype/selecttype/gradingtype als Text statt Zahl | Werte müssen Integer sein: `<layouttype>0</layouttype>` (nicht "VERTICAL") |
| **multichoice: Option wird nicht angezeigt** | Antwortoption beginnt mit `+`, `-`, `~` | Moodle-Sonderzeichen → Option umbenennen (z.B. `"positiv (+)"` statt `"+ positiv"`) |
| **10 Fragen erkannt, 0 importiert** | Mindestens 1 Frage hat Fehler → gesamter Import bricht ab | Fragen einzeln importieren um fehlerhafte zu identifizieren<br>XML validieren |
| **ParseError: not well-formed** | `--` (doppelter Bindestrich) in XML-Kommentar | Dekorations-Striche durch `==` ersetzen: `<!-- == Titel == -->` |
| **SVG-Pfeil rotiert falsch** | refX/refY im Marker falsch | Für vertikale Pfeile: `refX="7" refY="3"`, `points="0 0,8 3,0 6"` |
| **Vererbungspfeil zeigt falsch** | Marker nicht zur Elternklasse gerichtet | Linie startet bei Kindklasse, `marker-end` zeigt zur Elternklasse |
| **`<infinite/>` funktioniert nicht** | Falscher Fragetyp oder falsche Position | `<infinite/>` nur bei ddimageortext, innerhalb `<drag>`-Element |
| **CDATA verschachtelt** | `<![CDATA[` innerhalb von CDATA | NICHT möglich → CDATA splitten: `]]]]><![CDATA[>` für `]]>` im Text |
| **Base64 image zu groß** | Bild unkomprimiert oder zu hochauflösend | PNG komprimieren (TinyPNG), JPEG Qualität reduzieren, oder SVG verwenden |

---

## 📚 Weiterführende Ressourcen

- [Moodle Docs: Quiz XML Format](https://docs.moodle.org/en/Moodle_XML_format)
- [Moodle Docs: Question Types](https://docs.moodle.org/en/Question_types)
- [SVG Tutorial (MDN)](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial)
- [Base64 Encoder/Decoder](https://www.base64-image.de/)

---

## 💡 Tipps für die Praxis

### 1. Template-Bibliothek aufbauen

Erstellen Sie fachspezifische Templates basierend auf den generischen:
- `template-veranstaltungstechnik-zuordnung.xml`
- `template-netzwerktechnik-multichoice.xml`
- etc.

### 2. Schnelle Anpassungen mit Suchen & Ersetzen

1. Template kopieren
2. Alle Platzhalter markieren: `[TITEL]`, `[Begriff 1]`, etc.
3. Suchen & Ersetzen verwenden (Strg+H)
4. Systematisch durcharbeiten

### 3. Fragenpool organisieren

```
fragen/
├── templates/              # Generische Vorlagen (DIESES VERZEICHNIS)
├── veranstaltungstechnik/  # Fachspezifische Fragen
│   ├── grundlagen.xml
│   ├── lichttechnik.xml
│   └── tontechnik.xml
├── netzwerktechnik/
│   ├── osi-modell.xml
│   └── vlan.xml
└── ...
```

### 4. Versionierung mit Git

Tracken Sie Ihre Fragen mit Git:
```bash
git add fragen/
git commit -m "Neue Fragen zur Lichttechnik hinzugefügt"
```

---

## ✅ Checkliste vor dem Import

- [ ] Datei als **UTF-8** gespeichert
- [ ] XML ist **valide** (keine Syntaxfehler)
- [ ] Alle **Platzhalter** ersetzt
- [ ] **CDATA** bei HTML-Inhalten verwendet
- [ ] **fraction** addiert sich zu 100% (bei multichoice)
- [ ] **Feedback** sinnvoll formuliert
- [ ] **Bilder** als base64 kodiert (bei ddimageortext)
- [ ] **Koordinaten** geprüft (bei ddimageortext)

---

**Viel Erfolg beim Erstellen Ihrer Moodle-Fragen! 🎓**

*Letzte Aktualisierung: Februar 2026*
