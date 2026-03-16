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
- **`<dragbox>`-Struktur (Pflicht):**
  ```xml
  <dragbox>
    <text>Wort</text>
    <group>1</group>
  </dragbox>
  ```
- **Richtige Antwort = absolute Position im XML:** Bei `ddwtos` ist Lücke `[[1]]` = die **1. `<dragbox>` im gesamten XML**, Lücke `[[2]]` = die **2. `<dragbox>`**, usw. – unabhängig von der Gruppe. Die Gruppe bestimmt nur Farbe und welche Dragboxen in eine Lücke passen, **nicht** die Zuordnung zur Lücke. Distractoren kommen **nach** allen richtigen Antworten. Korrekte Reihenfolge:
  ```xml
  <!-- Richtige Antworten zuerst (Position = Lückennummer) -->
  <dragbox><text>extends</text><group>1</group></dragbox>       <!-- → [[1]] -->
  <dragbox><text>@Override</text><group>2</group></dragbox>     <!-- → [[2]] -->
  <dragbox><text>berechneFlaeche</text><group>3</group></dragbox> <!-- → [[3]] -->
  <!-- Distractoren danach -->
  <dragbox><text>implements</text><group>1</group></dragbox>
  <dragbox><text>@Overload</text><group>2</group></dragbox>
  <dragbox><text>getFlaeche</text><group>3</group></dragbox>
  ```
- **`infinite`-Flag (Pflicht korrekt!):** Moodle wertet `infinite` nach dem Prinzip `array_key_exists('infinite', ...)` aus – d.h. die **bloße Existenz** des Tags setzt das Flag auf true, egal welcher Wert drin steht.
  - Wort darf **mehrfach** verwendet werden → `<infinite/>` (leeres Tag)
  - Wort darf **nur einmal** verwendet werden → Tag **komplett weglassen** (kein `<infinite>0</infinite>`!)
  - `<infinite>0</infinite>` setzt infinite trotzdem auf true → **verboten**
  - `<infinite>1</infinite>` funktioniert **nicht zuverlässig** → immer `<infinite/>` verwenden
- **Lücken werden nur im Plaintext erkannt.** `[[n]]`-Syntax funktioniert in `format="html"` innerhalb von `<pre>`-Blöcken – aber niemals innerhalb von HTML-Attributen oder verschachtelten Tags.
- **`questiontext format="html"`** ist korrekt und ausreichend; `[[n]]` wird auch in HTML-CDATA erkannt.

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

#### Sourcecode in Aufgabentexten (Pflicht)
- **Jeglicher Sourcecode** im Aufgabentext (`<questiontext>`), in Feedbacks (`<feedback>`, `<generalfeedback>`) und in Antwortoptionen (`<answer>`) **muss** in einen Markdown-konformen Fenced-Code-Block eingebettet werden:
  ```
  ```java
  public class Beispiel { ... }
  ```
  ```
- Dies gilt für alle Programmiersprachen (Java, Python, SQL, …). Das Sprachkürzel nach den drei Backticks ist **Pflicht** (z. B. ` ```java `, ` ```python `, ` ```sql `).
- **Kein roher Code** außerhalb von Code-Blöcken: Inline-Bezeichner (Klassennamen, Methoden, Schlüsselwörter) bleiben in `<code>`-Tags, aber mehrzeilige Codeblöcke niemals als nackter Text oder nur in `<pre>` ohne Backtick-Fence.
- In HTML-CDATA-Blöcken (`<questiontext>`, `<feedback>` usw.) wird der Fenced-Code-Block als Ganzes in ein `<pre><code class="language-java">…</code></pre>`-Konstrukt überführt, damit Moodle ihn korrekt rendert und ggf. Syntax-Highlighting anwendet.
- **Konkretes Muster** für CDATA-Fragetext mit Javacode:
  ```xml
  <questiontext format="markdown">
    <text><![CDATA[
  Gegeben ist folgender Code:

  ```java
  public class Hund extends Tier {
      private String rasse;
  }
  ```

  Welche Aussage ist korrekt?
    ]]></text>
  </questiontext>
  ```
- Das `format`-Attribut des `<questiontext>`-Elements muss auf `"markdown"` gesetzt werden, sobald Fenced-Code-Blöcke genutzt werden, damit Moodle die Backtick-Syntax korrekt verarbeitet.

#### `coderunner` – Erlaubte Fragetypen (verbindlich)
Nur die folgenden `<coderunnertype>`-Werte dürfen verwendet werden – exakt so wie hier geschrieben, keine anderen:

| Typ | Verwendung |
|---|---|
| `java_class` | **Standard für Java-Aufgaben.** Schüler schreibt eine einzelne Klasse. |
| `java_method` | Schüler schreibt nur eine Methode (kein Klassenrumpf). |
| `java_program` | Schüler schreibt ein vollständiges Programm inkl. `main`. |
| `python3` | Python-3-Aufgaben. |
| `python3_w_input` | Python-3 mit `input()`-Aufrufen. |
| `python2` | Python-2-Aufgaben (Ausnahme, nur wenn explizit gefordert). |
| `c_function` | C – einzelne Funktion. |
| `c_program` | C – vollständiges Programm. |
| `cpp_function` | C++ – einzelne Funktion. |
| `cpp_program` | C++ – vollständiges Programm. |
| `php` | PHP-Aufgaben. |
| `sql` | SQL-Aufgaben. |
| `nodejs` | JavaScript/Node.js-Aufgaben. |
| `multilanguage` | Sprach-agnostische Aufgaben. |
| `pascal_function` | Pascal – einzelne Funktion. |
| `pascal_program` | Pascal – vollständiges Programm. |
| `octave_function` | Octave/MATLAB-Aufgaben. |
| `directed_graph` | Gerichtete Graphen. |
| `undirected_graph` | Ungerichtete Graphen. |

**Für alle Java-Vererbungsaufgaben gilt:** `<coderunnertype>java_class</coderunnertype>` – Schüler schreibt die Kindklasse, Elternklassen/Interfaces werden über das Python3-Template bereitgestellt.

#### `coderunner` – Java mit Hintergrundklassen (`java_class`)
- Wenn eine Elternklasse oder ein Interface vorgegeben werden soll (z. B. für Vererbung), darf dies **nicht** nur in `<globalextra>` stehen, da dies vom Java-Kompiler in der Sandbox nicht automatisch als ausführbare Datei erstellt wird.
- Stattdessen **muss ein eigenes `<template>` in `<language>python3</language>`** verwendet werden, das die Hintergrundklasse, den Studenten-Code und den Testfall explizit auf die Platte schreibt und zusammen kompiliert.
- **Kritisch für Java in Jobe-Sandbox:** Beim Aufruf von `javac` muss der JVM-Speicher limitiert werden, da die 64-Bit-Sandbox sonst oft beim Allokieren von 1 GB Class Space abstürzt (Fehler: `Could not allocate compressed class space`).
- Beispiel für das notwendige `os.system`-Kommando im Python-Template:
  `ret = os.system('javac -J-Xmx128m -J-XX:CompressedClassSpaceSize=64m -encoding UTF-8 AccountBase.java BankAccount.java Test.java 2>&1')`
  `if ret == 0: os.system('java -Xmx128m -XX:CompressedClassSpaceSize=64m -cp . Test')`
- Das Python-Template (`<template>`) in XML muss linksbündig (ohne führende Leerzeichen) beginnen, anderenfalls produziert der CodeRunner einen `IndentationError` in Python.
- **`<template>` muss immer in CDATA eingebettet sein:** `<template><![CDATA[\n ... \n]]></template>`. Ohne CDATA brechen `&`-Zeichen (z. B. in `-J-Xmx128m`) das XML.
- **Keine Sonderzeichen im `<name>`-Tag:** Fragetitel dürfen **keine Nicht-ASCII-Zeichen** enthalten (kein `–` U+2013, kein `—`, keine Umlaute außerhalb von CDATA). Statt `–` immer einfaches `-` verwenden. Das `<name>`-Tag wird nicht in CDATA eingebettet und muss daher reines ASCII sein. Das `<answer>`-Tag darf in CodeRunner-Fragen **nicht** vorkommen. Moodle's Import-Parser interpretiert es als Array und wirft `mysqli::real_escape_string(): Argument #1 must be of type string, array given`. Die Musterlösung gehört ausschließlich in `<generalfeedback>`, nie in `<answer>`.
- **Separate XML-Dateien pro Aufgabe:** CodeRunner-Fragen immer als einzelne XML-Dateien exportieren (eine Datei = eine Frage), nicht gebündelt mit anderen Fragetypen, um Import-Konflikte zu vermeiden.
- **`<expected>` immer in CDATA:** Das `<expected><text>`-Element muss immer in CDATA eingebettet sein: `<expected><text><![CDATA[...]]></text></expected>`. Ohne CDATA führen Sonderzeichen (z. B. `–` U+2013, `|`, Umlaute) zu `mysqli`-Fehlern beim Import.
- **Kein `textwrap.dedent()` mit Triple-Quotes im Template:** Triple-Quote-Strings im Python-Template dürfen nicht zusammen mit `printf`-Formatstrings (`%s`, `%f`, `%n`) verwendet werden – Moodle's Template-Engine kann `%`-Sequenzen fehlinterpretieren. Stattdessen **immer einfache String-Konkatenation** verwenden:
  ```python
  # RICHTIG: String-Konkatenation
  src = (
      "public class Beispiel {\n"
      "    private String name;\n"
      "}\n"
  )
  # EINZIGE Ausnahme: student_src darf Triple-Quotes nutzen
  student_src = """{{ STUDENT_ANSWER }}"""
  ```

#### `stack` – XML-Tag-Regeln (kritisch)
- **`<name>`-Tag statt `<n>`-Tag (Pflicht):** Neuere Moodle-Versionen (4.x) erwarten für STACK-Fragen durchgehend `<name>` statt `<n>`. Dies gilt für **alle** Ebenen:
  - Fragetitel: `<name><text>Titel der Frage</text></name>`
  - Input-Namen: `<name>ans1</name>`, `<name>ans2</name>` usw.
  - PRT-Namen: `<name>prt1</name>`
  - Node-Nummern: `<name>0</name>`, `<name>1</name>` usw.
- Das Template `template-stackaufgabe_algorithmik.xml` verwendet noch den alten `<n>`-Tag – beim Generieren **immer** `<name>` verwenden, nie `<n>`.
- **Keine Nicht-ASCII-Zeichen** im `<name>`-Tag (Fragetitel): kein `–`, `—`, keine Umlaute. Statt `–` immer `-` verwenden.


## SVG-Regeln (Inline im Fragetext)
- SVG immer inline im CDATA-Fragetext, mit:
  - `xmlns="http://www.w3.org/2000/svg"`
  - fixer `width`/`height`
  - Style: `font-family:Arial,sans-serif;font-size:13px;display:block;margin:10px auto;`

### Marker/Pfeile
- Definiere Marker in `<defs>` und verwende sie per `marker-end="url(#id)"`.
- Für gestrichelte Beziehungen: `stroke-dasharray="6,3"`.

### Flussdiagramme – Kontrollflusspfeile (kritisch)
- **Pfeile dürfen NIEMALS durch Boxen, Rauten oder andere Elemente gehen.** Jede Linie muss außen um alle Elemente herumgeführt werden.
- **Rücksprungpfeile** (z. B. Schleifenrücksprung zur Bedingung) müssen **seitlich außen** um sämtliche Elemente herumgeführt werden – typisch links oder rechts vorbei, mit ausreichend Abstand (≥ 12 px zur nächsten Box-Kante).
- **Vor dem Abschluss rechnerisch prüfen:** Liegt die Rücksprunglinie bei x=X? Dann muss gelten: X < (linke Kante aller Elemente auf diesem Weg − 12 px). Gleiches gilt für rechts geführte Rücksprünge.
- **Zuweisungen** in Flussdiagramm-Boxen immer mit `=` schreiben, **niemals** mit `←`: z. B. `s = s + a`, `a = a - 1`, **nicht** `s ← s + a`.
- **Muster für einen korrekten Links-Rücksprung** (Schleife zurück zur Bedingungsraute bei y=150, linke Spitze bei x=190):
  ```svg
  <!-- a=a-1 Box linke Kante bei x=220, Box-Mitte y=308 -->
  <line x1="220" y1="308" x2="8" y2="308"/>   <!-- nach links außen -->
  <line x1="8" y1="308" x2="8" y2="150"/>      <!-- hoch, außen an allen Elementen vorbei -->
  <line x1="8" y1="150" x2="190" y2="150" marker-end="url(#arr)"/>  <!-- zur Raute -->
  ```

- **Merge-Rauten immer nach UNTEN verlassen.** Die Zusammenführungsraute (leere Raute) wird stets an ihrer S-Spitze nach unten verlassen – niemals seitlich. Folgeelemente (weitere Merge-Rauten, Aktionsboxen) liegen direkt darunter auf gleicher x-Achse.
- **Aktivitätsboxen (horizontale Zweige): Eintritt und Austritt auf GLEICHER Höhe.** Wenn eine Box von links/rechts (horizontal) betreten wird, muss sie auch auf derselben Seite **horizontal** verlassen werden – niemals an der Unterkante. Konkret: Austritt an der **gegenüberliegenden** kurzen Seite der Box (linke Kante bei linksseitigem Zweig), dann senkrecht auf dem Außenpfad weiterführen.
  ```svg
  <!-- Raute W-Spitze bei (204,80) → Box rechte Kante (164,80) → Box cy=80 -->
  <line x1="204" y1="80" x2="164" y2="80" marker-end="url(#arr)"/>  <!-- Eintritt rechts -->
  <rect x="60" y="64" width="104" height="32" .../>                  <!-- Box cy=80 -->
  <line x1="60" y1="80" x2="30" y2="80"/>                           <!-- Austritt LINKS, gleiche Höhe y=80 -->
  <line x1="30" y1="80" x2="30" y2="370"/>                          <!-- senkrecht auf Außenpfad -->
  ```

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
  - Wenn Aggregation/Komposition gezeichnet ist, muss das passende Attribut in der „Ganzes"-Klasse modelliert sein (z. B. `tiere: Tier[]` für Komposition, `pfleger: Pfleger[]` für Aggregation).
  - **Auch die „Teil"-Klasse** trägt bei einer Assoziation (`→`) das passende Referenzattribut, wenn die Beziehung aus der Klasse heraus navigierbar sein soll (z. B. `pfleger: Pfleger` in `Tier`).
  - **Alle Attribute einheitlich formatieren:** Assoziationsattribute (Typ = Klassenname) dürfen **nicht kursiv oder grau** dargestellt werden — in UML gibt es keine Konvention, die Objektreferenzattribute optisch von primitiven Attributen unterscheidet.
  - **Bevorzugtes Layout:** Klassen, die über Aggregation/Komposition verbunden sind, horizontal nebeneinander anordnen. Die Raute (◆/◇) sitzt dabei **horizontal** zwischen Linie und Klassenbox — nicht als schräge Diagonale. Die Assoziation (`→`) zwischen Klassen auf gleicher Ebene wird als U-förmige Linie unterhalb der Boxen geführt.
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
- **Multiplizitätslabels weglassen, wenn sie Teil der Lösung sind:** Wenn eine Lücke `[[n]]` die korrekte Antwort `"1"`, `"0..*"` o. ä. enthält, dürfen diese Werte **nicht** im Diagramm als Label sichtbar sein — sonst ist die Lösung direkt ablesbar.

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
   - **Zeitangabe-Badge:** `⏱ ca. X min` – Berechnung: **2 Minuten pro Frage** (Anzahl Fragen × 2). Beispiel: 2 Fragen → „ca. 4 min", 5 Fragen → „ca. 10 min".

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

