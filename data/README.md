# Data Directory

The `data/` folder is reserved for sensitive artifacts (for example, Firebase service account JSON files) that should never be committed.

- Place temporary uploads inside `data/upload/`. The `.gitkeep` placeholder keeps the directory in source control while the `.gitignore` patterns block actual secrets.
- Store production credentials in a secure vault such as Google Secret Manager or your CI/CD secret store. For local development, export the path to the service account JSON via `GOOGLE_APPLICATION_CREDENTIALS` instead of copying the key into the repository.

Remove any temporary files from `data/upload/` before creating a commit.
