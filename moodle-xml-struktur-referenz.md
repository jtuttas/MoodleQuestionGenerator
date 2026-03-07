# Moodle-XML Struktur-Referenz für KI-Agenten

Kompakte, maschinenlesbare Referenz aller Fragetypen inkl. Pflichtregeln und
häufiger Fehlerquellen. Dient als Schnell-Lookup vor der XML-Generierung.

---

## Grundstruktur (alle Typen)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="TYPE">
    <name><text>Fragetitel</text></name>
    <questiontext format="html">
      <text><![CDATA[<p>HTML-Inhalt</p>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[<p>Erläuterung nach dem Versuch</p>]]></text>
    </generalfeedback>
    <defaultgrade>1</defaultgrade>
    <penalty>0.1</penalty>
    <hidden>0</hidden>
    <idnumber></idnumber>
    <!-- typ-spezifische Felder -->
  </question>
</quiz>
```

**CDATA-Pflicht**: Jedes `<text>`-Element, das HTML enthält (`<p>`, `<strong>`,
`<code>`, SVG, …), **muss** in `<![CDATA[...]]>` stehen. Fehlendes CDATA
verursacht Importfehler „String erwartet".

---

## ddmatch – Drag-and-Drop Zuordnung

```xml
<question type="ddmatch">
  <!-- Gemeinsame Felder ... -->
  <shuffleanswers>true</shuffleanswers>
  <correctfeedback format="html"><text>Richtig!</text></correctfeedback>
  <partiallycorrectfeedback format="html"><text>Teilweise richtig.</text></partiallycorrectfeedback>
  <incorrectfeedback format="html"><text>Falsch.</text></incorrectfeedback>
  <shownumcorrect/>

  <!-- Echte Paare: subquestion (links) → answer (rechts) -->
  <subquestion format="html">
    <text><![CDATA[<p>Begriff oder Bild-Beschreibung</p>]]></text>
    <answer format="html">
      <text><![CDATA[<p>Passende Erklärung</p>]]></text>
    </answer>
  </subquestion>

  <!-- Distractor: leere subquestion, extra answer -->
  <subquestion format="html">
    <text><![CDATA[<p></p>]]></text>
    <answer format="html">
      <text><![CDATA[<p>Falscher Überschuss-Begriff</p>]]></text>
    </answer>
  </subquestion>
</question>
```

**Regeln:**
- Mindestens 1 Distractor (leere Subquestion mit nicht-passendem Answer).
- Alle `<text>`-Elemente mit HTML → CDATA.

---

## ddwtos – Drag-and-Drop in Lückentext

```xml
<question type="ddwtos">
  <!-- Gemeinsame Felder ... -->
  <shuffleanswers>1</shuffleanswers>
  <correctfeedback format="html"><text>Richtig!</text></correctfeedback>
  <partiallycorrectfeedback format="html"><text>Teilweise richtig.</text></partiallycorrectfeedback>
  <incorrectfeedback format="html"><text>Falsch.</text></incorrectfeedback>
  <shownumcorrect/>

  <!-- Lücken im Text: [[1]], [[2]], … -->
  <questiontext format="html">
    <text><![CDATA[<p>Text mit [[1]] und [[2]] als Lücken.</p>]]></text>
  </questiontext>

  <!-- Für jede Gruppe: mindestens 1 korrekte + 1 Distractor-Dragbox -->
  <dragbox><text>Richtige Antwort für Lücke 1</text><group>1</group></dragbox>
  <dragbox><text>Falscher Distractor für Lücke 1</text><group>1</group></dragbox>
  <dragbox><text>Richtige Antwort für Lücke 2</text><group>2</group></dragbox>
  <dragbox><text>Falscher Distractor für Lücke 2</text><group>2</group></dragbox>
</question>
```

**Regeln:**
- Lücken im Text als `[[n]]` (n = 1-basiert).
- Jede Gruppe `n` braucht ≥ 1 Distractor-Dragbox (group n, falscher Text).
- Dragbox-Texte sind Plaintext (kein CDATA nötig, außer bei HTML darin).
- Die richtige Antwort für Lücke `[[n]]` ist die erste Dragbox mit `<group>n</group>` im Moodle-Import-Kontext – aber die Reihenfolge ist nicht garantiert; Moodle erkennt die richtige Antwort anhand des Dragbox-Texts, der in der Musterlösung hinterlegt ist. **Wichtig:** Es gibt keine explizite „correct=true"-Markierung in ddwtos – die Zuordnung wird intern über die Fragereihenfolge gehandhabt. Beim Import prüft Moodle, welche Dragboxen zu welchen Lücken gehören, anhand der Reihenfolge.

---

## multichoice – Multiple Choice

```xml
<question type="multichoice">
  <!-- Gemeinsame Felder ... -->
  <single>true</single>          <!-- false = Mehrfachauswahl -->
  <shuffleanswers>true</shuffleanswers>
  <answernumbering>abc</answernumbering>   <!-- none | abc | ABCD | 123 -->
  <showstandardinstruction>1</showstandardinstruction>
  <correctfeedback format="html"><text>Korrekt!</text></correctfeedback>
  <partiallycorrectfeedback format="html"><text>Teilweise richtig.</text></partiallycorrectfeedback>
  <incorrectfeedback format="html"><text>Falsch.</text></incorrectfeedback>

  <!-- single=true: 1 richtige à 100 %, falsche à negativen Bruch -->
  <answer fraction="100" format="html">
    <text><![CDATA[<p>Richtige Antwort</p>]]></text>
    <feedback format="html"><text><![CDATA[Feedback]]></text></feedback>
  </answer>
  <answer fraction="-33.33333" format="html">
    <text><![CDATA[<p>Falsche Antwort</p>]]></text>
    <feedback format="html"><text><![CDATA[Feedback]]></text></feedback>
  </answer>

  <!-- single=false: korrekte Antworten summieren zu ~100 %, z.B. 2×50 oder 3×33.33 -->
  <!-- Falsche erhalten negativen Bruch, z.B. -50 -->
</question>
```

**Regeln:**
- Antworttext darf **nicht** mit `+`, `-`, `~` beginnen (Moodle-Sonderzeichen).
- Richtige Antworten nicht erkennbar länger machen als falsche (Ratelösung).
- Bei Mehrfachauswahl: `<single>false</single>`, richtige Brüche ≈ 100 % gesamt.

---

## cloze – Eingebettete Antworten (Lückentext)

```xml
<question type="cloze">
  <!-- Keine defaultgrade, penalty optional -->
  <hidden>0</hidden>
  <idnumber></idnumber>

  <questiontext format="html">
    <text><![CDATA[
<p>Text mit eingebetteter Frage:
{1:MULTICHOICE:Option A~Option B~=Richtig~Option C}</p>
<p>Numerische Lücke: {1:NUMERICAL:=42:0}</p>
<p>Kurzantwort: {1:SHORTANSWER:=Antwort}</p>
    ]]></text>
  </questiontext>
</question>
```

**Cloze-Syntax:**
| Format | Beispiel | Bedeutung |
|---|---|---|
| MULTICHOICE | `{1:MULTICHOICE:A~B~=C~D}` | `=` markiert korrekte Option |
| NUMERICAL | `{1:NUMERICAL:=42:2}` | Wert=42, Toleranz=2 |
| SHORTANSWER | `{1:SHORTANSWER:=Antwort}` | Exakte Übereinstimmung |

**Regeln:**
- `~` trennt Optionen, `=` markiert die richtige.
- **MULTICHOICE-Block MUSS auf einer einzigen Zeile stehen** – Zeilenumbrüche innerhalb `{…}` verhindern, dass Moodle das `=` erkennt → Validierungsfehler.
- Kein `<defaultgrade>` nötig; Note ergibt sich aus Teilfragen.
- Alle HTML im Fragetext → CDATA.

---

## SVG-Inline-Diagramme

```xml
<questiontext format="html">
  <text><![CDATA[
<p>Fragetext mit Diagramm:</p>
<svg xmlns="http://www.w3.org/2000/svg" width="440" height="200"
     style="font-family:Arial,sans-serif;font-size:13px;display:block;margin:10px auto;">
  <defs>
    <!-- Cisco-Symbole aus symbols/cisco/ als <symbol> einbetten -->
    <symbol id="rtr1" viewBox="0 0 60 41" overflow="visible">
      <!-- Pfade aus router.svg 1:1 kopieren -->
    </symbol>
  </defs>
  <!-- Elemente -->
  <use href="#rtr1" x="50" y="50" width="60" height="41"/>
  <text x="80" y="120" text-anchor="middle" font-size="11">R1</text>
  <line x1="..." y1="..." x2="..." y2="..." stroke="#1a5276" stroke-width="1.5"/>
</svg>
  ]]></text>
</questiontext>
```

**SVG-Pflichtregeln:**
- `xmlns="http://www.w3.org/2000/svg"`, feste `width`/`height`.
- Cisco-Netzwerksymbole **ausschließlich** aus `symbols/cisco/` (router, switch, pc).
- Symbol-IDs pro Diagramm eindeutig (Suffix `rtr1`, `sw2`, `pc3`, …).
- **Keine Farb-Hints** zur Lösung (alle gleichwertigen Elemente gleich einfärben).
- **Keine Überlappungen**: ≥ 10 px Abstand zwischen Boxen; Texte nicht von Linien geschnitten.
- `width`/`height` groß genug: alle Elemente inkl. Marker/Pfeile im sichtbaren Bereich.
- Schätzung Textbreite: ~7–8 px pro Zeichen bei `font-size:13px`.

---

## Qualitätscheckliste vor Fertigstellung

1. **XML valide?**
   ```bash
   python3 -c "import xml.etree.ElementTree as ET; ET.parse('res/DATEI.xml'); print('OK')"
   ```

2. **CDATA vollständig?**
   ```bash
   # Suche nach <text>-Elementen mit HTML ohne CDATA (Heuristik)
   grep -n "<text>[^<]*<[a-z]" res/DATEI.xml
   ```

3. **ddwtos-Gruppen vollständig?** Jede Gruppe `[[n]]` hat ≥ 2 Dragboxen.

4. **multichoice-Fraktionen korrekt?**
   - `single=true`: genau eine mit `fraction="100"`.
   - `single=false`: korrekte summieren zu ~100 %.

5. **Antwortlängen neutral?** Richtige Antwort nicht erkennbar länger als falsche.

6. **SVG-Lösung nicht verraten?** Kein Element durch Farbe/Position als Lösung markiert.

---

## Vollständiger Import-Workflow

### Schritt 1 – XML generieren

Beim Generieren **sofort** die `<!-- question: N -->` Marker einfügen (siehe unten).
Template-Datei als Basis nehmen (`templates/` oder Schnell-Template unten).

### Schritt 2 – XML validieren

```bash
# Syntaxvalidierung
python3 -c "import xml.etree.ElementTree as ET; ET.parse('res/DATEI.xml'); print('OK')"

# Cloze-Zeilen prüfen: keine Zeilenumbrüche innerhalb {…MULTICHOICE…}
grep -n "MULTICHOICE" res/DATEI.xml   # jede Zeile muss komplett in {} passen

# CDATA-Lücken suchen (HTML ohne CDATA)
grep -n "<text>[^<]*<[a-z]" res/DATEI.xml
```

### Schritt 3 – XML in Container kopieren

```bash
# Aus dem rest-moodle/docker/ Verzeichnis:
docker cp ../MoodleQuestionGenerator/res/DATEI.xml docker-moodle-1:/var/www/html/DATEI.xml
```

### Schritt 4 – Import und Quiz-Erstellung

```bash
docker compose exec moodle php /opt/moodle-scripts/quiz_import.php \
  --courseid=KURS_ID \
  --xml=/var/www/html/DATEI.xml \
  --category="Kategoriename" \
  --quizname="Quiz-Titel" \
  --section=N \
  [--timelimit=SEKUNDEN] \
  [--grade=PUNKTE] \
  [--rebuild]   # ersetzt bestehendes Quiz gleichen Namens
```

**Wichtig:** `quiz_import.php` liegt in `rest-moodle/docker/moodle-src/` (nicht in
`MoodleQuestionGenerator/docker/scripts/`). Wenn nicht als Volume gemountet:

```bash
docker exec docker-moodle-1 mkdir -p /opt/moodle-scripts
docker cp /pfad/zu/quiz_import.php docker-moodle-1:/opt/moodle-scripts/quiz_import.php
docker cp /pfad/zu/create_page.php  docker-moodle-1:/opt/moodle-scripts/create_page.php
```

### Schritt 5 – Duplikate prüfen

Nach mehrfachem Importversuch können Duplikate entstehen:

```sql
-- Duplikate in Kategorie X erkennen
SELECT q.name, COUNT(*) AS n
FROM mdl_question_bank_entries qbe
JOIN mdl_question_versions qv ON qv.questionbankentryid = qbe.id
JOIN mdl_question q ON q.id = qv.questionid
WHERE qbe.questioncategoryid = X AND qv.status = 'ready'
GROUP BY q.name HAVING n > 1;

-- Duplikate soft-deleten (IDs der überschüssigen Entries):
UPDATE mdl_question_versions SET status = 'hidden'
WHERE questionbankentryid IN (ID1, ID2, ...);
```

---

## Kritische Regeln für quiz_import.php

### PFLICHT: `<!-- question: N -->` Marker

`quiz_import.php` nutzt intern:
```php
preg_split('/<!-- question: [A-Za-z0-9]+ -->/', $xmlcontent)
```
→ **Ohne Marker werden 0 Fragen importiert** (kein Fehler, nur stilles Überspringen).

**Jede Frage MUSS einen solchen Kommentar unmittelbar davor haben:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<quiz>

<!-- question: q1 -->
<question type="ddmatch">
  ...
</question>

<!-- question: q2 -->
<question type="multichoice">
  ...
</question>

</quiz>
```

Der Wert nach `question:` ist beliebig (q1, q2, … oder 1, 2, …), muss aber
alphanumerisch ohne Leerzeichen sein.

### PFLICHT: Cloze MULTICHOICE auf einer Zeile

**Falsch** (Zeilenumbrüche → `=` wird nicht erkannt → Validierungsfehler):
```
{1:MULTICHOICE:Option A
~Option B
~=Richtig
~Option C}
```

**Richtig** (alles auf einer Zeile):
```
{1:MULTICHOICE:Option A~Option B~=Richtig~Option C}
```

Fehlermeldung bei Verletzung: *„Eine der Antworten sollte mit 100% bewertet werden"*

---

## Häufige Importfehler und Ursachen

| Symptom | Ursache | Fix |
|---|---|---|
| Quiz erstellt, aber 0 Fragen | `<!-- question: N -->` Marker fehlen | Marker vor jede `<question>` einfügen |
| „Eine Antwort sollte 100% haben" | Cloze-MULTICHOICE hat Zeilenumbrüche innerhalb `{…}` | Alle Optionen auf eine Zeile |
| „String expected" | HTML in `<text>` ohne CDATA | CDATA hinzufügen |
| „Invalid question type" | Tippfehler im `type`-Attribut | Korrekt: `ddmatch`, `ddwtos`, `multichoice`, `cloze` |
| Lücke bleibt leer (ddwtos) | Gruppe fehlt oder falsch nummeriert | Gruppe `n` für `[[n]]` anlegen |
| Quiz hat 0 Punkte | `defaultgrade` fehlt bei ddmatch/ddwtos/multichoice | Feld einfügen |
| Distractor erscheint nicht | Leere Subquestion hat keinen Answer-Text | Answer-Text befüllen |
| 16 statt 8 Fragen im Quiz | Duplikate aus mehrfachem Import | Duplikate per SQL soft-deleten, --rebuild |
| `create_page.php` not found | PHP-Skripte nicht im Container | `docker cp` in `/opt/moodle-scripts/` |
| `moodle_api.py` findet Container nicht | `docker_dir` zeigt auf falschen Stack | `docker_dir=Path(__file__).parent.parent/'docker'` |

---

## moodle_api.py – Automatisierungs-Hinweise

```python
from pathlib import Path
from moodle_api import MoodleAPI

# docker_dir MUSS auf den laufenden Stack zeigen (rest-moodle/docker/)
docker_dir = Path(__file__).parent.parent / 'docker'
api = MoodleAPI.from_env(docker_dir=docker_dir)

# XML-Pfad im Container (nicht api.res_path() wenn anderer Stack)
api.import_quiz(COURSE_ID, '/var/www/html/DATEI.xml', category='...', quizname='...', section=N)
```

Zwei Docker-Stacks existieren parallel:
- `rest-moodle/docker/` – **der laufende Stack** (Container `docker-moodle-1`)
- `MoodleQuestionGenerator/docker/` – eigener Stack (meistens nicht gestartet)

`moodle_api.py` muss immer auf den **laufenden** Stack zeigen.

---

## Schnell-Template: Neue Fragedatei

```xml
<?xml version="1.0" encoding="UTF-8"?>
<quiz>
<!-- Thema: XXX | Zielgruppe: XXX | Fragen: N | Erstellt: YYYY-MM-DD -->

  <question type="ddmatch">
    <name><text>Titel (leicht)</text></name>
    <questiontext format="html"><text><![CDATA[<p>Aufgabe</p>]]></text></questiontext>
    <generalfeedback format="html"><text><![CDATA[<p>Erklärung</p>]]></text></generalfeedback>
    <defaultgrade>1</defaultgrade><penalty>0.1</penalty><hidden>0</hidden><idnumber></idnumber>
    <shuffleanswers>true</shuffleanswers>
    <correctfeedback format="html"><text>Richtig!</text></correctfeedback>
    <partiallycorrectfeedback format="html"><text>Teilweise richtig.</text></partiallycorrectfeedback>
    <incorrectfeedback format="html"><text>Falsch.</text></incorrectfeedback>
    <shownumcorrect/>
    <subquestion format="html"><text><![CDATA[<p>Begriff</p>]]></text>
      <answer format="html"><text><![CDATA[<p>Erklärung</p>]]></text></answer></subquestion>
    <!-- weitere Paare -->
    <subquestion format="html"><text><![CDATA[<p></p>]]></text>
      <answer format="html"><text><![CDATA[<p>Distractor</p>]]></text></answer></subquestion>
  </question>

</quiz>
```
