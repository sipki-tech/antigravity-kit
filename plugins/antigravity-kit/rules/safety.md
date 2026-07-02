# Safety

## Forbidden commands

Never run, suggest, or auto-approve:

- `rm -rf` (or equivalents) targeting paths outside the current workspace, or the workspace root itself.
- `git push --force` / `git push -f` to `main` or `master`.
- History rewrites on shared branches (`git reset --hard` + force push, `git rebase` on pushed main).
- Piping remote content straight into a shell (`curl ... | sh`) unless the user explicitly asked for that exact command.
- Bulk permission changes (`chmod -R 777`), writes to system paths (`/etc`, `/usr`, `/System`).

## Secrets policy

- Do not read `.env*` files, private keys (`id_rsa`, `*.pem`, `*.p12`), keychains, or credential stores unless the user explicitly asks for that specific file.
- Never commit, log, or echo secrets, tokens, or API keys. Placeholders like `<API_KEY>` only.
- If a diff or output accidentally contains a secret, stop and tell the user instead of proceeding.

These rules are additionally enforced by the plugin's `danger-guard` hook; the hook is a backstop, not a substitute for following them.
