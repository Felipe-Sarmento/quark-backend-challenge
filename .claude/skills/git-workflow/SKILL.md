# Git Workflow Skill

## Branch Conventions

### Protected Branches (No Direct Push)
- **`main`** - Production (stable releases only)
- **`develop`** - Staging/Homologation (integration branch)

**Rule:** Direct pushes to `main` and `develop` are **forbidden**. All changes must come via pull requests.

---

## Feature Branches

### `feat/**` - New Features
```
Origin:  develop
Merge:   develop (via PR)
Message: feat([scope]): [description]
Example: git checkout -b feat/campaign-reordering
```

**When to use:**
- Adding new functionality
- New API endpoints
- New domain features
- New services/usecases

---

### `fix/**` - Bug Fixes
```
Origin:  develop
Merge:   develop (via PR)
Message: fix([scope]): [description]
Example: git checkout -b fix/identity-invitation-validation
```

**When to use:**
- Fixing bugs in development/staging
- Hotfixes for develop branch
- Non-critical issues

---

### `chore/**` - Maintenance & Config
```
Origin:  develop
Merge:   develop (via PR)
Message: chore([scope]): [description]
Example: git checkout -b chore/update-dependencies
```

**When to use:**
- Dependency updates
- Build system changes
- Tool configuration
- CI/CD updates
- Refactoring (non-functional changes)
- Package bumps

---

## Atomic Commits

All commits **MUST** be atomic and follow **Conventional Commits** format.

### Commit Format
```
[type]([scope]): [imperative message]

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`

**Scope:** Component/module affected (e.g., `campaign`, `identity`, `communication`)

**Message:** Short (under 50 chars), imperative mood, lowercase

### Valid Atomic Commits
```bash
feat(campaign): add message reordering
test(identity): add user creation unit tests
chore(deps): upgrade prisma to 5.x
fix(communication): handle null channel gracefully
docs(api): update swagger endpoint descriptions
```

### Invalid Commits (Non-Atomic)
```bash
✗ git add .
✗ git commit -m "Fixed stuff"  # Too vague

✗ feat and fix mixed in single commit
✗ Multiple unrelated features in one PR
```

---

## Pull Request Workflow

### 1. Create Feature Branch
```bash
git checkout -b feat/your-feature
# or: git checkout -b fix/your-bug
# or: git checkout -b chore/your-maintenance
```

### 2. Make Atomic Commits
```bash
git add [specific files]
git commit -m "feat(scope): your message"

git add [other files]
git commit -m "test(scope): add test coverage"

git add [config]
git commit -m "chore(scope): update config"
```

### 3. Keep Branch in Sync
```bash
git fetch origin
git rebase origin/develop  # Interactive rebase to squash if needed
```

### 4. Push to Remote
```bash
git push origin feat/your-feature
```

### 5. Create Pull Request
- **Title:** Follow commit format: `feat(scope): description`
- **Description:** Clear problem statement, approach, testing notes
- **Checks:** Must pass:
  - ✅ Linting (`pnpm lint`)
  - ✅ Unit tests (`pnpm test`)
  - ✅ E2E tests (if applicable)
  - ✅ Code review (if required)

### 6. Merge to develop
```bash
# Option A: GitHub UI (squash or rebase)
# Option B: CLI merge
git checkout develop
git pull origin develop
git merge --ff-only origin/feat/your-feature
git push origin develop
```

---

## Hotfixes (Production Issues)

If critical bug is discovered in `main`:

```bash
git checkout -b hotfix/issue-name origin/main

# Fix the bug atomically
git commit -m "fix(scope): critical issue"

# Push and create PR to main
git push origin hotfix/issue-name

# After merge to main:
git checkout develop
git pull origin main
git merge origin/main
git push origin develop
```

---

## Rebase vs Merge Policy

**Preferred:** Rebase (`--ff-only`) to keep history linear
```bash
git rebase origin/develop
```

**Alternative:** Squash merge for feature branches (optional, depending on team preference)
```bash
git merge --squash origin/feat/your-feature
```

**Never:** Merge `main` into feature branch (rebase instead)

---

## Commit Message Checklist

Before pushing, verify each commit:

- [ ] Type is valid: `feat`, `fix`, `chore`, etc
- [ ] Scope is accurate: matches affected module/component
- [ ] Message is imperative: "add feature" not "added feature"
- [ ] Message is lowercase (except BREAKING CHANGE)
- [ ] Commit is atomic: one logical change per commit
- [ ] No unrelated files mixed in single commit
- [ ] No merge commits in feature branch (rebase instead)

---

## Examples

### Feature Workflow
```bash
git checkout -b feat/campaign-reordering

# Commit 1: Core service
git commit -m "feat(campaign): add message reorder logic"

# Commit 2: HTTP controller
git commit -m "feat(campaign): add reorder endpoint"

# Commit 3: Tests
git commit -m "test(campaign): add reorder E2E tests"

git push origin feat/campaign-reordering
# Create PR → merge to develop
```

### Chore Workflow
```bash
git checkout -b chore/prisma-upgrade

git commit -m "chore(deps): upgrade prisma to 5.15"
git commit -m "chore(prisma): regenerate client"

git push origin chore/prisma-upgrade
# Create PR → merge to develop
```

---

## Forbidden Actions

❌ **Direct push to `main` or `develop`**
```bash
git push origin develop  # FORBIDDEN
git push origin main     # FORBIDDEN
```

❌ **Force push to `main` or `develop`**
```bash
git push -f origin develop  # FORBIDDEN
```

❌ **Merge feature branch without PR review**

❌ **Non-atomic commits**
```bash
git commit -m "feat: and fix: both in one commit"  # FORBIDDEN
```

❌ **Rewriting history on shared branches**

---

## Git Aliases (Optional)

Add to `.gitconfig` for convenience:

```bash
[alias]
  co = checkout
  br = branch
  ci = commit
  st = status
  sync = "!git fetch origin && git rebase origin/develop"
  pushf = "!git push -u origin $(git rev-parse --abbrev-ref HEAD)"
```

Usage:
```bash
git co -b feat/new-feature
git ci -m "feat(scope): message"
git sync
git pushf
```
