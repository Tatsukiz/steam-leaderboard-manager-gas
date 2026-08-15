# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Because the script is installed by copy-pasting into Apps Script, the version is
recorded in the header comment of `steam_lb_gas.js` so you can tell which
version a given spreadsheet is running.

## [Unreleased]

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
