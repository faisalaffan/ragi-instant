
from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from pydantic import BaseModel
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.retrieval.generator import AnswerResponse
from app.retrieval.pipeline import QueryPipeline

router = APIRouter(prefix="/query", tags=["query"])


class QueryRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    compress: bool = Field(default=False, description="Aktifkan context compression")


@router.post("", response_model=AnswerResponse)
async def ask(
    body: QueryRequest,
    db: AsyncSession = Depends(get_db),
) -> AnswerResponse:
    pipeline = QueryPipeline(db)
    try:
        return await pipeline.query(body.question, compress=body.compress)
    except Exception as e:
        raise HTTPException(500, f"Query failed: {e}")
