# Contributing

Thanks for your interest in contributing to Ragi-Instant.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone git@github.com:YOUR_USERNAME/ragi-instant.git`
3. Create a branch: `git checkout -b feat/your-feature`
4. Make your changes
5. Push and open a pull request

## Development Setup

```bash
# Python
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

# Run tests
pytest
```

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation
- `refactor:` — code restructuring
- `test:` — tests
- `chore:` — build, CI, dependencies

## Pull Request Guidelines

- Keep PRs focused — one change per PR
- Update docs if your change affects user-facing behavior
- Add tests for new functionality
- Ensure CI passes before requesting review

## Code Style

- Follow PEP 8 for Python
- Use `ruff` for linting and formatting
- Type hints required for public API

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
