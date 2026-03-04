# MoodleQuestionGenerator

Dieses Repository dient der Erstellung von **Moodle-Quizfragen im XML-Format** (Moodle 4.x) – wahlweise mit eingebetteten **SVG-Diagrammen** (UML, Netzwerktopologien). Ein Copilot-Agent übernimmt die Generierung auf Basis von Thema, Zielgruppe und gewünschtem Schwierigkeitsgrad.

---

## Verzeichnisstruktur

```
MoodleQuestionGenerator/
├── res/                              # Generierte Moodle-XML-Fragedateien
│   ├── quiz_aggregation_komposition_20260223.xml
│   ├── quiz_aggregation_komposition_20260304.xml
│   ├── quiz_coderunner_java_oop_20260304.xml
│   ├── quiz_coderunner_java_vererbung_20260304.xml
│   ├── quiz_vlan_systemintegration_20260223.xml
│   ├── quiz_nm_beziehungen_20260224.xml
│   └── quiz_troubleshooting_ip_netzwerke_20260225.xml
│
├── symbols/
│   └── cisco/                        # Cisco-Standard-Symbole als SVG
│       ├── router.svg                # Cisco Router  (viewBox 0 0 60 41)
│       ├── switch.svg                # Cisco L2-Switch (viewBox 0 0 77 39)
│       └── pc.svg                    # Cisco PC/Workstation (viewBox 0 0 59 53)
│
├── template-alle-fragetypen-mit-svg.xml   # Strukturvorlage für neue Fragendateien
├── copilot-instructions.md               # Agent-Regeln (Workspace-Root)
├── .github/copilot-instructions.md       # Agent-Regeln (GitHub-Standard-Pfad)
└── moodle-xml-svg-fragen.instructions.md # Detaillierte Technische Referenz
```

---

## Enthaltene Fragendateien

| Datei | Thema | Zielgruppe | Fragen | Fragetypen |
|---|---|---|---|---|
| `quiz_aggregation_komposition_20260223.xml` | Aggregation & Komposition (OOP) | FI Anwendungsentwicklung | 5 | ddmatch, ddwtos, multichoice, cloze |
| `quiz_aggregation_komposition_20260304.xml` | Aggregation & Komposition (OOP) | FI Anwendungsentwicklung | 5 | ddmatch, ddwtos, multichoice, cloze, multichoice |
| `quiz_coderunner_java_oop_20260304.xml` | Objektorientierung in Java | FI Anwendungsentwicklung | 5 | coderunner |
| `quiz_coderunner_java_vererbung_20260304.xml` | OO Programmierung in Java (Schwerpunkt Vererbung) | FI Anwendungsentwicklung | 5 | coderunner |
| `quiz_vlan_systemintegration_20260223.xml` | VLANs & IEEE 802.1Q | FI Systemintegration | 5 | ddmatch, ddwtos, multichoice, cloze |
| `quiz_nm_beziehungen_20260224.xml` | N:M-Beziehungen (relationale DB) | FI Anwendungsentwicklung | 5 | ddmatch, multichoice, ddwtos, cloze |
| `quiz_troubleshooting_ip_netzwerke_20260225.xml` | Troubleshooting IP-Netzwerke | FI Systemintegration | 5 | ddmatch, multichoice, cloze, ddwtos |

---

## Fragetypen

| Typ | Beschreibung |
|---|---|
| `ddmatch` | Drag-and-drop Zuordnung (Begriff → Erklärung/Symbol) |
| `ddwtos` | Drag-and-drop in Lückentext (`[[1]]`, `[[2]]`, …) |
| `multichoice` | Multiple Choice, Einzel- oder Mehrfachauswahl |
| `cloze` | Eingebettete Fragen im Lückentext (`{n:MULTICHOICE:…}`) |
| `coderunner` | Programmieraufgabe mit automatischen Testfällen (z. B. Java) |

---

## SVG-Diagramme

SVG-Grafiken werden **inline im CDATA-Fragetext** eingebettet. Alle `<text>`-Elemente mit HTML-Inhalt müssen in `<![CDATA[...]]>` gewrappt sein.

### Netzwerktopologien – Cisco-Symbole

Bei Netzwerktopologie-Darstellungen werden **ausschließlich** die Symbole aus `symbols/cisco/` verwendet:

| Symbol | Datei | viewBox |
|---|---|---|
| Cisco Router | `symbols/cisco/router.svg` | `0 0 60 41` |
| Cisco L2-Switch | `symbols/cisco/switch.svg` | `0 0 77 39` |
| Cisco PC/Workstation | `symbols/cisco/pc.svg` | `0 0 59 53` |

Die Symbole werden als `<symbol id="...">` in den `<defs>`-Block des jeweiligen Fragen-SVG übernommen und per `<use href="#...">` referenziert. Pro Diagramm erhalten die IDs einen eindeutigen Suffix (z. B. `rtr1`, `sw2`, `pc3`), um Kollisionen bei mehreren SVGs im selben HTML-Dokument zu vermeiden.

---

## Import in Moodle

1. Moodle aufrufen → Kurs → **Fragensammlung** → **Fragen importieren**
2. Format: **Moodle XML**
3. Gewünschte XML-Datei aus `res/` hochladen

---

## Neue Fragendateien generieren

Der Copilot-Agent erstellt neue Fragendateien auf Anfrage. Benötigte Parameter:

- **Thema** (z. B. „OSI-Modell", „Python OOP")
- **Zielgruppe** (z. B. „FI Systemintegration", „Klasse 10")
- **Schwierigkeitsgrad** (leicht / mittel / schwer)
- **Anzahl Fragen**
- **Fragetypen** (optional; Standard: Mix aus allen Typen)

Die erzeugte Datei wird automatisch unter `res/quiz_<thema>_<datum>.xml` gespeichert.

### XML-Validierung

```powershell
python -c "import xml.etree.ElementTree as ET; ET.parse(r'res\DATEI.xml'); print('XML valid')"
```

---

## Weiterführende Dokumentation

- [moodle-xml-svg-fragen.instructions.md](moodle-xml-svg-fragen.instructions.md) – Technische Referenz: CDATA-Regeln, SVG-Bausteine, Fragetyp-Besonderheiten, Fehlerübersicht
- [copilot-instructions.md](copilot-instructions.md) – Agent-Workflow und Qualitätsanforderungen
