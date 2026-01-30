# Contributing to Terrible Cards

Thanks for wanting to contribute! Please follow these guidelines to keep the project healthy and reviewable.

- Fork the repository and create a branch named `feat/your-feature` or `fix/your-bug`.
- Keep changes small and focused; open one PR per logical change.
- Run tests locally before opening a PR:

```bash
bun install
bun run test
```

- Format code and run linters if present.
- Add tests for bug fixes and new features. Place unit tests next to implementation files.
- For changes that affect runtime behavior or configuration, update `README.md` and `.env.example`.

PR Process

- Open a Pull Request against `main` with a clear description and screenshots if applicable.
- Tag a reviewer and respond to feedback promptly.

Security

- Do not commit secrets or `.env` files. If you discover a security issue, open a private issue and notify maintainers.

Thank you — we appreciate your help!
