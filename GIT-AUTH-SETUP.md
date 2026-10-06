# Git Authentication Setup — GitHub & GitVerse

## Problem
GitHub disabled password authentication for Git operations. Need to use PAT (Personal Access Token) instead.

## Solution: Create PAT Tokens

### GitHub (kinooxru)

1. Go to: https://github.com/settings/tokens
2. Click **Fine-grained tokens** (recommended) or **Classic tokens**
3. Create new token:
   - **Name**: `kinoox-production`
   - **Expiration**: 7 days (or permanent)
   - **Permissions** (Fine-grained):
     - Contents: Read and write
     - Metadata: Read-only
   - **Repository access**: Only select repositories
   - Click **Generate token**
4. Copy the token (starts with `github_pat_...`)

**OR use Classic token** (simpler):
   - Go to: https://github.com/settings/tokens/new
   - Name: `kinoox-production`
   - Expiration: 7 days
   - Select **repo** scope (full control of private repositories)
   - Click **Generate token**
   - Copy token (starts with `ghp_...`)

### GitVerse (kinooxru)

1. Go to: https://gitverse.ru/settings/tokens (or your GitVerse instance)
2. Click **Create Token**
3. Configure:
   - **Name**: `kinoox-production`
   - **Permissions**: Read/Write repository access
   - **Expiration**: 7 days
4. Copy the token

## Configure Git Locally

```powershell
# Set global Git config
git config --global user.name "KINOOX Team"
git config --global user.email "dev@kinoox.ru"

# Test GitHub connection (replace TOKEN with your PAT)
$GITHUB_TOKEN = "ghp_YOUR_TOKEN_HERE"

# Add remotes with embedded credentials
git remote add origin https://${GITHUB_TOKEN}@github.com/kinooxru/kinoox.git
git remote add gitverse https://${GITHUB_TOKEN}@gitverse.ru/kinooxru/kinoox.git

# OR add without credentials and use credential helper
git remote add origin https://github.com/kinooxru/kinoox.git
git remote add gitverse https://gitverse.ru/kinooxru/kinoox.git

# Store credentials in Git credential helper
git credential-manager store
# Next push will prompt for username and token
```

## Configure Git on Server

```bash
# SSH to server
ssh root@95.216.97.185

# Navigate to project
cd /opt/kinoox

# Set Git config
git config user.name "KINOOX Team"
git config user.email "dev@kinoox.ru"

# Add remotes with tokens
export GITHUB_TOKEN="ghp_YOUR_TOKEN_HERE"
export GITVERSE_TOKEN="YOUR_GITVERSE_TOKEN"

git remote add origin https://${GITHUB_TOKEN}@github.com/kinooxru/kinoox.git
git remote add gitverse https://${GITVERSE_TOKEN}@gitverse.ru/kinooxru/kinoox.git

# OR use credential helper
git config credential.helper store
```

## Push to GitHub

```powershell
# Initialize repo (if not done)
git init
git add -A
git commit -m "KINOOX: Initial production setup with Docker Compose v2 fixes"

# Add remotes
git remote add origin https://github.com/kinooxru/kinoox.git
git remote add gitverse https://gitverse.ru/kinooxru/kinoox.git

# Push to GitHub
git push -u origin main

# Push to GitVerse
git push gitverse main
```

## Troubleshooting

### "Repository not found"
- Verify token has correct permissions
- Check username is `kinooxru`
- Verify repositories exist on both platforms

### "Permission denied (publickey)"
- Using SSH? Add SSH keys to both platforms
- Using HTTPS? Ensure PAT is used instead of password

### "Remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/kinooxru/kinoox.git
```

## Security Notes

⚠️ **NEVER commit tokens to repository**
- Tokens go in `.env` or Git config (local only)
- Add `.env` to `.gitignore`
- Add `git/config` to local exclude list

✅ **Best Practices**
- Use short expiration (7 days)
- Rotate tokens regularly
- Use fine-grained tokens with minimal permissions
- Store tokens in secure password manager
