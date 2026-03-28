# Changelog Skill

## Overview

This skill manages versioning and changelog updates following **Semantic Versioning 2.0.0** and **Conventional Commits** format.

---

## Semantic Versioning (SemVer)

Version format: `X.Y.Z` (major.minor.patch)

### Version Bumping Rules

| Increment | When to Use | Example |
|-----------|-------------|---------|
| **MAJOR** | Breaking changes to public API | `1.0.0` → `2.0.0` |
| **MINOR** | New backward-compatible features | `1.0.0` → `1.1.0` |
| **PATCH** | Backward-compatible bug fixes | `1.0.0` → `1.0.1` |

**Key Rule:** Patch version resets to `0` when minor increments; both reset to `0` when major increments.

Examples: `1.9.0` → `1.10.0` → `1.11.0` (correct) ✅

---

## Mapping Commits to Versions

Use commit types (from Conventional Commits) to determine version bump:

| Commit Type | SemVer Impact | Bump |
|------------|---------------|------|
| `feat(*)` | New backward-compatible feature | **MINOR** |
| `fix(*)` | Bug fix | **PATCH** |
| `refactor(*)` | Internal changes (no API change) | **PATCH** |
| `perf(*)` | Performance improvements | **PATCH** |
| `docs(*)` | Documentation only | No bump |
| `chore(*)`, `ci(*)`, `test(*)` | Maintenance only | No bump |
| `feat!:` or `BREAKING CHANGE:` | Breaking API change | **MAJOR** |

**Decision Rule:**
1. If any commit has `BREAKING CHANGE` → MAJOR
2. Else if any commit is `feat()` → MINOR
3. Else if any commit is `fix()` → PATCH
4. Else → No version bump (documentation only)

---

## CHANGELOG Format

### File Location
```
CHANGELOG.md
```

### File Structure

```markdown
# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Feature 1
- Feature 2

### Fixed
- Bug 1

### Changed
- Change 1

## [1.0.0] - 2026-03-08

### Added
- Initial release
- User authentication
- Workspace management

### Fixed
- Initial bug fixes

## [0.1.0] - 2026-02-01

### Added
- Beta release
- Core API endpoints
```

### Entry Format

Each release should have:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New feature A (module)
- New feature B (module)

### Changed
- Enhancement C (module)

### Fixed
- Bug fix D (module)

### Deprecated
- Deprecated feature E (note when it will be removed)

### Removed
- Removed feature F

### Security
- Security fix G
```

**Rules:**
- Date format: `YYYY-MM-DD` (ISO 8601)
- Only include sections that have changes
- Use present tense: "Add", "Fix", "Change" (not "Added", "Fixed")
- Include affected module in parentheses: `(crm)`, `(identity)`, `(communication)`
- Group by type: Added, Changed, Fixed, Deprecated, Removed, Security

---

## Release Workflow

### Phase 1: Aggregate Changes

**Before releasing,** review commits since last release:

```bash
# View commits since last tag
git log v1.0.0..HEAD --oneline

# Or view all changes in current branch vs develop
git log develop..HEAD --oneline --graph
```

Categorize commits into:
- **Added** (feat commits)
- **Changed** (refactor, perf commits)
- **Fixed** (fix commits)
- **Deprecated** (deprecation notices)
- **Removed** (removal of features)
- **Security** (security fixes)

### Phase 2: Update CHANGELOG.md

1. Create `## [Unreleased]` section (if not exists)
2. Review aggregate changes from Phase 1
3. Create new section with format: `## [X.Y.Z] - YYYY-MM-DD`
4. Move changes from `[Unreleased]` to new version section
5. Keep `[Unreleased]` section for future changes (or remove if empty)

Example entry:

```markdown
## [1.1.0] - 2026-03-08

### Added
- Message reordering for campaigns (campaign)
- Campaign status validation improvements (campaign)

### Fixed
- Invitation validation order for pre-registration flow (identity)
- Handle missing user in invitation flow (identity)

### Changed
- Improved error handling in campaign dispatch (campaign)
```

### Phase 3: Bump Version with pnpm

Determine version bump from commits (see "Mapping Commits to Versions" above).

**Option A: Automatic (Recommended)**
```bash
# Bump patch version (bug fixes)
pnpm version patch

# Bump minor version (new features)
pnpm version minor

# Bump major version (breaking changes)
pnpm version major
```

**What pnpm version does:**
1. ✅ Increments version in `package.json`
2. ✅ Creates git tag `v[X.Y.Z]` (e.g., `v1.1.0`)
3. ✅ Creates commit with message `"[version-bump]"` (can customize with `--message`)

**Option B: Manual (if needed)**
```bash
# Don't use --no-git-tag-version unless necessary
# Always create tags for releases
```

### Phase 4: Verify

```bash
# Check updated version in package.json
cat package.json | grep '"version"'

# Check git tag was created
git tag -l | tail -5

# Check commit message
git log --oneline -n 1
```

### Phase 5: Push Release

```bash
# Push commits AND tags
git push origin develop --follow-tags

# OR push main (for production releases)
git push origin main --follow-tags
```

---

## Commit-to-Changelog Mapping

### Example 1: Feature Release (MINOR)

**Commits since v1.0.0:**
```
feat(campaign): add message reordering
test(campaign): add reorder E2E tests
feat(communication): add channel filtering
fix(identity): handle missing user in invitation
chore(deps): update prisma
```

**Decision:** Has `feat()` commits → **MINOR bump** (1.0.0 → 1.1.0)

**CHANGELOG entry:**
```markdown
## [1.1.0] - 2026-03-08

### Added
- Message reordering for campaigns (campaign)
- Channel filtering for communication (communication)

### Fixed
- Handle missing user in invitation flow (identity)
```

### Example 2: Bug Fix Release (PATCH)

**Commits since v1.1.0:**
```
fix(campaign): correct message ordering logic
fix(crm): handle null custom fields
docs: update API reference
```

**Decision:** Only `fix()` commits → **PATCH bump** (1.1.0 → 1.1.1)

**CHANGELOG entry:**
```markdown
## [1.1.1] - 2026-03-08

### Fixed
- Correct message ordering logic in campaigns (campaign)
- Handle null custom fields in CRM (crm)
```

### Example 3: Breaking Change (MAJOR)

**Commits since v1.1.1:**
```
feat!(identity): change auth token format
BREAKING CHANGE: JWT token structure changed, old tokens invalid
fix(communication): sanitize channel input
```

**Decision:** Has `BREAKING CHANGE` → **MAJOR bump** (1.1.1 → 2.0.0)

**CHANGELOG entry:**
```markdown
## [2.0.0] - 2026-03-08

### Added
- New authentication token format (identity)

### Changed
- Channel input validation improved (communication)

### Deprecated
- Old JWT token format (will be removed in v3.0.0)

### BREAKING CHANGES
- JWT token structure changed, old tokens are no longer valid
```

---

## Changelog Checklist

Before committing CHANGELOG updates:

- [ ] Version follows SemVer (X.Y.Z)
- [ ] Date is in ISO format (YYYY-MM-DD)
- [ ] All sections use imperative mood ("Add", "Fix", not "Added")
- [ ] Module names included in parentheses: (module)
- [ ] Changes are grouped by type: Added, Changed, Fixed, etc
- [ ] Commits since last release are reviewed and included
- [ ] `[Unreleased]` section updated or removed
- [ ] No duplicate entries
- [ ] Links at bottom (if using Keep a Changelog format)

---

## Integration with CI/CD

### Release Triggers

**Suggested:** Releases triggered by:
1. **Manual merge to `main`** with updated CHANGELOG + version bump
2. **GitHub Actions** that automate CHANGELOG generation (optional future enhancement)

### Automated Version Detection (Optional)

Future enhancement: Use `commitizen` or similar to:
- Analyze commits automatically
- Suggest version bump
- Generate CHANGELOG entries

For now: **Manual process per this skill.**

---

## Examples

### Complete Release Flow

```bash
# 1. Merge feature branch to develop
git checkout develop
git pull origin develop
git merge feat/campaign-reordering

# 2. Review commits since last release
git log v1.0.0..HEAD --oneline
#   feat(campaign): add message reordering
#   test(campaign): add reorder E2E tests
#   fix(identity): handle missing user

# 3. Update CHANGELOG.md
#   - Aggregate changes into sections
#   - Create new version entry [1.1.0]
#   - Move from [Unreleased] to version

# 4. Commit CHANGELOG
git add CHANGELOG.md
git commit -m "chore(release): update changelog for v1.1.0"

# 5. Bump version
pnpm version minor  # 1.0.0 → 1.1.0

# 6. Verify
git log --oneline -n 2
git tag -l | tail -1

# 7. Push with tags
git push origin develop --follow-tags
```

### Git Aliases for Release

Add to `.gitconfig`:

```bash
[alias]
  changelog-review = "!git log $(git describe --tags --abbrev=0)..HEAD --oneline"
  release-patch = "!pnpm version patch && git push origin $(git rev-parse --abbrev-ref HEAD) --follow-tags"
  release-minor = "!pnpm version minor && git push origin $(git rev-parse --abbrev-ref HEAD) --follow-tags"
  release-major = "!pnpm version major && git push origin $(git rev-parse --abbrev-ref HEAD) --follow-tags"
```

Usage:
```bash
git changelog-review        # See commits since last release
git release-patch          # Bump patch + push
git release-minor          # Bump minor + push
git release-major          # Bump major + push
```

---

## Related Files

- `package.json` — Version source of truth (updated by `pnpm version`)
- `CHANGELOG.md` — User-facing changelog (updated manually per this skill)
- `.git/refs/tags/` — Git release tags (created by `pnpm version`)
- Commit history — Source of truth for changes (Conventional Commits format)

---

## Troubleshooting

### Forgot to Update CHANGELOG Before Bumping Version

```bash
# Undo version bump (if not pushed yet)
git reset --soft HEAD~1      # Undo version commit
git reset HEAD package.json  # Unstage version change

# Update CHANGELOG
nano CHANGELOG.md

# Re-commit and re-bump
git add CHANGELOG.md
git commit -m "chore(release): update changelog"
pnpm version patch
```

### Need to Release Without Version Bump

If only documentation/internal changes:
```bash
# No need to bump version
# Just update CHANGELOG under [Unreleased] section
# If releases are infrequent, can skip CHANGELOG update
```

### Amended Commit After Version Tag Created

```bash
# Tag created: v1.1.0
# But need to amend the version commit message

# Option 1: Create new version from scratch
git tag -d v1.1.0
git reset --soft HEAD~1
pnpm version minor --no-git-tag-version
git add package.json
git commit -m "chore(release): bump version to 1.1.0"
pnpm version minor --new-version 1.1.0 --no-git-tag-version
git tag v1.1.0
```

---

## Keep a Changelog Reference

For detailed guidance, see: https://keepachangelog.com/

This skill uses the **Keep a Changelog** format with SemVer.
