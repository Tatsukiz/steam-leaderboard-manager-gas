# Security Policy

## Supported Versions

Only the latest version of `steam_lb_gas.js` is supported. Because the script is
installed by copy-pasting into Apps Script, please make sure you are running the
latest code before reporting an issue — see
[Updating the Code](README.md#updating-the-code).

## Reporting a Vulnerability

**Do not open a public issue for security problems.**

Use GitHub's [private vulnerability reporting](../../security/advisories/new)
(Security > Advisories > Report a vulnerability). Please include:

- What the problem is and what an attacker could do with it
- Steps to reproduce
- The version / commit of `steam_lb_gas.js` you tested

**Never include your Publisher API Key, App ID, or real SteamID64 values in a
report.** Redact them.

You can expect an initial response within about a week.

## Known Design Limitations (Not Vulnerabilities)

These are properties of Google Apps Script itself, not bugs in this tool. They
are documented here so you can decide whether this tool fits your threat model.

- **Anyone with editor access to the spreadsheet can read the Publisher API
  Key.** The key lives in Script Properties, which is readable from
  Extensions > Apps Script > Project Settings by any editor. Restrict sharing to
  people you would trust with the key itself. See
  [Security](README.md#security) in the README.
- **The Publisher API Key can read, write, and delete leaderboard entries for
  your game.** It is not scoped down to read-only.
- **Deletions are irreversible.** There is no undo and no server-side backup.
- **Anyone with editor access can run the delete and register actions.** The
  tool has no per-user permission model of its own.

## If Your API Key Is Exposed

1. Regenerate the Publisher API Key immediately on the
   [Steamworks partner site](https://partner.steamgames.com/).
2. Re-run **Steam Leaderboard > Setup (API Key / App ID)** in the spreadsheet and
   enter the new key.
3. Review your leaderboards for unexpected changes, and review who has editor
   access to the spreadsheet.
