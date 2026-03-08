"""
Import all questions from res/ into questions.db.
Deletes all existing rows first.
Run from: app/backend/
  python import_res.py
"""
import sqlite3
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).parent / "questions.db"
RES_DIR = Path(__file__).parent.parent.parent / "res"

# Map XML question types to canonical names stored in DB
QTYPE_MAP = {
    "multiplechoice": "multichoice",
    "multiple_choice": "multichoice",
    "truefalse": "truefalse",
    "matching": "ddmatch",
    "numerical": "numerical",
    "shortanswer": "shortanswer",
    "essay": "essay",
    "cloze": "cloze",
    "ddwtos": "ddwtos",
    "ddmatch": "ddmatch",
    "ddimageortext": "ddimageortext",
    "gapselect": "gapselect",
    "ordering": "ordering",
    "coderunner": "coderunner",
    "multichoice": "multichoice",
}

SKIP_TYPES = {"category"}


def get_qname(question_el: ET.Element) -> str:
    name_el = question_el.find("./name/text")
    if name_el is not None and name_el.text:
        return name_el.text.strip()
    return "(kein Name)"


def question_to_xml_string(question_el: ET.Element) -> str:
    """Wrap a single <question> element into a full Moodle XML document."""
    # Serialise the element – CDATA sections come back as plain text in ET,
    # that is fine for our purposes (the frontend just renders the content).
    body = ET.tostring(question_el, encoding="unicode")
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        "<quiz>\n"
        f"{body}\n"
        "</quiz>"
    )


def main() -> None:
    if not DB_PATH.exists():
        print(f"FEHLER: Datenbank nicht gefunden: {DB_PATH}")
        print("Bitte Backend mindestens einmal starten, damit die DB angelegt wird.")
        return

    xml_files = sorted(RES_DIR.glob("*.xml"))
    if not xml_files:
        print(f"Keine XML-Dateien in {RES_DIR}")
        return

    now = datetime.now(timezone.utc).isoformat()

    with sqlite3.connect(DB_PATH) as con:
        cur = con.cursor()

        # --- Alles löschen ---
        cur.execute("DELETE FROM questions")
        deleted = cur.rowcount
        print(f"Gelöscht: {deleted} vorhandene Einträge")

        imported = 0
        skipped = 0

        for xml_path in xml_files:
            try:
                tree = ET.parse(xml_path)
            except ET.ParseError as e:
                print(f"  PARSE-FEHLER {xml_path.name}: {e}")
                continue

            root = tree.getroot()
            questions = root.findall("question")
            if not questions:
                # Some files have <quiz><question ...>
                questions = root.findall(".//question")

            for q in questions:
                qtype_raw = (q.get("type") or "").lower()
                if qtype_raw in SKIP_TYPES:
                    skipped += 1
                    continue

                qtype = QTYPE_MAP.get(qtype_raw, qtype_raw) or "unknown"
                qname = get_qname(q)
                xml_str = question_to_xml_string(q)

                cur.execute(
                    """
                    INSERT INTO questions
                        (question_type, difficulty, model_source, model_name,
                         description, xml_output, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        qtype,
                        "mittel",       # Schwierigkeitsgrad unbekannt → Default
                        "manual",       # Kennzeichnung: manuell importiert
                        "res-import",   # Modellname
                        qname,
                        xml_str,
                        now,
                    ),
                )
                imported += 1
                print(f"  + [{qtype:15s}] {qname[:60]}")

        con.commit()

    print(f"\nFertig: {imported} Fragen importiert, {skipped} Einträge übersprungen.")


if __name__ == "__main__":
    main()
