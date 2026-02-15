# 1 Ohana Lens - Deployment Guide

**Last Updated:** February 15, 2026  
**Status:** Ready for Production Deployment

This guide provides step-by-step instructions for deploying 1 Ohana Lens to production on Vercel with Turso database and Cloudinary storage.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Setup](#environment-setup)
4. [Database Migration (SQLite → Turso)](#database-migration-sqlite--turso)
5. [Vercel Deployment](#vercel-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

Before deploying, ensure you have:

### Accounts & Services

1. **GitHub Account**
   - Repository with 1 Ohana Lens code pushed
   - Required for Vercel integration

2. **Vercel Account** (Free tier)
   - Sign up at https://vercel.com
   - Will be used to host frontend and API routes

3. **Turso Account** (Free tier)
   - Sign up at https://turso.tech
   - SQLite database hosting (replaces local dev.db)
   - Free tier: unlimited databases, 9GB storage, 10,000 API requests/day

4. **Cloudinary Account** (Free tier)
   - Already configured during development
   - 25GB/month bandwidth allocation
   - Verify API credentials are ready

5. **Domain (Optional)**
   - Custom domain or use Vercel's default *.vercel.app domain
   - If using custom domain, add to Vercel project settings

### Local Environment

- Node.js v20.x or later
- pnpm v9.x or later
- Git CLI installed and authenticated
- Latest codebase committed and pushed to GitHub

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`pnpm lint`)
- [ ] No console.error() logs from development debugging
- [ ] All environment variables documented in `.env.example`
- [ ] No hardcoded API keys or secrets in code
- [ ] Build succeeds locally (`pnpm build`)

### Security

- [ ] Admin default passwords have been reset
  - [ ] Change `admin1` username or password in database
  - [ ] Update seed script with new credentials
  - [ ] Store credentials in secure password manager
- [ ] JWT_SECRET is strong (use: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] API routes validate authentication on every request
- [ ] File upload validation includes MIME type and size checks

### Database

- [ ] Prisma schema is final and tested
- [ ] All migrations created and tested locally
- [ ] Seed script reflects production admin users
- [ ] Database relationships and constraints verified
- [ ] Backup plan documented (see Rollback section)

### Cloudinary

- [ ] Cloud Name, API Key, API Secret verified
- [ ] Free tier limitations understood (25GB/month)
- [ ] Upload limits tested (100MB per file)
- [ ] Folder structure organized (`ohana-lens/folder-{id}`)
- [ ] Delete operations tested and working

### UI/UX

- [ ] All pages responsive and tested on mobile
- [ ] Error messages are user-friendly
- [ ] Loading states implemented
- [ ] Empty states display correctly
- [ ] Toast notifications working
- [ ] Forms validate correctly

---

## Environment Setup

### Step 1: Create `.env.example`

Create a `.env.example` file in the project root with all required variables (without secrets):

```bash
# Database (Turso - Production)
DATABASE_URL=libsql://your-database.turso.io?authToken=your_auth_token

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Authentication
JWT_SECRET=your_jwt_secret

# Optional: Email notifications (future feature)
# SMTP_HOST=smtp.example.com
# SMTP_FROM=noreply@example.com
```

### Step 2: Generate Production JWT Secret

Generate a strong JWT secret for production:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Output: abc123def456... (copy this value)
```

**Important:** Use a DIFFERENT secret from development. Store it securely.

### Step 3: Update Prisma for Production

The Prisma schema is already configured for both SQLite and Turso. No changes needed, but verify:

**prisma/schema.prisma:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

This works with both:
- Development: `file:./dev.db`
- Production: `libsql://...turso.io` (Turso SQLite)

---

## Database Migration (SQLite → Turso)

### Step 1: Create Turso Database

#### Option A: Using Turso CLI (Recommended)

Install Turso CLI:
```bash
# macOS
brew install tursodatabase/tap/turso

# Linux
curl -sSfL https://get.turso.io/turso | bash

# Windows (WSL)
curl -sSfL https://get.turso.io/turso | bash
```

Create new database:
```bash
turso auth login
# Opens browser for authentication

turso db create ohana-lens-prod
# Creates new database named ohana-lens-prod
```

Get connection details:
```bash
turso db show ohana-lens-prod
# Output:
# Name: ohana-lens-prod
# Database URL: libsql://ohana-lens-prod-username.turso.io
```

Get auth token:
```bash
turso db tokens create ohana-lens-prod --expiration none
# Output: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Database URL for .env:
```
libsql://ohana-lens-prod-username.turso.io?authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Option B: Using Turso Dashboard

1. Go to https://app.turso.tech
2. Click "Create new database"
3. Name: `ohana-lens-prod`
4. Region: Select closest to your users
5. Click "Create"
6. Go to database → "Auth tokens"
7. Create new token with no expiration
8. Copy connection string

### Step 2: Test Connection & Get Credentials

Get your database details:

```bash
turso db show ohana-lens-prod
# Shows: Name, Database URL, ID, Group, etc.

turso db tokens create ohana-lens-prod --expiration none
# Output: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9... (copy this token)
```

Create your `.env.local` with complete connection string:

```bash
# .env.local
DATABASE_URL="libsql://1-ohana-lens-prod-tinspham209.aws-ap-northeast-1.turso.io?authToken=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."
```

**Important:** The `?authToken=` parameter is required for Turso connections.

### Step 3: Run Migrations (Using Turso Shell)

### Step 4: Create Database Schema

Create a SQL file with the schema (or use the `turso-schema.sql` file in your repo):

```bash
# Push schema to Turso using CLI
cat turso-schema.sql | turso db shell ohana-lens-prod

# Verify tables were created
turso db shell ohana-lens-prod ".tables"
```

Expected output:
```
AccessLog     
AdminUser     
Folder        
Media         
Session       
```

### Step 5: Seed Production Admin User

Generate a bcrypt password hash:

```bash
node -e "
import bcryptjs from 'bcryptjs';
bcryptjs.hash('Your_Strong_Password_123!', 12, (err, hash) => {
  if (err) console.error(err);
  else console.log(hash);
});
" --input-type=module
# Output: \$2b\$12\$... (copy this hash)
```

Insert admin user into Turso:

```bash
turso db shell ohana-lens-prod "INSERT INTO AdminUser (id, username, password_hash, email, isActive) VALUES ('admin-001', 'admin1', '\$2b\$12\$YOUR_HASH_HERE', 'admin1@ohanalens.com', 1);"
```

Verify admin user was created:

```bash
turso db shell ohana-lens-prod "SELECT id, username, email, isActive FROM AdminUser;"
```

Expected output:
```
ID            USERNAME     EMAIL                    ISACTIVE 
admin-001     admin1       admin1@ohanalens.com     1            
```

**Important:** Replace `Your_Strong_Password_123!` with a secure password and use the actual bcrypt hash from your system.

### Step 6: Set DATABASE_URL in .env.local

Update your `.env.local` with the complete Turso connection string:

```bash
# In .env.local:
DATABASE_URL="libsql://ohana-lens-prod-xxx.turso.io?authToken=your_token_here"
```

The connection string should include:
- Your Turso database URL (from `turso db show`)
- Your auth token (from `turso db tokens create`)

Example:
```
DATABASE_URL="libsql://1-ohana-lens-prod-tinspham209.aws-ap-northeast-1.turso.io?authToken=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."
```

### Step 7: Clean Up Temporary Environment Files

Keep only the necessary environment variables in `.env.local`:

```bash
# Remove or comment out test DATABASE_URLs
# It will be set via Vercel environment variables in next step

---

## Vercel Deployment

### Step 1: Connect GitHub Repository

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Connect GitHub account if not already connected
4. Select the `1-ohana-lens` repository
5. Click "Import"

### Step 2: Configure Build Settings

Vercel should auto-detect Next.js. Verify:

| Setting          | Value          |
| ---------------- | -------------- |
| Framework Preset | Next.js        |
| Build Command    | `pnpm build`   |
| Output Directory | `.next`        |
| Install Command  | `pnpm install` |

These are defaults and should be correct.

### Step 3: Add Environment Variables

In Vercel project settings → "Environment Variables":

Add all variables from `.env.example`:

```
DATABASE_URL = libsql://ohana-lens-prod-xxx.turso.io?authToken=your_token
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
JWT_SECRET = your_production_jwt_secret
COMPRESS_IMAGES = true (optional, for production optimization)
```

**Important:**
- `NEXT_PUBLIC_*` variables are exposed to browser (safe)
- Other variables remain server-side only
- No quotes needed in Vercel UI

### Step 4: Deploy

1. Click "Deploy" button in Vercel
2. Wait for build to complete (~2-3 minutes)
3. You'll see deployment URL: `https://ohana-lens-xxx.vercel.app`

**First deployment output:**
```
✓ Deployed to production
✓ Build completed in 2m 34s
✓ Serverless Functions optimized
```

### Step 5: Custom Domain (Optional)

If you own a custom domain:

1. Go to project settings → "Domains"
2. Add your domain
3. Follow DNS configuration instructions for your registrar
4. Wait for DNS propagation (5-30 minutes)

Examples:
- `ohana-lens.example.com`
- `photos.runclub.local`

---

## Post-Deployment Verification

### Step 1: Verify Application Is Running

1. Open deployment URL: `https://ohana-lens-xxx.vercel.app`
2. You should see the landing page
3. Check browser console for errors (F12)

### Step 2: Test Admin Login

1. Go to `https://ohana-lens-xxx.vercel.app/admin/login`
2. Enter admin credentials (set in seed step)
3. Should redirect to `/admin`
4. Verify dashboard loads

### Step 3: Test Folder Operations

Admin Dashboard:
1. Create a new test folder
2. Verify folder appears in list
3. Copy folder link
4. Delete test folder

### Step 4: Test Member Access

Member Access:
1. From admin dashboard, copy folder link
2. Open link in incognito window (fresh session)
3. Enter folder password
4. Should redirect to folder gallery
5. Gallery should display (empty is OK)

### Step 5: Test File Upload

1. Login as admin
2. Create a new test folder
3. Go to folder detail → "Upload Media"
4. Upload a small test image or video
5. File should appear in gallery view
6. Download file to verify it works

### Step 6: Test API Documentation

1. Go to `https://ohana-lens-xxx.vercel.app/api-docs`
2. Should see Swagger UI
3. Test a few API endpoints (GET /api/admin/storage-usage)

### Step 7: Verify Environment Variables

Check that environment variables are loaded correctly:

```bash
# In deployment logs, Vercel should show:
✓ Environment variables loaded
✓ DATABASE_URL connected to Turso
✓ Cloudinary configured
```

### Step 8: Database Verification

Open Turso Studio:
```bash
turso studio ohana-lens-prod
```

Or use online dashboard:
1. Go to https://app.turso.tech
2. Select `ohana-lens-prod` database
3. Browse tables → should see:
   - `admin_users` (your admin account)
   - `folders` (empty, for your test data)
   - `media` (empty)
   - `sessions` (JWT tracking)
   - `access_logs` (audit trail)

### Step 9: Cloudinary Verification

Check Cloudinary Media Library:
1. Go to https://cloudinary.com/console
2. Media Library → Look for `ohana-lens` folder
3. If you uploaded test files, they should appear here
4. Verify automatic optimization is working

### Step 10: Test Error Handling

Test error scenarios:
1. Try accessing folder with wrong password → should fail gracefully
2. Try accessing without token → should redirect to password prompt
3. Upload invalid file type → should show error message
4. Upload oversized file (>100MB simulation) → should be rejected

---

## Monitoring & Maintenance

### Daily Checks

**1. Monitor Application Health**
```bash
# Check Vercel deployment logs every day
# Go to Vercel project → "Deployments" → latest → "Logs"
```

Look for:
- ✅ No 500 errors
- ✅ Database connection stable
- ✅ Cloudinary uploads working
- ❌ JWT validation errors
- ❌ Unhandled exceptions

**2. Monitor Storage Usage**

In admin dashboard:
1. Check storage percentage
2. Warnings should appear at 80% and 95%
3. Plan deletion every 3-4 weeks

**3. Check Cloudinary Usage**
```bash
# Go to https://cloudinary.com/console
# Look at "Usage" tab
# Verify:
# - Bandwidth usage is reasonable
# - File count matches database
# - No unexpected transformations
```

### Weekly Tasks

**1. Backup Database** (Manual for now)

```bash
# Export Turso database
turso db shell ohana-lens-prod
# Or use Turso API for automated backups in future

# Download as SQL dump
turso db shell ohana-lens-prod .dump > backup-$(date +%Y%m%d).sql
```

**2. Review Access Logs**

Check audit trail for suspicious activity:
```bash
# Via Prisma Studio in production
DATABASE_URL="libsql://..." pnpm exec prisma studio

# Query access_logs table
# Look for:
# - Failed login attempts
# - Unusual IP addresses
# - Bulk deletions
```

**3. Test Critical Workflows**

- [ ] Can create folder
- [ ] Can upload files
- [ ] Can delete files
- [ ] Can access shared folder link
- [ ] Storage calculation is accurate

### Monthly Tasks

**1. Review and Rotate Storage**

```
Week 1-2: Monitor storage usage
Week 3: Identify oldest folders to delete
Week 4: Delete oldest folders to free space
```

Target: Stay under 20GB (leaving 5GB buffer for new events)

**2. Update Admin Credentials**

```bash
# Via Prisma Studio:
# Change admin password to something new
# Document in secure password manager
```

**3. Check Vercel Analytics**

In Vercel dashboard:
- Response times
- Error rates
- Traffic patterns
- Bandwidth usage

### Quarterly Tasks

**1. Security Audit**

- [ ] Verify no API keys in code
- [ ] Check for outdated dependencies (`pnpm outdated`)
- [ ] Review access logs for anomalies
- [ ] Test password reset flow
- [ ] Verify HTTPS enforcement

**2. Update Dependencies**

```bash
# Check for updates
pnpm outdated

# Update patch/minor versions
pnpm update

# Test locally
pnpm build
pnpm dev

# Commit and deploy
git add .
git commit -m "chore: update dependencies"
git push
```

**3. Database Optimization**

```bash
# Analyze query performance
# Verify indexes are being used
# Archive old access_logs if needed

turso db shell ohana-lens-prod
# Run diagnostic queries
```

### Monitoring Tools Setup (Future)

For better long-term monitoring, consider:

1. **Error Tracking:** Sentry, LogRocket
2. **Performance Monitoring:** New Relic, Datadog
3. **Uptime Monitoring:** Uptimerobot, Betterstack
4. **Database Backups:** Turso Replication

---

## Troubleshooting

### Deployment Fails

**Error: "Build failed: Module not found"**

```bash
# SSH into build logs and check:
1. Go to Vercel project → Deployments → Failed deployment
2. Check Build Logs tab
3. Look for missing imports

# Fix:
pnpm install
pnpm build
git add package.json pnpm-lock.yaml
git commit -m "fix: update dependencies"
git push
```

**Error: "DATABASE_URL is not set"**

```bash
# Verify in Vercel:
1. Project Settings → Environment Variables
2. Ensure DATABASE_URL is added
3. Redeploy after adding variables

# Or redeploy from command line:
vercel deploy --prod --env DATABASE_URL="libsql://..."
```

### Application Runs But Can't Connect to Database

**Error: "Cannot connect to Turso database"**

```bash
# Check connection string:
# Should be: libsql://name-xxx.turso.io?authToken=token

# Test locally:
DATABASE_URL="libsql://..." node -e \
  "const db = require('@libsql/client').createClient({...}); db.execute('SELECT 1')"

# Solutions:
1. Verify auth token is valid (hasn't expired)
2. Check Turso database status: turso db show ohana-lens-prod
3. Verify firewall/network allows outbound HTTPS
4. Check token has correct database permissions
```

### Admin Can't Login

**Error: "Invalid credentials"**

```bash
# Verify admin user exists in database:
turso studio ohana-lens-prod
# Check admin_users table

# If user missing, seed again:
DATABASE_URL="libsql://..." pnpm exec prisma db seed

# If password wrong, reset:
# Use Prisma Studio to manually update password hash
# Or create new admin user
```

### File Upload Fails

**Error: "Upload failed to Cloudinary"**

```bash
# Check Cloudinary credentials:
1. Verify CLOUDINARY_API_KEY in Vercel environment variables
2. Verify CLOUDINARY_API_SECRET is correct
3. Check Cloudinary API quota (console.cloudinary.com/console/usage)
4. Verify API key is enabled and not rate-limited

# Solutions:
1. Regenerate API key in Cloudinary dashboard
2. Update in Vercel environment variables
3. Redeploy (Vercel will use new variables)
```

**Error: "File size exceeds limit"**

```bash
# Cloudinary free tier: 100MB per file
# Solutions:
1. User needs to compress file locally
2. Implement client-side compression (already done with imageCompression.ts)
3. Upgrade Cloudinary plan for larger files
```

### Out of Storage

**Error: "Storage quota exceeded"**

```bash
# Cloudinary free tier: 25GB/month bandwidth

# Solutions:
1. Delete old folders from admin dashboard
2. Implement automatic cleanup script (future feature)
3. Upgrade Cloudinary plan ($84/year for 50GB)

# Check usage:
go to https://cloudinary.com/console/usage/storage
```

### Slow Performance

**Symptoms: Pages loading slowly, uploads taking long**

```bash
# Check factors:
1. Cloudinary rate limits (500 requests per 5 min free tier)
2. Turso database performance (check query logs)
3. Vercel function cold starts (normal for free tier)
4. Image optimization disabled (COMPRESS_IMAGES=true)

# Solutions:
1. Enable image compression: set COMPRESS_IMAGES=true in Vercel
2. Implement caching for API responses
3. Upgrade Vercel plan for faster cold starts
4. Use Cloudinary CDN for image optimization
```

### Vercel Deployment Rolls Back

**Symptoms: Deployment succeeded but then rolls back**

```bash
# Check Vercel logs for:
1. Health check failures
2. Environment variable issues
3. Database migration errors
4. Unhandled promise rejections

# Rollback to previous version:
1. Go to Vercel dashboard → Deployments
2. Find last known good deployment
3. Click "Redeploy" button
# This will rebuild from the same code
```

---

## Rollback Procedures

### Scenario 1: Database Migration Failed

**Situation:** You deployed a schema change that broke the application

**Steps:**

```bash
# 1. Revert code changes
git revert HEAD
git push

# 2. Vercel will auto-redeploy with old code
# - Old code is compatible with current database
# - Application recovers

# 3. Fix the migration locally:
# - Test thoroughly on dev database
# - Create proper migration: pnpm exec prisma migrate dev --name fix_schema

# 4. Redeploy fixed code
git push
```

### Scenario 2: Cloudinary Credentials Leaked

**Situation:** API key was accidentally committed to GitHub

**Steps:**

```bash
# 1. Immediately revoke old API key in Cloudinary dashboard
# - Go to cloudinary.com/console/settings/security
# - Regenerate API key

# 2. Update Vercel environment variables
# - Go to Vercel project settings → Environment Variables
# - Update CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET
# - Click "Save" and "Redeploy"

# 3. Remove secret from Git history
# - Use git filter-branch or BFG Repo-Cleaner
# - Force push (⚠️ only if team is small)

# 4. Inform team to pull latest changes
git reset --hard
```

### Scenario 3: Minor Bug in Production

**Situation:** Non-critical bug discovered in deployed app

**Steps:**

```bash
# 1. Create fix branch
git checkout -b fix/bug-description

# 2. Fix the bug locally
# - Test thoroughly: pnpm build && pnpm dev

# 3. Commit and push
git add .
git commit -m "fix: description of fix"
git push origin fix/bug-description

# 4. Create pull request on GitHub
# - Get review if possible
# - Merge to main

# 5. Vercel auto-deploys after merge
# - Deployment should complete in 2-3 minutes
# - Check Vercel logs for errors
```

### Scenario 4: Critical Bug Needs Immediate Rollback

**Situation:** Major bug discovered and affecting users now

**Steps:**

```bash
# 1. Immediate rollback via Vercel (fastest)
# - Go to Vercel dashboard → Deployments
# - Find last known good deployment
# - Click the three dots → "Redeploy"
# - This rebuilds from commit and deploys (30 seconds)

# 2. While rollback is happening, fix the bug locally
# - Create fix branch: git checkout -b fix/critical
# - Fix the issue
# - Test locally

# 3. After rollback succeeds, test the application
# - Verify it's working again
# - Note what happened in incident log

# 4. Deploy the fix
git add .
git commit -m "fix: critical bug fix"
git push origin fix/critical
# Create PR and merge

# 5. Redeploy (should be fixed now)
```

---

## Post-Deployment Checklist

After successful deployment, complete these steps:

### Communication
- [ ] Notify team that app is live
- [ ] Share production URL with admin users
- [ ] Send admin login credentials securely
- [ ] Document access procedures

### Admin Setup
- [ ] Verify admin can login on production
- [ ] Create first test folder
- [ ] Test uploading media to Cloudinary
- [ ] Verify storage monitoring works

### Documentation
- [ ] Update README.md with production URL
- [ ] Document admin credentials location (secure)
- [ ] Add disaster recovery procedure
- [ ] Create incident response plan

### Monitoring
- [ ] Set up Vercel alerts (optional)
- [ ] Enable error tracking (optional)
- [ ] Setup backup reminders (calendar event)
- [ ] Schedule weekly check-in

### Security
- [ ] Document that default passwords changed
- [ ] Verify HTTPS is enforced (automatic with Vercel)
- [ ] Test JWT expiration (7 days)
- [ ] Verify API authentication is working

---

## Emergency Contacts & Resources

### Support

| Service        | Contact                          |
| -------------- | -------------------------------- |
| **Vercel**     | https://vercel.com/support       |
| **Turso**      | https://discord.com/invite/turso |
| **Cloudinary** | support@cloudinary.com           |
| **GitHub**     | https://github.com/support       |

### Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- Turso Dashboard: https://app.turso.tech
- Cloudinary Console: https://cloudinary.com/console
- GitHub Repository: [Your repo URL]
- Application (Production): https://ohana-lens-xxx.vercel.app
- Application (Admin): https://ohana-lens-xxx.vercel.app/admin/login
- API Docs: https://ohana-lens-xxx.vercel.app/api-docs

### Documentation References

- [Vercel Deployment Guide](https://vercel.com/docs/concepts/deployments/overview)
- [Turso Database Guide](https://turso.tech/docs)
- [Cloudinary API Reference](https://cloudinary.com/documentation/cloudinary_api)
- [Next.js Deployment](https://nextjs.org/docs/deployment/vercel)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/production/deploy-to-production)

---

## Production Best Practices

### Security

1. **Regular Password Rotation**
   - Change admin password every 90 days
   - Use strong passwords (20+ characters, mixed case, numbers, symbols)

2. **Monitor Access Logs**
   - Check for failed login attempts
   - Watch for unusual access patterns
   - Archive old logs quarterly

3. **Backup Procedure**
   - Backup database weekly
   - Store backups in separate location
   - Test restore procedure monthly

### Performance

1. **Monitor Page Load Times**
   - Target: < 3 seconds for admin dashboard
   - Target: < 2 seconds for gallery view
   - Use Vercel's built-in analytics

2. **Optimize Images**
   - Ensure COMPRESS_IMAGES is enabled
   - Monitor Cloudinary bandwidth usage
   - Use responsive images on all pages

3. **Database Optimization**
   - Archive access logs older than 6 months
   - Run VACUUM on SQLite periodically (automatic with Turso)
   - Monitor query performance

### Reliability

1. **Error Handling**
   - All API endpoints return consistent error format
   - User-friendly error messages in UI
   - Silent failures are logged but don't crash app

2. **Graceful Degradation**
   - If Cloudinary is down, show friendly message
   - If database is slow, show loading state
   - Allow offline browsing of cached images (future)

3. **Monitoring & Alerts**
   - Setup alerts for failed deployments
   - Monitor 5xx error rates (should be near 0%)
   - Track response time trends

---

## Version Control & Releases

### Main Branch Protection

Protect the `main` branch to prevent accidental overwrites:

1. Go to GitHub repository → Settings → Branches
2. Add branch protection rule:
   - Branch name pattern: `main`
   - Require pull request reviews before merging: **Yes** (1 required)
   - Require status checks to pass: **Yes** (build + lint)
   - Dismiss stale pull request approvals: **Yes**
3. Save

### Deployment Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and test
pnpm dev
pnpm build
pnpm lint

# 3. Commit with conventional messages
git add .
git commit -m "feat: add new feature"

# 4. Push and create pull request
git push origin feature/new-feature
# Create PR on GitHub

# 5. Code review and testing
# - Team reviews code
# - Automated tests run
# - Vercel creates preview deployment

# 6. Merge to main
# - GitHub UI button "Squash and merge" or "Rebase and merge"
# - This triggers production deployment

# 7. Verify production
# - Check deployment logs
# - Test critical workflows
# - Monitor for errors
```

### Tagging Releases

After deploying to production:

```bash
# Create semantic version tag
git tag -a v1.0.0 -m "Production release: version 1.0.0"
git push origin v1.0.0

# Create release on GitHub (with changelog)
# Go to GitHub → Releases → "Create a new release"
# Tag: v1.0.0
# Title: "1 Ohana Lens v1.0.0"
# Description: List of features, fixes, and changes
```

---

## Conclusion

Your 1 Ohana Lens application is now deployed to production! 

**Next Steps:**
1. Verify all checklist items are complete
2. Train admin users on the platform
3. Monitor system health daily for first week
4. Schedule regular maintenance tasks
5. Plan future features based on user feedback

**Success Criteria:**
- ✅ Admin can login and manage folders
- ✅ Members can access shared folders with password
- ✅ Files upload and display correctly
- ✅ Delete operations free up storage
- ✅ No critical errors in logs
- ✅ Performance is acceptable

**Support:** Refer to troubleshooting section or contact team lead for assistance.

---

**Document Version:** 1.0  
**Last Updated:** February 15, 2026  
**Status:** ✅ Production Ready
