"""
RAGAS evaluation script.

Usage:
    python -m app.eval.evaluate --dataset app/eval/dataset.json

Requires RAGAS and datasets installed.
"""
import argparse
import asyncio
import json
from pathlib import Path

from app.db import async_session
from app.db import init_db
from app.retrieval.pipeline import QueryPipeline


async def run_eval(dataset_path: Path) -> None:
    with open(dataset_path) as f:
        dataset = json.load(f)

    print(f"Evaluating {len(dataset)} questions...\n")

    results = []
    async with async_session() as db:
        pipeline = QueryPipeline(db)
        for i, item in enumerate(dataset):
            question = item["question"]
            ground_truth = item["ground_truth"]

            print(f"[{i+1}/{len(dataset)}] {question}")
            print(f"    Ground truth: {ground_truth[:100]}...")

            try:
                response = await pipeline.query(question)
            except Exception as e:
                print(f"    ERROR: {e}")
                results.append({
                    "question": question,
                    "ground_truth": ground_truth,
                    "answer": str(e),
                    "error": True,
                })
                continue

            print(f"    Confidence: {response.confidence}")
            print(f"    Citations: {len(response.citations)}")
            print(f"    Answer: {response.answer[:120]}...")
            print()

            results.append({
                "question": question,
                "ground_truth": ground_truth,
                "answer": response.answer,
                "confidence": response.confidence,
                "citations": [
                    {"title": c.document_title, "quote": c.quote}
                    for c in response.citations
                ],
                "error": False,
            })

    output_path = dataset_path.parent / "results.json"
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False, default=str)

    avg_confidence = sum(
        r["confidence"] for r in results if not r["error"]
    ) / max(1, sum(1 for r in results if not r["error"]))

    errors = sum(1 for r in results if r["error"])

    print(f"Results saved to {output_path}")
    print(f"Total: {len(results)}, Errors: {errors}")
    print(f"Avg confidence: {avg_confidence:.2f}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", required=True, help="Path to eval dataset JSON")
    args = parser.parse_args()

    asyncio.run(init_db())
    asyncio.run(run_eval(Path(args.dataset)))


if __name__ == "__main__":
    main()
