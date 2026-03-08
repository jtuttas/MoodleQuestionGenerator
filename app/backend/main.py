from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import os
import re

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from openai import AsyncOpenAI
from pydantic import BaseModel, field_validator
from sqlalchemy import DateTime, Integer, String, Text, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

load_dotenv()

# ── Database ──────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./questions.db")
engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class QuestionRecord(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    question_type: Mapped[str] = mapped_column(String(50))
    difficulty: Mapped[str] = mapped_column(String(20))
    model_source: Mapped[str] = mapped_column(String(20))
    model_name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text)
    xml_output: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


# ── Lifespan (DB init) ────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="Moodle Fragen Generator API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500", "null"],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)


# ── DB dependency ─────────────────────────────────────────────
async def get_db() -> AsyncSession:  # type: ignore[return]
    async with SessionLocal() as session:
        yield session

QUESTION_TYPE_HINTS: dict[str, str] = {
    "multichoice": (
        "Mehrfachauswahl-Frage. fraction='100' für die richtige Antwort, "
        "negative fractions für falsche. Kein Antwortext darf mit +, -, ~ beginnen."
    ),
    "cloze": (
        "Lückentext mit eingebetteter Syntax im Fragetext, "
        "z.B. {1:MULTICHOICE:Option1~=Richtig~Option2}. "
        "Kein separates <answer>-Element nötig."
    ),
    "ddwtos": (
        "Drag-and-drop in Text: Lücken [[1]], [[2]] im Fragetext, "
        "dazu <dragbox>-Einträge mit <group>n</group>. "
        "Jede Gruppe braucht mindestens einen Distractor."
    ),
    "ddmatch": "Zuordnungsfrage mit <subquestion>/<answer>-Paaren.",
    "numerical": (
        "Numerische Antwort: "
        "<answer fraction='100'><text>42</text><tolerance>0.1</tolerance></answer>"
    ),
    "shortanswer": "Kurzantwort: <answer fraction='100'><text>Antwort</text></answer>",
    "coderunner": (
        "CodeRunner java_class. Enthält <template> in Python3, "
        "das Hintergrundklasse, Studentencode und Testfall kompiliert und ausführt."
    ),
}

ALLOWED_QUESTION_TYPES = set(QUESTION_TYPE_HINTS.keys())
ALLOWED_DIFFICULTIES = {"leicht", "mittel", "schwer"}


class GenerateRequest(BaseModel):
    description: str
    question_type: str
    difficulty: str
    model_source: str
    model_name: str

    @field_validator("description")
    @classmethod
    def description_not_empty(cls, v: str) -> str:
        text = v.strip()
        if not text:
            raise ValueError("Aufgabenbeschreibung darf nicht leer sein.")
        if len(text) < 10:
            raise ValueError("Aufgabenbeschreibung muss mindestens 10 Zeichen haben.")
        return text

    @field_validator("model_source")
    @classmethod
    def valid_model_source(cls, v: str) -> str:
        if v not in ("openai", "ollama"):
            raise ValueError(f"Unbekannte Modellquelle: {v}")
        return v

    @field_validator("question_type")
    @classmethod
    def valid_question_type(cls, v: str) -> str:
        if v not in ALLOWED_QUESTION_TYPES:
            raise ValueError(f"Unbekannter Fragetyp: {v}")
        return v

    @field_validator("difficulty")
    @classmethod
    def valid_difficulty(cls, v: str) -> str:
        if v not in ALLOWED_DIFFICULTIES:
            raise ValueError(f"Ungueltiger Schwierigkeitsgrad: {v}")
        return v

    @field_validator("model_name")
    @classmethod
    def model_name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Modellname darf nicht leer sein.")
        return v.strip()


def sanitize_xml(raw: str) -> str:
    """Strip markdown code fences and surrounding whitespace from LLM output."""
    import re
    # Remove ```xml ... ``` or ``` ... ``` wrappers (possibly with language tag)
    text = re.sub(r"^```[\w]*\s*", "", raw.strip(), flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text.strip())
    # If the model still prepended explanation text before <?xml, extract from first XML tag
    xml_start = text.find("<?xml")
    if xml_start == -1:
        xml_start = text.find("<quiz")
    if xml_start > 0:
        text = text[xml_start:]
    return text.strip()


def build_prompt(req: GenerateRequest) -> str:
    hint = QUESTION_TYPE_HINTS.get(req.question_type, "")
    hint_line = f"Hinweis zum Fragetyp: {hint}\n" if hint else ""
    return (
        "Du bist ein Experte für Moodle-Prüfungsfragen (Moodle 4.x).\n"
        "Erstelle genau eine Moodle-Frage im XML-Format.\n\n"
        f"Fragetyp: {req.question_type}\n"
        f"{hint_line}"
        f"Schwierigkeit: {req.difficulty}\n"
        f"Aufgabenbeschreibung: {req.description}\n\n"
        "Pflichtregeln:\n"
        "- Gib ausschließlich valides Moodle-XML zurück – kein Markdown, keine Erklärungen.\n"
        "- Beginne direkt mit: <?xml version=\"1.0\" encoding=\"UTF-8\"?><quiz>\n"
        "- Alle <text>-Elemente mit HTML müssen in CDATA stehen: "
        "<text><![CDATA[...]]></text>\n"
        "- Wähle einen prägnanten deutschen Fragenamen für <name><text>.\n"
        "- Füge sinnvolles <generalfeedback> hinzu.\n"
    )


def sanitize_generated_xml(raw_output: str) -> str:
    """Normalize model output to plain Moodle XML without markdown wrappers."""
    text = raw_output.strip()

    # Prefer first fenced code block content when present.
    fenced_match = re.search(r"```(?:xml)?\s*(.*?)```", text, re.IGNORECASE | re.DOTALL)
    if fenced_match:
        text = fenced_match.group(1).strip()

    # Extract XML/quiz payload from any surrounding explanation text.
    start_xml = text.find("<?xml")
    start_quiz = text.find("<quiz")
    start_positions = [pos for pos in (start_xml, start_quiz) if pos >= 0]
    if start_positions:
        start = min(start_positions)
        end_quiz = text.rfind("</quiz>")
        if end_quiz >= 0:
            text = text[start : end_quiz + len("</quiz>")]
        else:
            text = text[start:]

    text = text.strip()

    # Ensure XML declaration exists when model starts directly with <quiz>.
    if text.startswith("<quiz"):
        text = '<?xml version="1.0" encoding="UTF-8"?>\n' + text

    return text


# ── Routes ────────────────────────────────────────────────────
@app.post("/generate")
async def generate(req: GenerateRequest, db: AsyncSession = Depends(get_db)) -> dict:
    prompt = build_prompt(req)
    if req.model_source == "openai":
        xml = sanitize_xml(await call_openai(prompt, req.model_name))
    else:
        xml = sanitize_xml(await call_ollama(prompt, req.model_name))
    xml = sanitize_generated_xml(xml)

    record = QuestionRecord(
        question_type=req.question_type,
        difficulty=req.difficulty,
        model_source=req.model_source,
        model_name=req.model_name,
        description=req.description,
        xml_output=xml,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return {"xml": xml, "id": record.id}


@app.get("/questions")
async def list_questions(
    question_type: str | None = None,
    difficulty: str | None = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    stmt = select(QuestionRecord).order_by(QuestionRecord.created_at.desc()).limit(limit)
    if question_type:
        stmt = stmt.where(QuestionRecord.question_type == question_type)
    if difficulty:
        stmt = stmt.where(QuestionRecord.difficulty == difficulty)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "question_type": r.question_type,
            "difficulty": r.difficulty,
            "model_source": r.model_source,
            "model_name": r.model_name,
            "description": r.description,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@app.get("/questions/{question_id}")
async def get_question(question_id: int, db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(
        select(QuestionRecord).where(QuestionRecord.id == question_id)
    )
    record = result.scalar_one_or_none()
    if record is None:
        raise HTTPException(status_code=404, detail="Frage nicht gefunden.")
    return {
        "id": record.id,
        "question_type": record.question_type,
        "difficulty": record.difficulty,
        "model_source": record.model_source,
        "model_name": record.model_name,
        "description": record.description,
        "xml_output": record.xml_output,
        "created_at": record.created_at.isoformat(),
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/openai/status")
async def openai_status() -> dict:
    """Checks whether an OpenAI API key is configured and valid."""
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return {"configured": False, "valid": False,
                "error": "Kein API-Key konfiguriert. Bitte OPENAI_API_KEY in .env setzen."}
    try:
        client = AsyncOpenAI(api_key=api_key)
        await client.models.list()
        return {"configured": True, "valid": True, "error": None}
    except Exception as exc:
        msg = str(exc)
        if "401" in msg or "authentication" in msg.lower() or "api_key" in msg.lower() or "api key" in msg.lower():
            return {"configured": True, "valid": False,
                    "error": "API-Key ungültig oder abgelaufen."}
        return {"configured": True, "valid": False,
                "error": f"Verbindungsfehler: {msg[:150]}"}


_OPENAI_EXCLUDE = ("instruct", "tts", "whisper", "dall-e", "embed",
                   "realtime", "audio", "babbage", "davinci", "ada", "curie")


@app.get("/openai/models")
async def openai_models_endpoint() -> dict:
    """Returns available OpenAI chat-capable models."""
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=503,
                            detail="Kein OPENAI_API_KEY konfiguriert.")
    try:
        client = AsyncOpenAI(api_key=api_key)
        response = await client.models.list()
        chat_models = sorted(
            [
                m.id for m in response.data
                if m.id.startswith(("gpt-", "o1", "o3", "o4"))
                and not any(x in m.id for x in _OPENAI_EXCLUDE)
            ],
            reverse=True,
        )
        return {"models": chat_models}
    except Exception as exc:
        msg = str(exc)
        if "401" in msg or "authentication" in msg.lower():
            raise HTTPException(status_code=401,
                                detail="API-Key ungültig oder abgelaufen.")
        raise HTTPException(status_code=502, detail=f"OpenAI-Fehler: {msg[:150]}")


@app.get("/ollama/models")
async def ollama_models() -> dict:
    """Returns the list of locally installed Ollama models."""
    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{ollama_url}/api/tags")
            resp.raise_for_status()
            data = resp.json()
            names = [m["name"] for m in data.get("models", [])]
            return {"models": names}
    except httpx.ConnectError:
        raise HTTPException(
            status_code=502,
            detail=f"Ollama nicht erreichbar unter {ollama_url}.",
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Ollama-Fehler: {exc}")


# ── LLM calls ─────────────────────────────────────────────────
async def call_ollama(prompt: str, model: str) -> str:
    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{ollama_url}/api/generate",
                json={"model": model or "llama3", "prompt": prompt, "stream": False},
            )
            response.raise_for_status()
            return response.json()["response"].strip()
    except httpx.ConnectError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Ollama nicht erreichbar unter {ollama_url}. Läuft der lokale Dienst?",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Ollama-Fehler: {exc}") from exc


async def call_openai(prompt: str, model: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY nicht konfiguriert. Bitte .env-Datei anlegen.",
        )
    client = AsyncOpenAI(api_key=api_key)
    try:
        response = await client.chat.completions.create(
            model=model or "gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"OpenAI-Fehler: {exc}") from exc


# ── Static files (Frontend) – mount last so API routes take precedence ──
_frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.isdir(_frontend_dir):
    app.mount("/", StaticFiles(directory=_frontend_dir, html=True), name="static")
