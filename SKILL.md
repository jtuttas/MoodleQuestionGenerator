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
   - Fragentitel-Tag: die 4 Buchstaben **n, a, m, e** (NICHT abgekürzt!) – siehe Pflichtregeln unten
4. Wenn ein Diagramm hilft: **SVG inline** im Fragetext (siehe SVG-Regeln unten).
5. Vor dem Abschluss: XML-Validierung durchführen (siehe Validierung).

## Moodle-XML Pflichtregeln

### Fragentitel-Tag (KRITISCH – häufige Fehlerquelle)
- Der XML-Tag für den Fragentitel heißt wörtlich **n-a-m-e** (4 Buchstaben), NICHT das Einzelzeichen "n".
- Korrekte Schreibweise im XML (Buchstabe für Buchstabe: Kleiner-als, n, a, m, e, Größer-als):
  ```xml
  <question type="multichoice">
    <!-- Tag-Name besteht aus den 4 Buchstaben: n, a, m, e -->
    <na&#x6D;e>
      <text>Mein Fragetitel</text>
    </na&#x6D;e>
  ```
- **WARNUNG:** Dieses Dokument kann den Tag-Namen aufgrund von HTML-Rendering-Problemen verkürzt darstellen. Der tatsächliche Tag in Moodle-XML ist IMMER das englische Wort für "Name" mit 4 Buchstaben. Im Zweifelsfall orientiere dich an den Template-Dateien im Ordner `templates/` – dort ist der Tag korrekt geschrieben.
- **Verifikation:** Nach dem Erzeugen der XML-Datei muss geprüft werden, dass der Tag 4 Buchstaben hat (Hex: `3c6e616d653e`). Ein Tag mit nur 1 Buchstabe (`3c6e3e`) ist FALSCH und führt dazu, dass Moodle keinen Fragentitel anzeigt.
- **Reines ASCII im Titel-Tag:** Keine Umlaute, keine Nicht-ASCII-Zeichen (kein `–` U+2013, kein `—`). Statt `ü` → `ue`, statt `–` → `-`.

### CDATA (kritisch)
- **Jedes** `<text>`-Element, das HTML enthält, **muss** in CDATA stehen:
  - `<questiontext><text>`: praktisch immer (enthält meist HTML/SVG)
  - `<answer><text>` / `<feedback><text>` / `<generalfeedback><text>`: sobald HTML-Tags wie `<p>`, `<code>`, `<strong>` etc. enthalten sind
- Vermeide Importfehler („String erwartet“), indem du konsequent so schreibst:
  - `<text><![CDATA[ ... HTML ... ]]></text>`

### Deutsche Umlaute und Sonderzeichen (Pflicht)
- **Immer korrekte deutsche Umlaute verwenden:** ä, ö, ü, Ä, Ö, Ü, ß — niemals Ersatzschreibungen wie ae, oe, ue, ss.
- Innerhalb von CDATA-Blöcken sind alle Unicode-Zeichen sicher. Das XML-Encoding `UTF-8` in der Deklaration stellt die korrekte Verarbeitung sicher.
- Gilt für Fragetexte, Antwortoptionen, Feedbacks, Titel und die HTML-Vorschau gleichermaßen.

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
- **Mischung beachten (kritisch):** Moodle mischt die Antwortoptionen bei `<shuffleanswers>true</shuffleanswers>` zufällig. Daher dürfen Antworten **keine positionsabhängigen Formulierungen** enthalten (z. B. nicht „Alle oben genannten", „Antwort A und C sind richtig", „Die erste Aussage …"). Jede Antwortoption muss **eigenständig verständlich** sein, unabhängig davon, an welcher Stelle sie im Quiz angezeigt wird. Auch in der HTML-Vorschau dürfen richtige und falsche Antworten **nicht** in fester Reihenfolge (z. B. erst alle richtigen, dann alle falschen) angezeigt werden – stattdessen in gemischter Reihenfolge darstellen.

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
- **Keine Sonderzeichen im Fragentitel-Tag (n-a-m-e):** Fragetitel dürfen **keine Nicht-ASCII-Zeichen** enthalten (kein `–` U+2013, kein `—`, keine Umlaute). Statt `–` immer einfaches `-` verwenden. Der Fragentitel-Tag wird nicht in CDATA eingebettet und muss reines ASCII sein. Siehe auch den Abschnitt "Fragentitel-Tag" oben. Das `<answer>`-Tag darf in CodeRunner-Fragen **nicht** vorkommen. Moodle's Import-Parser interpretiert es als Array und wirft `mysqli::real_escape_string(): Argument #1 must be of type string, array given`. Die Musterlösung gehört ausschließlich in `<generalfeedback>`, nie in `<answer>`.
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

## SVG-Regeln (Inline im Fragetext)
- SVG immer inline im CDATA-Fragetext, mit:
  - `xmlns="http://www.w3.org/2000/svg"`
  - fixer `width`/`height` **und** `viewBox="0 0 <width> <height>"`
  - Style: `font-family:Arial,sans-serif;font-size:13px;display:block;margin:10px auto;`
- **Responsive Skalierung (Pflicht):** In der HTML-Vorschau müssen alle SVGs skalierbar sein. Dazu im CSS: `svg { max-width: 100%; height: auto; }`. Das `viewBox`-Attribut ist zwingend erforderlich, damit die SVG bei kleinen Viewports proportional skaliert statt abgeschnitten zu werden.

### Marker/Pfeile
- Definiere Marker in `<defs>` und verwende sie per `marker-end="url(#id)"`.
- Für gestrichelte Beziehungen: `stroke-dasharray="6,3"`.

### Netzwerktopologien – Cisco-Symbole (Pflicht)
- Bei **jeder** Netzwerktopologie-Darstellung (VLANs, Routing, Switching, IP-Netze, etc.) **müssen** die Symbole aus `symbols/cisco/` verwendet werden.
- Verfügbare Symbole:
  | Datei | Symbol | viewBox | Empfohlene Rendergröße |
  |---|---|---|---|
  | `symbols/cisco/router.svg` | Cisco Router (3D-Zylinder, blau) | `0 0 60 41` | `width="84" height="57"` |
  | `symbols/cisco/switch.svg` | Cisco L2-Switch (3D-Gehäuse, blau) | `0 0 77 39` | `width="66" height="34"` |
  | `symbols/cisco/pc.svg` | Cisco PC/Workstation (3D-Arbeitsplatz, blau) | `0 0 59 53` | `width="78" height="70"` |

- **Einbettung: ausschließlich via Base64-`<image>`-Tag** (Pflicht, keine andere Methode):
  1. SVG-Datei binär lesen und als Base64 kodieren (Python: `base64.b64encode(data).decode()`)
  2. Data-URI bauen: `data:image/svg+xml;base64,<BASE64>`
  3. Im Topologie-SVG als `<image href="<DATA-URI>" x="..." y="..." width="..." height="..."/>` einsetzen

  **Python-Snippet (immer so verwenden):**
  ```python
  import base64

  symbols = {}
  for name in ['pc', 'switch', 'router']:
      with open(f'/mnt/skills/user/moodle-fragen-generator/symbols/cisco/{name}.svg', 'rb') as f:
          data = f.read()
      symbols[name] = 'data:image/svg+xml;base64,' + base64.b64encode(data).decode()

  PC = symbols['pc']
  SW = symbols['switch']
  RT = symbols['router']
  ```

  **Verwendung im SVG-String:**
  ```python
  svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="580" height="200" ...>
    <!-- PC bei (x=18, y=53), 78×70 px -->
    <image href="{PC}" x="18" y="53" width="78" height="70"/>
    <text x="57" y="134" text-anchor="middle" font-size="12" font-weight="bold">PC-A</text>
    <text x="57" y="147" text-anchor="middle" font-size="10" fill="#495057">192.168.1.10</text>

    <!-- Switch bei (x=158, y=71), 66×34 px -->
    <image href="{SW}" x="158" y="71" width="66" height="34"/>
    <text x="191" y="115" text-anchor="middle" font-size="12" font-weight="bold">SW-A</text>

    <!-- Router bei (x=252, y=61), 84×57 px -->
    <image href="{RT}" x="252" y="61" width="84" height="57"/>
    <text x="291" y="126" text-anchor="middle" font-size="12" font-weight="bold">Router R1</text>

    <!-- Verbindungslinien als <line>-Elemente -->
    <line x1="96" y1="88" x2="158" y2="88" stroke="#495057" stroke-width="2"/>
  </svg>'''
  ```

- **Ankerpunkte** (Mitte des Symbols, für Verbindungslinien-Berechnung):
  | Symbol | Horizontale Mitte | Vertikale Mitte (Anschluss) |
  |---|---|---|
  | PC (78×70) | x + 39 | y + 35 |
  | Switch (66×34) | x + 33 | y + 17 |
  | Router (84×57) | x + 42 | y + 28 |

- **Keine selbst gezeichneten** Router/Switch/PC-Primitive (Kreise, Rechtecke, etc.) – ausschließlich die Cisco-Symbole via Base64-`<image>`.
- Trunk-Links und einfache Verbindungslinien werden als SVG-`<line>`-Elemente gezeichnet (kein Symbol notwendig).
- Labels (Gerätename, IP-Adresse) werden als `<text>`-Elemente **unterhalb** des Symbols platziert, vertikal versetzt: Name bei `symbol_y + symbol_height + 12`, IP bei `symbol_y + symbol_height + 24`.

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

### Bepunktung (`<defaultgrade>`) – Pflicht
**Die Punktzahl einer Frage muss der Anzahl der Bewertungseinheiten entsprechen:**
- **`multichoice` (Mehrfachauswahl):** `<defaultgrade>` = Anzahl der **richtigen** Antwortoptionen. Beispiel: 3 richtige Antworten → `<defaultgrade>3</defaultgrade>`. Die `fraction`-Werte der richtigen Antworten summieren sich weiterhin zu ≈ 100 % (z. B. 3 × 33.33333).
- **`multichoice` (Einfachauswahl):** `<defaultgrade>1</defaultgrade>`.
- **`ddwtos` (Drag & Drop in Text):** `<defaultgrade>` = Anzahl der **Lücken** (`[[n]]`). Beispiel: 5 Lücken → `<defaultgrade>5</defaultgrade>`.
- **`ddmatch` (Zuordnung):** `<defaultgrade>` = Anzahl der **Zuordnungspaare** (`<subquestion>`).
- **`cloze`:** Punktzahl ergibt sich automatisch aus den eingebetteten Teilfragen.
- **`coderunner`:** `<defaultgrade>` = Anzahl der Testfälle (oder nach Aufgabenkomplexität).
- **HTML-Vorschau:** Die angezeigte Punktzahl pro Frage und die Gesamtpunktzahl im Quiz-Header und in der Sidebar müssen mit den `<defaultgrade>`-Werten übereinstimmen.

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

### Fragentitel-Tag-Validierung (PFLICHT)
Nach jeder XML-Erzeugung MUSS geprüft werden, dass der Fragentitel-Tag korrekt ist (4 Buchstaben: n,a,m,e). Verwende dazu dieses Skript:

```python
import xml.etree.ElementTree as ET
tree = ET.parse('DATEI.xml')
for q in tree.getroot().findall('question'):
    n = q.find('name')  # sucht Tag mit 4 Buchstaben n-a-m-e
    if n is not None and n.find('text') is not None:
        print(f"OK: tag='{n.tag}', titel='{n.find('text').text}'")
    else:
        print(f"FEHLER: Frage hat keinen korrekten Fragentitel-Tag!")
```

Wenn die Ausgabe `tag='name'` (4 Buchstaben) zeigt, ist der Tag korrekt. Wenn `tag='n'` (1 Buchstabe) erscheint, muss die XML korrigiert werden – Moodle zeigt sonst keinen Fragentitel an.

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
   - **Zeitberechnung:** Die angezeigte Bearbeitungszeit wird automatisch aus der Fragenanzahl berechnet: **2 Minuten pro Frage** (z. B. 5 Fragen → „10 Min.", 8 Fragen → „16 Min.").

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

6. **Lehrkraft-Werkzeuge (Pflicht, Sidebar-Karte):** Die HTML-Vorschau richtet sich an Lehrkräfte. In der Sidebar muss eine Karte „Lehrkraft-Werkzeuge" mit folgenden Buttons vorhanden sein:
   - **„Lösung anzeigen / Lösung verbergen"** – Toggle-Schalter. Bei Aktivierung werden alle korrekten Antworten visuell hervorgehoben (grüner Rahmen/Hintergrund), bei Deaktivierung wird der Ausgangszustand wiederhergestellt.
   - **„Neu beginnen"** – Setzt das gesamte Quiz in den Ausgangszustand zurück: alle Auswahlen, Feedback-Boxen, DnD-Zuordnungen, Fortschrittsanzeige und Navigations-Markierungen werden gelöscht. Ermöglicht der Lehrkraft, die Vorschau erneut durchzuspielen.
   - **Keine Submit-/Abschließen-Leiste** – die Vorschau ist kein echtes Quiz.

### Interaktivität (verbindlich, via inline JavaScript)

#### Multiple Choice (`multichoice`)
- **Indikator-Typ:** Bei `<single>true</single>` (Einfachauswahl) → **Kreis** (Radio-Button-Optik, `border-radius:50%`). Bei `<single>false</single>` (Mehrfachauswahl) → **Quadrat** (Checkbox-Optik, `border-radius:3px`). Der Indikator muss den tatsächlichen Fragetyp widerspiegeln.
- Antwortoptionen als `.answer-option` mit linkem Indikator (`.answer-indicator`)
- **Einfachauswahl (`single=true`):** Klick → sofortige visuelle Auswertung (kein separater Check-Button):
  - Richtig: `.correct` → `background: var(--moodle-green-light)`, grüner Rahmen, ✓ im Indikator
  - Falsch: `.incorrect` → `background: var(--moodle-red-light)`, roter Rahmen, ✗ im Indikator
  - Alle anderen Optionen werden deaktiviert (`onclick = null`)
- **Mehrfachauswahl (`single=false`) — KRITISCH:**
  - Klick auf eine Option **togglet** nur den Auswahlstatus (`.selected`-Klasse + Häkchen im Indikator). Es findet **keine sofortige Auswertung** statt!
  - Unter den Optionen erscheint ein Button **„Antwort prüfen"**, der erst nach Klick die Auswertung durchführt.
  - Bei Auswertung: alle ausgewählten richtigen Optionen → `.correct`, alle ausgewählten falschen → `.incorrect`, nicht ausgewählte richtige → grüner Rahmen als Hinweis.
  - **Niemals** bei Klick auf eine einzelne Option automatisch alle anderen korrekten Antworten aufdecken!
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

#### onclick-Attribut-Quoting — KRITISCH

HTML-Attribute werden durch doppelte Anführungszeichen begrenzt. Wenn ein `onclick`-Attribut selbst Array-Literale mit String-Elementen enthält, **müssen** diese einfache Anführungszeichen verwenden — sonst bricht der HTML-Parser das Attribut nach dem ersten `"` ab und der Button ist dauerhaft defekt.

**Falsch (bricht interaktivität):**
```html
<button onclick="checkDnd(1,["A","B","C"])">Antwort prüfen</button>
```

**Richtig:**
```html
<button onclick="checkDnd(1,['A','B','C'])">Antwort prüfen</button>
```

Diese Regel gilt für alle `check*`-Funktionen (`checkDnd`, `checkMatch`, `checkGap`, `checkOrdering`, `checkNum`) und jeden anderen `onclick`-Aufruf, der String-Argumente enthält.

**Achtung:** Auch Strings, die Leerzeichen oder Sonderzeichen wie `(`, `)` enthalten (z.B. `'direkt (ueber SW-A)'`), müssen in einfachen Anführungszeichen stehen.

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

