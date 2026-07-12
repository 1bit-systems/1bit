---
name: github-scraper
description: >-
  Advanced GitHub intelligence gathering, code mining, repository archaeology, and search-fu.
  Use this skill whenever you need to find anything on GitHub — repos, code snippets, issues,
  people, commits, patterns across the entire GitHub ecosystem. Leverages all 48 GitHub MCP
  tools for maximum coverage. "Makes GitHub your bitch."
---

# GitHub Scraper — Total GitHub Dominance

This skill documents **every** GitHub MCP tool's advanced usage. Use it to **own** GitHub search, repository mining, code archaeology, and intelligence gathering.

---

## 🎯 Philosophy

GitHub is a planet-scale code+knowledge graph. These tools let you query it laterally:
- **Repos** → find by description, topic, README, language, stars, fresh commits
- **Code** → regex across all public+private code with qualifier stacking
- **Issues/PRs** → the conversation layer: bugs, features, design decisions, flame wars
- **Commits** → who changed what, when, and why (messages)
- **People** → find maintainers, contributors, users by skill area
- **Releases/Tags** → version archaeology, breaking-change timelines

**Rule of thumb:** If you can't find it with these tools, it probably doesn't exist on GitHub.

---

## 📋 Tool Inventory (48 tools)

### 🔍 Search Tools — Universal Discovery

| Tool | Superpower |
|------|-----------|
| `github_search_repositories` | Find repos by name/desc/readme/topics. Sort by stars, forks, updated, or help-wanted-issues. |
| `github_search_code` | Regex-level code search across all of GitHub. Supports qualifier stacking. |
| `github_search_commits` | Find commits by message, author, date, repo. Sort by author-date or committer-date. |
| `github_search_issues` | Find issues across repos. Filter by label, state, author, assignee, milestone, comments count, reactions. |
| `github_search_pull_requests` | Find PRs across repos. Filter by base branch, head branch, draft state, review status, labels. |
| `github_search_users` | Find users by name, bio, location, followers count, repos count, type (user/org). |

### 📦 Repository Tools — Read & Write

| Tool | Superpower |
|------|-----------|
| `github_get_file_contents` | Read any file. Get raw content + SHA for later edits. |
| `github_create_repository` | Create a new repo in your account or org. |
| `github_fork_repository` | Fork any public repo. |
| `github_create_branch` | Create a branch from any ref. |
| `github_list_branches` | List all branches. |
| `github_list_commits` | List commits on a branch. |
| `github_list_tags` | List git tags. |
| `github_get_tag` | Get tag details (annotated tag message + sha + commit). |
| `github_get_commit` | Get full commit details (diff stats, files changed, message). |
| `github_create_or_update_file` | Create or update a file. Uses SHA from get_file_contents for conflict detection. |
| `github_push_files` | Push multiple files atomically. |
| `github_delete_file` | Delete a file. |

### 🔄 Pull Request Tools — Code Review Power

| Tool | Superpower |
|------|-----------|
| `github_create_pull_request` | Create PR with title, body, head/base. |
| `github_pull_request_read` | Get full PR details (draft state, mergeable, merge commit SHA, labels, reviewers). |
| `github_list_pull_requests` | List PRs filtered by state, head/base, sort, direction. |
| `github_update_pull_request` | Change PR title, body, state (close/reopen), base branch. |
| `github_merge_pull_request` | Merge with merge method (merge/squash/rebase) + commit message. |
| `github_update_pull_request_branch` | Update PR branch with base branch changes. |
| `github_add_reply_to_pull_request_comment` | Reply inline to PR comments. |
| `github_add_comment_to_pending_review` | Add comment to an unfinished review. |
| `github_pull_request_review_write` | Create/submit or delete a review (approve, comment, or request changes). |
| `github_request_copilot_review` | Request GitHub Copilot code review. |

### 🐛 Issue Tools — Bug Reporting & Tracking

| Tool | Superpower |
|------|-----------|
| `github_issue_read` | Get full issue details (labels, assignees, milestone, project cards, state reason). |
| `github_issue_write` | Create or update issues. Add labels, assignees, milestone. |
| `github_list_issues` | List issues with filter by state, labels, assignee, milestone, sort, direction. |
| `github_list_issue_types` | List supported issue types for a repo. |
| `github_list_issue_fields` | List issue fields for issue forms/projects. |
| `github_add_issue_comment` | Add comment and/or reactions. |

### 🏷️ Release & Label Tools

| Tool | Superpower |
|------|-----------|
| `github_get_latest_release` | Get latest release details (tag name, body, assets). |
| `github_get_release_by_tag` | Get release by specific tag. |
| `github_list_releases` | List releases paginated. |
| `github_get_label` | Get single label details. |

### 👤 User & Org Tools

| Tool | Superpower |
|------|-----------|
| `github_get_me` | Get authenticated user details (rate limit info, plan, collaborators). |
| `github_search_users` | Search users by any profile field. |
| `github_get_team_members` | Get members of a specific team. |
| `github_get_teams` | List all teams in the org. |
| `github_list_repository_collaborators` | List collaborators (users with access) to a repo. |

### 🔐 Security Tools

| Tool | Superpower |
|------|-----------|
| `github_run_secret_scanning` | Scan files/content/changes for secrets. |

---

## 🦅 Advanced Search Recipes

### Repository Discovery

```text
# Most starred AI repos updated this month
github_search_repositories { query: "AI OR artificial-intelligence", sort: "stars", order: "desc", per_page: 30 }

# New hot projects (last week, >100 stars)
github_search_repositories { query: "created:>2026-07-05 stars:>100", sort: "stars", order: "desc" }

# Niche tech: find repos by topic intersection
github_search_repositories { query: "topic:token-compression topic:transformer", sort: "stars" }

# Abandoned repos that still have value (no updates but high stars)
github_search_repositories { query: "pushed:<2025-01-01 stars:>500", sort: "stars" }
```

### Code Search — The Real Power Tool

```text
# Find API usage across all public code
github_search_code { query: "import os from 'react-native' NOT node_modules", per_page: 20 }

# Find potential security issues
github_search_code { query: "apiKey OR api_secret OR password language:go", per_page: 10 }

# Migration patterns: find old API being called
github_search_code { query: "deprecatedMethod\\( language:python path:src", per_page: 15 }

# Find tests for a specific function
github_search_code { query: "\"function tokenFusion\" OR \"def token_fusion\" test", per_page: 10 }
```

**Qualifier stacking guide:**
```
language:python      → filter by language
path:src/           → path contains (prefix match)
filename:test_*     → filename glob
extension:.tsx      → exact extension
repo:owner/repo     → scope to one repo
org:facebook        → scope to an org
user:torvalds       → scope to a user
size:>1000          → file size in bytes
is:archived         → include archived
is:fork             → include forks
```

### Issue Mining — Understanding Community

```text
# Feature requests sorted by reactions
github_search_issues { query: "feature request OR feature suggestion", sort: "reactions", order: "desc" }

# Recent critical bugs
github_search_issues { query: "bug OR crash OR regression label:bug", sort: "updated", order: "desc" }

# Good first issues for new contributors
github_search_issues { query: "label:good-first-issue label:help-wanted", sort: "updated" }

# What breaking changes are people discussing?
github_search_issues { query: "breaking change OR migration guide", sort: "comments", order: "desc" }
```

### Commit Message Archaeology

```text
# Find where a feature was introduced
github_search_commits { query: "add token fusion repo:owner/repo", sort: "author-date" }

# Find reverts (history is telling)
github_search_commits { query: "revert OR rollback OR hotfix", sort: "committer-date" }

# Who's been most active recently
github_search_commits { query: "author-email:example@corp.com", sort: "author-date" }
```

### User & Org Recon

```text
# Find experts in a domain
github_search_users { query: "location:berlin language:rust followers:>50" }

# Find maintainers of key projects
github_search_users { query: "type:org repos:>10 location:san-francisco" }

# Profile of a user before engaging
# 1. github_search_users { query: "user:somecontributor" }
# 2. github_search_repositories { query: "user:somecontributor" }
# 3. Look at recent commits/issues/PRs
```

---

## 🔬 Research Workflow: Deep-Dive a Topic

Use this when you need to truly understand a technology landscape:

### Phase 1: Surface Mapping
```text
1. github_search_repositories → Find top repos by stars, topics, description
2. README analysis (get_file_contents) → Understand each project
3. Spot patterns: who's building what, what stack, what licenses
```

### Phase 2: Code Mining
```text
4. github_search_code → Find all implementations of a key function/class
5. Compare approaches across repos
6. Look at imports/dependencies → ecosystem map
```

### Phase 3: Community Intelligence
```text
7. github_search_issues → What problems people are hitting (label:bug, label:feature)
8. github_search_commits → When things changed, who changed them
9. github_get_commit → Deep-dive specific important commits
```

### Phase 4: Relationship Mapping
```text
10. github_get_file_contents → README "Related Projects" sections
11. github_list_releases → Version timelines, breaking changes
12. Cross-reference authors/orgs across multiple repos
```

---

## 💥 Advanced Combo Attacks

### "Find the best implementation pattern"
```text
Step 1: Find top repos by stars
Step 2: Search code for "def token_fusion" across them
Step 3: Read the actual implementation files
Step 4: Cross-reference with issues discussing tradeoffs
```

### "Track an idea from paper to code to production"
```text
Step 1: Search repos by paper name (e.g., "token fusion cvpr 2022")
Step 2: Get the paper repo, read the model code
Step 3: Search code for "import TokenFusion" → find downstream users
Step 4: Check issues/PRs on downstream repos for adoption patterns
Step 5: Search commits for "TokenFusion" → see when it was integrated
```

### "Security audit path: find leaked secrets trend"
```text
Step 1: github_search_code { query: "-----BEGIN RSA PRIVATE KEY-----" }
Step 2: github_search_code { query: "AWS_SECRET_ACCESS_KEY" }
Step 3: github_run_secret_scanning on interesting repos
```

### "Competitive landscape analysis"
```text
Step 1: Find 10-20 repos in a domain (by topic/stars/description)
Step 2: Extract: language, license, last commit, stars, contributors
Step 3: For each, read README and docs to understand positioning
Step 4: Check issues for common pain points → market gaps
Step 5: Check release timeline → development velocity
```

### "Find your next job / hire / collaborator"
```text
Step 1: Search repos in your tech stack by language+topics
Step 2: Get commit list → find active contributors
Step 3: github_search_users on those contributors
Step 4: Check their other repos, bio, location
Step 5: See their recent issues/PRs activity
```

---

## 📊 Output Templates

When reporting findings, structure like:

```markdown
# 🔬 Research: [Topic]

## 🌟 Top Projects
| Repo | Stars | Lang | Updated | What |
|------|-------|------|---------|------|
| ... | ... | ... | ... | ... |

## 🏗️ Architecture Patterns
- Pattern A: ... (used by repo1, repo2)
- Pattern B: ... (used by repo3)

## 🔥 Community Pulse (from issues)
- Top bug: ...
- Most requested feature: ...
- Common confusion: ...

## 📈 Trends
- [If time-series data available from commits/releases]
```

---

## ⚠️ Gotchas & Limits

- **Code search max 256 chars** — compress queries, use path matching
- **Rate limits apply** — API key determines limit. `github_get_me` shows your rate limit status
- **Per_page max 100** — use pagination for more
- **Code search returns code fragments** not full files (use get_file_contents for full)
- **Search results ordered by relevance by default** — use `sort:` for deterministic ordering
- **Private repos only searchable if you have access**
- **Fork repos excluded by default in some searches** — use `is:fork` to include

---

## 🏁 Quick Reference Card

```
SEARCH REPOS    → github_search_repositories { query, sort, order, per_page }
SEARCH CODE     → github_search_code { query, sort, order, per_page }
SEARCH ISSUES   → github_search_issues { query, sort, order, per_page }
SEARCH PRs      → github_search_pull_requests { query, sort, order }
SEARCH COMMITS  → github_search_commits { query, sort, order }
SEARCH USERS    → github_search_users { query, sort, order }
READ FILE       → github_get_file_contents { owner, repo, path }
REPO INFO       → github_list_commits + github_get_commit + github_list_releases
FORK/CREATE     → github_fork_repository / github_create_repository
PR FLOW         → github_create_pull_request + github_pull_request_review_write + github_merge_pull_request
```

---

> "GitHub is the world's largest code graph. These tools are your query language for it."
