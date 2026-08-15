# Steam Leaderboard Manager for Google Apps Script

> **[日本語版 README はこちら](README.ja.md)**

Manage Steam leaderboard entries directly from a Google Spreadsheet — no command-line tools required.

Built for game developers and QA teams who need to view rankings, remove fraudulent scores, and register entries without navigating Steamworks' limited admin UI.

## Why This Tool?

The Steamworks partner site lacks convenient leaderboard management features:

- **No bulk delete** — removing cheater scores one by one is tedious
- **No spreadsheet view** — hard to review and compare entries at a glance
- **No batch registration** — adding test entries or corrections requires API calls

This tool brings all of that into a familiar Google Sheets interface with checkbox-based deletion, bulk registration, and clickable Steam profile links.

## Features

- **List leaderboards** — view all leaderboards for your game (ID, name, entry count)
- **View entries** — fetch rankings with scores, SteamID64, and profile URLs
- **Delete entries** — check rows to delete and execute in one step (with confirmation)
- **Register entries** — add a single entry with KeepBest or ForceUpdate mode
- **Bulk register** — register multiple entries from a spreadsheet
- **Bilingual UI** — switch between English and Japanese from the menu

## Quick Start

1. **Create** a new Google Spreadsheet
2. **Open** Extensions > Apps Script, **delete the default `myFunction` stub**, paste the entire contents of [`steam_lb_gas.js`](steam_lb_gas.js), and save
3. **Reload** the spreadsheet — a **"Steam Leaderboard"** menu appears in the menu bar
4. **Run** Steam Leaderboard > **Setup (API Key / App ID)** and enter your credentials

On first run, Google will ask you to authorize the script. The required permissions are:
- Edit spreadsheets
- Connect to external services (Steam API)

> [`appsscript.json`](appsscript.json) in this repository declares those OAuth scopes explicitly.
> You do **not** need it for the copy-paste install above — it is there for transparency and for
> anyone deploying with [clasp](https://github.com/google/clasp).

## Prerequisites

- A **Steam Publisher API Key** — available from the [Steamworks partner site](https://partner.steamgames.com/)
- Your game's **App ID** — the number in your Steamworks dashboard URL (e.g. `https://partner.steamgames.com/apps/landing/1234567` → `1234567`)

## Security

> **Warning**
>
> The Publisher API Key is stored in Apps Script's Script Properties. **Anyone with editor access to the spreadsheet can view the key** via Extensions > Apps Script > Project Settings.
>
> - **Never** share the spreadsheet with "Anyone with the link"
> - Only grant editor access to trusted team members
> - If the key is compromised, regenerate it immediately on the Steamworks partner site
> - The Publisher API Key can read, write, and delete leaderboard entries for your game

## Usage

### View Leaderboards

Menu: **Steam Leaderboard > Get Leaderboard List**

Displays all leaderboards in a "Leaderboards" sheet with ID, name, entry count, and display name.

### View & Delete Entries

1. Menu: **Steam Leaderboard > Get Entries** — enter the leaderboard name and number of entries to fetch
2. Check the **"Delete"** column for rows you want to remove
3. Menu: **Steam Leaderboard > Delete Checked Rows** — review the confirmation dialog and proceed

Deleted rows are grayed out with strikethrough text and a timestamp in the Memo column.

### Register a Single Entry

Menu: **Steam Leaderboard > Register Entry (Single)**

Follow the prompts to enter leaderboard name, SteamID64, and score. Prefix the score with `!` to force overwrite (ForceUpdate) instead of the default KeepBest behavior.

### Bulk Register Entries

1. Menu: **Steam Leaderboard > Prepare Registration Sheet** — creates the "Register Entries" sheet
2. Enter the leaderboard name in cell B1
3. Fill in SteamID64 (column A) and Score (column B) from row 3
4. Menu: **Steam Leaderboard > Bulk Register from Sheet**

All bulk registrations use KeepBest mode. For forced overwrites, use the single registration feature.

### Switch Language

Menu: **Steam Leaderboard > Language: English → 日本語**

Toggles the UI between English and Japanese. Reload the spreadsheet after switching to update sheet names.

## Updating the Code

To upgrade a spreadsheet that is already in use:

1. Open Extensions > Apps Script
2. Select all of the existing code and delete it
3. Paste the latest [`steam_lb_gas.js`](steam_lb_gas.js)
4. Save, then reload the spreadsheet

Your API Key, App ID, and language setting live in Script Properties, so they survive the
replacement — there is no need to re-run Setup.

## Important Notes

- **Do not edit or delete row 1 of the "Entries" sheet.** It holds the leaderboard name and ID
  that "Delete Checked Rows" reads to know what to delete. The same applies to **cell B1 of the
  "Register Entries" sheet**, which bulk registration reads.
- **Deletion is irreversible**, and it only removes the entry from the leaderboard. If the same
  user submits a score again, it comes back. Repeat offenders need a root-cause fix — stronger
  client-side validation, or configuring the leaderboard as a Trusted leaderboard so that only
  your server can write to it.
- **Whether a score is "better" depends on the leaderboard's sort order.** For a time attack
  leaderboard sorted ascending, a lower score is better. KeepBest follows that setting, so a
  score you consider higher may be silently skipped.
- **If no entry exists for a SteamID64, both KeepBest and ForceUpdate create a new one.**
- **SteamID64 is a 17-digit number.** Cells must be formatted as "Plain text" — pasted into a
  "Number" cell, the trailing digits get rounded and you end up targeting a different account.
  "Prepare Registration Sheet" sets that format for you.
- The sheet is a **snapshot** taken when you ran "Get Entries". Rankings do not update on their
  own; run it again to refresh.

## Troubleshooting

| Symptom | Cause & Fix |
|---|---|
| "Steam Leaderboard" menu doesn't appear | Reload the spreadsheet. If still missing, check that the code is saved in Apps Script |
| "API Key / App ID not configured" error | Run "Setup" from the menu and enter your credentials |
| "API key is invalid (403)" error | Wrong key type. Make sure you're using a **Publisher** API key, not a regular Web API key |
| Entries appear empty | Leaderboard name typo (must match exactly). Or the leaderboard truly has 0 entries |
| Rankings don't update after deletion | The sheet shows a snapshot. Run "Get Entries" again to refresh |
| Score not updated after registration | KeepBest mode skips scores worse than the current one. Use `!` prefix for ForceUpdate |
| SteamID64 digits are rounded in cells | Cell format is "Number" instead of "Plain text". Re-run "Prepare Registration Sheet" or manually set the column format |
| "Unsafe page" warning during authorization | Normal for custom scripts. Click "Advanced" > "Go to (project name)" > "Allow" |

## Screenshots

*Coming soon — contributions welcome!*

## License

[MIT](LICENSE)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
For security issues, see [SECURITY.md](SECURITY.md) — please do not open a public issue.

## Disclaimer

This is an unofficial, community-built tool. It is **not affiliated with, endorsed by, or
supported by Valve Corporation**. Steam, Steamworks, and the Steam logo are trademarks and/or
registered trademarks of Valve Corporation.

The tool performs irreversible operations (deleting leaderboard entries) using a Publisher API
Key that has full read, write, and delete access to your game's leaderboards. It is provided
"as is", without warranty of any kind, as stated in the [LICENSE](LICENSE). **You are
responsible for verifying every deletion and registration before you confirm it.** Your use of
the Steam Web API remains subject to Valve's own terms.
