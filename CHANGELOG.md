# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Because the script is installed by copy-pasting into Apps Script, the version is
recorded in the header comment of `steam_lb_gas.js` so you can tell which
version a given spreadsheet is running.

## [Unreleased]

## [1.0.1] - 2026-08-15

### Fixed

- "Delete Checked Rows" and "Bulk Register from Sheet" reported the sheet as
  missing after switching the UI language. Both looked the sheet up by its
  current-language name only, while the sheet still carried the name from the
  previous language. Sheet lookup now goes through `findSheet_`, which renames a
  sheet left over from another language, matching what "Get Entries" already did.
- Timestamps written to the Memo and Result columns used the runtime's default
  locale. They now follow the UI language (`en-US` / `ja-JP`).
- A `$` in a substituted value (for example a leaderboard name containing `$&`)
  was interpreted as a replacement pattern and corrupted the text of dialogs,
  including the delete confirmation. Placeholder substitution is now a single
  pass with a replacer function, so values are always inserted literally.

## [1.0.0] - 2026-08-15

Initial public release.

### Added

- List leaderboards for a game (ID, name, entry count, display name)
- Fetch leaderboard entries with rank, score, SteamID64, and profile URL
- Delete entries by checkbox, with a confirmation dialog listing every target
- Register a single entry with KeepBest or ForceUpdate (`!` prefix) scoring
- Bulk register entries from a spreadsheet (KeepBest only)
- Bilingual UI (English / Japanese), switchable from the menu
- Credentials stored in Script Properties instead of sheet cells
