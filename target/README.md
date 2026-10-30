# Target Repository Folder

Clone the repository you want to investigate into this directory:

### Option 1: Clean clone into `target`
```bash
# If target/ only has this readme and .gitkeep:
git clone https://github.com/<owner>/<repo>.git target-temp
mv target-temp/* target/ 2>/dev/null
mv target-temp/.* target/ 2>/dev/null
rm -rf target-temp
```

Or simply delete the target directory first and clone directly:
```bash
rm -rf target && git clone https://github.com/<owner>/<repo>.git target
```

### Option 2: Clone as a subfolder inside `target/`
```bash
git clone https://github.com/<owner>/<repo>.git target/repo
```

> **Note**: The `.gitignore` is configured to ignore everything inside `target/` except `target/.gitkeep` and `target/README.md`, ensuring the target code is never committed into the review repository.
