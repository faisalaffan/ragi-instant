import asyncio
import logging


from app.config import settings
from app.llm_client import get_openai_client
from app.retrieval.searcher import SearchResult

logger = logging.getLogger(__name__)

COMPRESSION_PROMPT = """Ringkas konteks berikut tanpa menghilangkan informasi faktual yang penting untuk menjawab pertanyaan tentang regulasi keuangan.

Aturan:
- Pertahankan SEMUA angka, persentase, tanggal, nomor pasal, dan nama regulasi
- Pertahankan SEMUA definisi istilah
- Jika ada tabel atau daftar, pertahankan strukturnya
- Hapus kalimat transisi dan pengulangan
- Target: kurangi panjang teks 40-60% tanpa kehilangan fakta

Pertanyaan yang akan dijawab: {query}

Konteks asli:
{context}

Konteks yang diringkas:"""


async def compress_context(
    query: str, results: list[SearchResult]
) -> list[SearchResult]:
    """
    Kompresi konten chunk sebelum dikirim ke LLM generation.
    Mengurangi token count sambil mempertahankan fakta numerik dan legal.
    """
    if not results or len(results) <= 2:
        return results

    context_parts: list[str] = []
    for i, r in enumerate(results):
        context_parts.append(f"[{i}] {r.content}")

    full_context = "\n\n---\n\n".join(context_parts)
    input_chars = len(full_context)

    if input_chars < 2000:
        logger.info("Context too short for compression (%d chars), skipping", input_chars)
        return results

    try:
        client = get_openai_client()

        response = await asyncio.to_thread(
            lambda: client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{
                    "role": "user",
                    "content": COMPRESSION_PROMPT.format(
                        query=query, context=full_context
                    ),
                }],
                temperature=0.1,
                max_tokens=2000,
            )
        )

        compressed_text = response.choices[0].message.content.strip()
        output_chars = len(compressed_text)
        reduction = round((1 - output_chars / input_chars) * 100)

        logger.info(
            "Context compressed: %d → %d chars (%d%% reduction)",
            input_chars, output_chars, reduction,
        )

        compressed_result = SearchResult(
            chunk_id="compressed",
            content=compressed_text,
            score=max(r.score for r in results),
            document_title=", ".join(
                set(r.document_title for r in results if r.document_title)
            ),
            section=None,
            page=None,
            meta={"compressed": True, "source_count": len(results)},
        )

        return [compressed_result]

    except Exception:
        logger.exception("Context compression failed, returning original")
        return results
