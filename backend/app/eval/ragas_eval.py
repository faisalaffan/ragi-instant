"""
Compute RAGAS metrics from eval results.

Requires: pip install ragas datasets pandas

Usage (after running evaluate.py):
    python -m app.eval.ragas_eval --results app/eval/results.json
"""
import argparse
import json
from pathlib import Path


def compute_metrics(results_path: Path) -> None:
    with open(results_path) as f:
        results = json.load(f)

    valid = [r for r in results if not r["error"]]
    if not valid:
        print("No valid results to evaluate.")
        return

    print(f"Computing metrics for {len(valid)} questions...\n")

    try:
        from datasets import Dataset
        from ragas import evaluate
        from ragas.metrics import answer_relevancy
        from ragas.metrics import context_precision
        from ragas.metrics import faithfulness

        dataset_dict = {
            "question": [r["question"] for r in valid],
            "answer": [r["answer"] for r in valid],
            "contexts": [
                [c.get("quote", "") for c in r.get("citations", [])]
                for r in valid
            ],
            "ground_truth": [r["ground_truth"] for r in valid],
        }

        dataset = Dataset.from_dict(dataset_dict)

        score = evaluate(
            dataset,
            metrics=[faithfulness, answer_relevancy, context_precision],
        )

        print("RAGAS Metrics:")
        print(f"  Faithfulness:       {score.get('faithfulness', 0):.3f}")
        print(f"  Answer Relevancy:   {score.get('answer_relevancy', 0):.3f}")
        print(f"  Context Precision:  {score.get('context_precision', 0):.3f}")

        print("\nTarget per PRD:")
        print(f"  Faithfulness > 0.85: {'PASS' if score.get('faithfulness', 0) > 0.85 else 'BELOW TARGET'}")
        print(f"  Answer Relevancy > 0.80: {'PASS' if score.get('answer_relevancy', 0) > 0.80 else 'BELOW TARGET'}")

        table_path = results_path.parent / "ragas_results.json"
        with open(table_path, "w") as f:
            json.dump(score, f, indent=2, default=str)
        print(f"\nSaved to {table_path}")

    except ImportError:
        print("Install ragas dan datasets dulu: pip install ragas datasets pandas")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--results", required=True, help="Path to eval results JSON")
    args = parser.parse_args()
    compute_metrics(Path(args.results))


if __name__ == "__main__":
    main()
