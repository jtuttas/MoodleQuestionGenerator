# Copilot Instructions – Moodle Quiz XML + SVG

## Zweck
Diese Instruktionsdatei steuert die Arbeit im Repository knapp und konfliktfrei.
Die fachlich führende Spezifikation für Moodle-XML, Fragetypen, SVG-Regeln, HTML-Vorschau und CodeRunner-Details ist `SKILL.md`.

## Priorität der Dokumente
Arbeite in dieser Reihenfolge:
1. `SKILL.md` als maßgebliche Fachspezifikation.
2. `moodle-xml-struktur-referenz.md` als Struktur- und Importreferenz.
3. `templates/README.md` und die XML-Dateien im Ordner `templates/` als konkrete Vorlagen.
4. Diese Datei für die knappen repo-spezifischen Leitplanken unten.

Falls ältere Hinweise in anderen Dateien abweichen, gilt `SKILL.md`.

## Repo-spezifische Leitplanken
- Erzeuge Moodle-Quizfragen als Moodle-4.x-XML.
- Speichere erzeugte XML-Dateien im Ordner `res/`.
- Verwende sprechende Dateinamen nach dem Muster `res/quiz_<thema>_<datum>.xml`.
- Erzeuge zu jeder XML-Datei immer auch eine HTML-Vorschau als separate Datei.
- Schreibe XML immer mit XML-Header und UTF-8-Encoding.
- Nutze für neue Aufgaben die Vorlagen aus `templates/` und beachte `templates/README.md`.

## Verbindlicher Arbeitsablauf
1. Fehlende Parameter kurz klären: Thema, Zielgruppe, Schwierigkeitsgrad, Anzahl Fragen, gewünschte Fragetypen.
2. Vor der Generierung `SKILL.md` konsultieren.
3. Danach `moodle-xml-struktur-referenz.md` für XML-Struktur und Import-Fallstricke konsultieren.
4. Passende Vorlage aus `templates/` wählen.
5. XML erzeugen und validieren.
6. Immer zusätzlich eine HTML-Vorschau als zweite Ausgabedatei erzeugen.
7. `README.md` im Abschnitt „Enthaltene Fragendateien" aktualisieren, wenn eine neue Fragendatei erzeugt oder geändert wurde.

## Kritische Zusatzprüfungen für den Import
Diese Punkte bleiben hier explizit stehen, weil sie repo-spezifische Importfehler verhindern:

### 1. Frage-Marker sind Pflicht
Jede Frage braucht vor dem `<question ...>`-Block einen Marker im Format:

```xml
<!-- question: q1 -->
<question type="...">...</question>
```

Ohne diese Marker kann der Import still mit 0 Fragen enden.

### 2. Cloze-MULTICHOICE immer auf einer Zeile
Cloze-Blöcke mit `MULTICHOICE` dürfen innerhalb von `{ ... }` keine Zeilenumbrüche enthalten, damit richtige Antworten korrekt erkannt werden.

## Abschluss im Chat
Am Ende knapp angeben:
- Dateiname
- Anzahl Fragen und verwendete Fragetypen
- ob SVG enthalten ist
- ob zusätzlich eine HTML-Vorschau erzeugt wurde
