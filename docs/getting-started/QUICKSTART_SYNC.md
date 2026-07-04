# Quick Start Guide: Branch Sync Workflow

## 🎯 What Does This Do?

This implementation provides tools and documentation for keeping your development branch synchronized with the main branch and detecting merge conflicts early.

## 🚀 Quick Start

### One-Line Sync
```bash
bash scripts/sync-with-main.sh
```

That's it! The script will:
1. ✅ Configure git to fetch all branches
2. ✅ Fetch the latest changes from main
3. ✅ Show you what's different
4. ✅ Ask if you want to merge
5. ✅ Detect and report any conflicts

### Example Output
```
=== Syncing with main branch ===

Step 1: Updating git configuration...
✓ Git config updated

Step 2: Fetching latest changes...
✓ Latest changes fetched

Current branch: copilot/implement-agent-commands

Step 3: Comparing branches...
Branch comparison:
> 8f0aa7f docs: add implementation summary document
> 3a42aed feat: implement git sync workflow
> 0ad0e77 Initial plan
o 14af4ec Merge pull request #54

Summary:
  Ahead of main:  3 commit(s)
  Behind main: 0 commit(s)

✓ Branch is up to date with origin/main

=== Sync complete ===
```

## 📚 Documentation

### Quick Reference
- **README.md** - Git Workflow section with commands
- **CONTRIBUTING.md** - Detailed sync workflow instructions
- **.github/PULL_LATEST_CHANGES.md** - Complete process documentation
- **IMPLEMENTATION_SUMMARY.md** - Full implementation details

### Script Help
```bash
bash scripts/sync-with-main.sh --help
```

## 🔧 Common Scenarios

### Before Starting Work
```bash
# Make sure you have latest changes
bash scripts/sync-with-main.sh
```

### Before Creating a Pull Request
```bash
# Sync with main and resolve conflicts
bash scripts/sync-with-main.sh

# Review changes
git status
git diff origin/main
```

### In CI/CD Pipeline
```bash
# Auto-merge without prompting
bash scripts/sync-with-main.sh --auto-merge
```

## ⚠️ Handling Conflicts

If the script detects conflicts:

1. **Review** the conflicting files listed
2. **Edit** each file to resolve conflicts
3. **Stage** resolved files: `git add <file>`
4. **Commit** the merge: `git commit`

Or abort:
```bash
git merge --abort
```

## 🎓 What You Get

| Feature | Benefit |
|---------|---------|
| Automated fetch | No manual git config needed |
| Visual comparison | See exactly what's different |
| Conflict detection | Know before you merge |
| Interactive prompts | Safe, no accidental merges |
| Auto-merge mode | Perfect for automation |
| Color-coded output | Easy to read status |

## 💡 Tips

- Run the sync script regularly to stay up to date
- Use `--auto-merge` in scripts and CI/CD
- Check the comparison output before merging
- Read the detailed docs if you need more info

## 🆘 Need Help?

1. Run `bash scripts/sync-with-main.sh --help`
2. Check `.github/PULL_LATEST_CHANGES.md`
3. Review `CONTRIBUTING.md` section on syncing
4. Look at `IMPLEMENTATION_SUMMARY.md` for details

---

**Ready to sync?** Just run:
```bash
bash scripts/sync-with-main.sh
```
