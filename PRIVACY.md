# Privacy Policy — CF Booster

**Last updated:** June 2026

CF Booster is a browser extension for Codeforces. This policy explains what data the extension uses and how it is handled.

## Summary

- Data stays on **your device** unless you export it yourself.
- We do **not** run servers or collect analytics.
- We do **not** ask for your Codeforces password.

## Data stored locally

The extension stores the following in your browser (IndexedDB and `chrome.storage`):

- User settings (handle, goals, preferences)
- Solved problems and personal notes
- Patterns, mistakes, review queue entries
- Contest history imported from Codeforces

This data never leaves your browser except when **you** use Export Backup in Settings.

## Data fetched from Codeforces

When you connect your handle or click Sync, the extension calls the **public** [Codeforces API](https://codeforces.com/apiHelp) to read:

- Your profile (handle, rating, name, avatar URL)
- Your submission history (verdict, problem info, timestamps)
- Your contest rating history

These requests go directly from your browser to `codeforces.com`. We do not proxy or store them on any third-party server.

## Permissions

| Permission | Why |
|------------|-----|
| `storage` | Save your data locally |
| `tabs` / `activeTab` | Open the dashboard and interact with Codeforces tabs |
| `codeforces.com` host access | Sidebar on problem pages and API calls |
| `notifications` | Optional review reminders (if enabled) |
| `alarms` | Schedule reminders |

## Third parties

- **Codeforces** — API and website when you use sync or visit problem pages
- **No advertising or tracking SDKs** are included

## Children's privacy

CF Booster is not directed at children under 13.

## Changes

We may update this policy in the GitHub repository. Continued use after changes constitutes acceptance.

## Contact

Open an issue on the [GitHub repository](https://github.com/YOUR_USERNAME/cf-booster/issues).
