# Contributing

Thank you for your interest in contributing! Here's how you can help.

## Reporting Issues

- Use [GitHub Issues](../../issues) to report bugs or request features
- Include the error message and steps to reproduce if reporting a bug
- **Never include your Publisher API Key, App ID, or real SteamID64 values** — redact them
- For security vulnerabilities, do not open a public issue. Follow [SECURITY.md](SECURITY.md)

## Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-change`)
3. Make your changes
4. Submit a Pull Request with a clear description

## Code Guidelines

- **Single file** — `steam_lb_gas.js` must remain a single file. Users install it by copy-pasting into Apps Script, so splitting into multiple files would break the workflow.
- **Match the existing ES5 style** — the codebase uses `var` and function expressions throughout. Keep new code consistent with it rather than introducing `let`, `const`, or arrow functions in the middle of ES5 code.
- **Translations** — When adding or modifying UI strings, update both `en` and `ja` entries in the `STRINGS_` object. New language contributions are welcome — add a new language key to `STRINGS_` and update the `toggleLanguage` function.
- **Documentation** — Behavior changes need updates to both `README.md` and `README.ja.md`, plus an entry under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md).

## Testing Your Changes

There is no automated test suite. Verify manually:

1. Paste the modified `steam_lb_gas.js` into a fresh Google Spreadsheet's Apps Script editor
2. Reload the sheet and run the menu items your change touches, in both English and Japanese
3. Use a test leaderboard — not a live one — for anything that deletes or registers entries

## Screenshots

Screenshots are welcome, but they capture real data. Before submitting one, **redact or replace
every SteamID64, App ID, leaderboard name, and spreadsheet URL** with dummy values. SteamID64
values identify real player accounts. Place images in `docs/screenshots/`.

## Adding a New Language

1. Add a new key to `STRINGS_` (e.g., `ko`, `zh`, `de`)
2. Translate all string values
3. Update `toggleLanguage()` to cycle through the available languages
4. Update `menuLanguage` strings to reflect the new cycle
5. Submit a PR

## Questions?

Open an issue — we're happy to help!
