# Merging Two Repos into This Monorepo

Option: git subtree (keeps history)
- `git remote add other <url>`
- `git fetch other`
- `git subtree add --prefix path/in/this/repo other main --squash`

Example
- Merge your frontend repo into `web/`: `git subtree add --prefix web <url> main --squash`
- Merge a data/automation repo into `automation/`: `git subtree add --prefix automation <url> main --squash`

Option: copy without history
- Simply copy files into appropriate directories and commit.

Tip
- Keep backend under `allie/backend`, Firebase under `firebase`, lessons under `lessons`.

