# Development Guide - 1 Ohana Lens

This guide covers everything you need to know for local development, contributing to the project, and understanding the development workflow.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Development Workflow](#development-workflow)
4. [Database Management](#database-management)
5. [Environment Variables](#environment-variables)
6. [Running the Application](#running-the-application)
7. [Code Style & Conventions](#code-style--conventions)
8. [Testing](#testing)
9. [Common Tasks](#common-tasks)
10. [Troubleshooting](#troubleshooting)
11. [API Documentation](#api-documentation)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js**: v20.x or later (LTS recommended)
- **pnpm**: v9.x or later (install with: `npm install -g pnpm`)
- **Git**: Latest version
- **VS Code** (recommended) with extensions:
  - Prisma
  - ESLint
  - Prettier
  - TypeScript and JavaScript

### External Services Accounts

You'll need free accounts for these services:

1. **Cloudinary** (https://cloudinary.com)
   - Sign up for free tier (25GB/month)
   - Get your Cloud Name, API Key, and API Secret
   
2. **Turso** (https://turso.tech) - Optional for production
   - Sign up for free tier
   - Create a database
   - Get connection URL and auth token

---

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/1-ohana-lens.git
cd 1-ohana-lens
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all required packages including:
- Next.js 14 (App Router)
- Prisma ORM
- Material-UI v7
- React Query v5
- Authentication libraries (JWT, bcrypt)
- File handling libraries (React Dropzone)
- And more...

### 3. Setup Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local  # If example exists, otherwise create manually
```

Add the following variables (see [Environment Variables](#environment-variables) section for details):

```env
# Database (Development)
DATABASE_URL="file:./dev.db"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Authentication
JWT_SECRET=your_generated_secret

# Optional: Image Compression
COMPRESS_IMAGES=false
```

### 4. Initialize the Database

Run Prisma migrations to create the database schema:

```bash
pnpm exec prisma migrate dev --name init
```

This creates:
- SQLite database file: `dev.db`
- 5 tables: admin_users, folders, media, sessions, access_logs

### 5. Seed Admin Users

Seed the database with 3 admin accounts:

```bash
pnpm exec prisma db seed
```

**Default Admin Credentials:**
- Username: `admin1` / Password: `admin123`

⚠️ **Important:** Change these passwords before deploying to production!

### 6. Verify Setup

Open Prisma Studio to inspect the database:

```bash
pnpm exec prisma studio
```

This opens http://localhost:5555 where you can view tables and records.

---

## Development Workflow

### Starting Development Server

```bash
pnpm dev
```

The application runs at http://localhost:3000

### Available Scripts

| Script                         | Description                                    |
| ------------------------------ | ---------------------------------------------- |
| `pnpm dev`                     | Start development server with hot reload       |
| `pnpm build`                   | Build production bundle                        |
| `pnpm start`                   | Start production server (requires build first) |
| `pnpm lint`                    | Run ESLint to check code quality               |
| `pnpm exec prisma studio`      | Open database GUI                              |
| `pnpm exec prisma migrate dev` | Create and apply new migration                 |
| `pnpm exec prisma db seed`     | Seed database with admin users                 |
| `pnpm exec prisma generate`    | Regenerate Prisma Client                       |

### Git Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit frequently:**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   ```

3. **Push and create pull request:**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

**Examples:**
```
feat: add video player controls
fix: resolve upload timeout issue
docs: update README with deployment steps
refactor: optimize cloudinary upload function
```

---

## Database Management

### Prisma Commands

#### View Database

```bash
pnpm exec prisma studio
```

#### Create New Migration

After modifying `prisma/schema.prisma`:

```bash
pnpm exec prisma migrate dev --name migration_description
```

#### Reset Database (⚠️ Deletes all data)

```bash
pnpm exec prisma migrate reset
```

This will:
1. Drop the database
2. Create a new database
3. Apply all migrations
4. Run seed script

#### Update Prisma Client

After schema changes:

```bash
pnpm exec prisma generate
```

### Database Schema Overview

```
admin_users
├── id (UUID, primary key)
├── username (unique)
├── passwordHash
├── email (unique)
├── isActive (boolean)
└── timestamps

folders
├── id (UUID, primary key)
├── name
├── description
├── folderKey (unique)
├── passwordHash
├── sizeInBytes (BigInt)
└── timestamps

media
├── id (UUID, primary key)
├── folderId (foreign key)
├── fileName
├── cloudinaryUrl
├── cloudinaryPublicId
├── mediaType (image/video)
├── fileSize (BigInt)
├── mimeType
└── uploadedAt

sessions (JWT tracking)
├── id (UUID, primary key)
├── adminId (foreign key)
├── tokenHash
├── expiresAt
└── createdAt

access_logs (audit trail)
├── id (UUID, primary key)
├── adminId (foreign key, nullable)
├── folderId (foreign key, nullable)
├── action
├── ipAddress
├── userAgent
└── createdAt
```

### Relationships

- `media.folderId` → `folders.id` (CASCADE delete)
- `sessions.adminId` → `admin_users.id` (CASCADE delete)
- `access_logs.adminId` → `admin_users.id` (SET NULL on delete)
- `access_logs.folderId` → `folders.id` (SET NULL on delete)

---

## Environment Variables

### Development (.env.local)

```env
# Database Connection
DATABASE_URL="file:./dev.db"

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your_64_character_random_string

# Optional: Enable automatic image compression
COMPRESS_IMAGES=false
```

### Production (Vercel Environment)

When deploying to Vercel, set these environment variables in the Vercel dashboard:

```env
# Turso Database Connection
DATABASE_URL=libsql://your-database-url.turso.io

# Cloudinary (same as dev)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Secret (use a different secret for production!)
JWT_SECRET=your_production_secret

# Optional: Enable image compression in production
COMPRESS_IMAGES=true
```

### Generating JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Running the Application

### Start Development Server

```bash
pnpm dev
```

### Access Points

| URL                                             | Description          | Auth Required |
| ----------------------------------------------- | -------------------- | ------------- |
| http://localhost:3000                           | Landing page         | None          |
| http://localhost:3000/admin/login               | Admin login          | None          |
| http://localhost:3000/admin                     | Admin dashboard      | Admin JWT     |
| http://localhost:3000/admin/folders             | Folder management    | Admin JWT     |
| http://localhost:3000/admin/folders/[id]        | Folder detail        | Admin JWT     |
| http://localhost:3000/admin/folders/[id]/upload | Upload media         | Admin JWT     |
| http://localhost:3000/folder/[id]               | Member folder access | Folder JWT    |
| http://localhost:3000/api-docs                  | Swagger API docs     | None          |

### Testing Admin Login

1. Go to http://localhost:3000/admin/login
2. Use credentials from seed script:
   - Username: `admin1`
   - Password: `admin123`
3. You'll be redirected to the admin dashboard

### Testing Folder Access

1. Create a folder via admin dashboard
2. Copy the generated password (shown once)
3. Share the folder link: http://localhost:3000/folder/[folder-id]
4. Members enter the password to access media

---

## Code Style & Conventions

### TypeScript

- Use TypeScript for all files
- Explicitly type function parameters and return types
- Use `interface` over `type` for object definitions
- Avoid `any` type - use `unknown` if type is uncertain

**Example:**

```typescript
interface FolderData {
  name: string;
  description?: string;
}

async function createFolder(data: FolderData): Promise<Folder> {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Prefer named exports for components
- Use `"use client"` directive for client components
- Keep components small and focused

**Example:**

```typescript
"use client";

import { useState } from "react";

interface FolderCardProps {
  folder: Folder;
  onDelete: (id: string) => void;
}

export function FolderCard({ folder, onDelete }: FolderCardProps) {
  const [loading, setLoading] = useState(false);
  // Component logic
  return <div>{/* JSX */}</div>;
}
```

### File Naming

| Type       | Convention             | Example           |
| ---------- | ---------------------- | ----------------- |
| Components | PascalCase             | `FolderCard.tsx`  |
| Utilities  | camelCase              | `authUtils.ts`    |
| API Routes | lowercase + route.ts   | `route.ts`        |
| Types      | PascalCase + .types.ts | `folder.types.ts` |

### API Routes

Use Next.js 14 App Router format:

```typescript
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Implementation
    return Response.json({ data: result });
  } catch (error) {
    console.error("[API] Error:", error);
    return Response.json(
      { error: "Error message", code: "ERROR_CODE" },
      { status: 500 }
    );
  }
}
```

### Error Handling

Always wrap async operations in try-catch:

```typescript
try {
  const result = await someAsyncOperation();
  return Response.json({ data: result });
} catch (error) {
  console.error("[API] Error:", error);
  return Response.json(
    { error: "Something went wrong", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
```

### Material-UI Best Practices

- Use MUI `sx` prop for styling
- Prefer MUI components over custom HTML
- Use MUI theme for consistent colors and spacing

**Example:**

```typescript
import { Box, Typography, Button } from "@mui/material";

<Box sx={{ p: 2, bgcolor: "background.paper" }}>
  <Typography variant="h5">Title</Typography>
  <Button variant="contained" color="primary">
    Action
  </Button>
</Box>
```

---

## Testing

### Manual Testing Checklist

#### Authentication
- [ ] Admin login with valid credentials
- [ ] Admin login with invalid credentials
- [ ] Admin logout
- [ ] JWT token expiration (7 days)
- [ ] Folder password verification
- [ ] Unauthorized access attempts

#### Folder Management (Admin)
- [ ] Create new folder
- [ ] View all folders
- [ ] Update folder metadata
- [ ] Delete folder
- [ ] Copy folder link
- [ ] View folder details

#### Media Upload (Admin)
- [ ] Upload single image
- [ ] Upload multiple images
- [ ] Upload video files
- [ ] Large file handling (100MB limit)
- [ ] Invalid file type rejection
- [ ] Storage calculation updates

#### Media Gallery (Members & Admin)
- [ ] View folder media grid
- [ ] Image lightbox preview
- [ ] Video player playback
- [ ] Download media files
- [ ] Responsive layout on mobile
- [ ] Empty state display

#### Storage Management
- [ ] Storage usage calculation
- [ ] Warning at 80% storage
- [ ] Critical alert at 95% storage
- [ ] Delete media from folder
- [ ] Storage freed after deletion

#### Error Scenarios
- [ ] Network failure handling
- [ ] Cloudinary upload failure
- [ ] Database connection error
- [ ] Invalid JWT token
- [ ] Expired session
- [ ] Rate limit exceeded

### Browser Testing

Test on these browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

### Device Testing

- Desktop (1920x1080)
- Laptop (1366x768)
- Tablet (iPad, 768x1024)
- Mobile (iPhone, 375x667)
- Mobile (Android, 360x640)

---

## Common Tasks

### Add a New Admin User

1. Open Prisma Studio:
   ```bash
   pnpm exec prisma studio
   ```

2. Navigate to `admin_users` table
3. Click "Add record"
4. Fill in details (password must be bcrypt hashed)
5. Or use seed script and modify it

### Create a Test Folder

```bash
# Use the admin dashboard UI, or via Prisma Studio
```

1. Login as admin
2. Go to admin/folders
3. Click "Create Folder"
4. Fill in name and description
5. Copy generated password

### Upload Test Files

1. Login as admin
2. Navigate to folder detail page
3. Click "Upload Files"
4. Drag and drop files or click to browse
5. Wait for upload to complete

### View API Documentation

```bash
pnpm dev
```

Open http://localhost:3000/api-docs to see Swagger UI with all API endpoints.

### Inspect Cloudinary Files

1. Login to Cloudinary dashboard
2. Navigate to Media Library
3. Find `ohana-lens` folder
4. View uploaded files organized by folder ID

### Clear Database and Start Fresh

```bash
pnpm exec prisma migrate reset
```

This will ask for confirmation, then:
- Drop all tables
- Recreate schema
- Run seed script

---

## Troubleshooting

### Database Issues

#### "Can't find schema.prisma"

```bash
# Ensure you're in project root
cd /path/to/1-ohana-lens
pnpm exec prisma generate
```

#### "Database connection error"

Check your `DATABASE_URL` in `.env.local`:
```env
DATABASE_URL="file:./dev.db"
```

#### "Migration failed"

Reset and try again:
```bash
pnpm exec prisma migrate reset
pnpm exec prisma migrate dev
```

### Cloudinary Issues

#### "Invalid cloud name"

Verify environment variables:
```bash
echo $NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
```

Make sure `.env.local` has the correct cloud name from Cloudinary dashboard.

#### "Upload failed: 400 Bad Request"

Check:
- API Key and Secret are correct
- File size is under 100MB
- File type is supported (JPG, PNG, GIF, MP4, MOV, WebM)

#### "Rate limit exceeded"

Cloudinary free tier: 500 requests per 5 minutes. Wait a few minutes or upgrade plan.

### Next.js Issues

#### "Module not found"

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### "Port 3000 already in use"

Kill the process:
```bash
lsof -ti:3000 | xargs kill -9
```

Or use a different port:
```bash
PORT=3001 pnpm dev
```

#### "Build failed: Type error"

Check TypeScript errors:
```bash
pnpm lint
```

Fix type errors and rebuild.

### Authentication Issues

#### "JWT malformed"

Token might be corrupted. Clear localStorage and login again.

#### "Token expired"

Tokens expire after 7 days. Login again to get a new token.

#### "Unauthorized"

Check:
- Token is included in `Authorization` header
- Token is valid (not expired)
- Token type matches endpoint (admin vs folder)

---

## API Documentation

### Swagger UI

Access comprehensive API documentation at:

```
http://localhost:3000/api-docs
```

### Quick API Reference

#### Authentication

| Endpoint                    | Method | Auth  | Description            |
| --------------------------- | ------ | ----- | ---------------------- |
| `/api/auth/admin-login`     | POST   | None  | Admin login            |
| `/api/auth/admin-logout`    | POST   | Admin | Admin logout           |
| `/api/auth/verify-password` | POST   | None  | Folder password verify |
| `/api/auth/logout`          | POST   | Any   | Generic logout         |

#### Folders

| Endpoint                     | Method | Auth         | Description                  |
| ---------------------------- | ------ | ------------ | ---------------------------- |
| `/api/folders`               | GET    | Admin        | List all folders             |
| `/api/folders`               | POST   | Admin        | Create folder                |
| `/api/folders/[id]`          | GET    | Admin/Folder | Get folder details           |
| `/api/folders/[id]`          | PATCH  | Admin        | Update folder                |
| `/api/folders/[id]`          | DELETE | Admin        | Delete folder                |
| `/api/folders/[id]/media`    | GET    | Admin/Folder | Get folder media             |
| `/api/folders/[id]/metadata` | GET    | None         | Get folder metadata (public) |

#### Media

| Endpoint                       | Method | Auth  | Description         |
| ------------------------------ | ------ | ----- | ------------------- |
| `/api/media/upload/[folderId]` | POST   | Admin | Upload media        |
| `/api/media/[id]`              | DELETE | Admin | Delete single media |
| `/api/media/limits`            | GET    | None  | Get upload limits   |

#### Admin

| Endpoint                     | Method | Auth  | Description          |
| ---------------------------- | ------ | ----- | -------------------- |
| `/api/admin/storage-usage`   | GET    | Admin | Get storage stats    |
| `/api/admin/folders-by-size` | GET    | Admin | List folders by size |

### Request Examples

#### Admin Login

```bash
curl -X POST http://localhost:3000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin1", "password": "admin123"}'
```

Response:
```json
{
  "ok": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "uuid",
      "username": "admin1",
      "email": "admin1@example.com"
    }
  }
}
```

#### Create Folder

```bash
curl -X POST http://localhost:3000/api/folders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"name": "Summer Run 2026", "description": "Beach run event"}'
```

#### Upload Media

```bash
curl -X POST http://localhost:3000/api/media/upload/FOLDER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "files=@/path/to/image.jpg"
```

---

## Contributing

### Before Submitting a PR

1. **Run tests:** Ensure all manual tests pass
2. **Run linter:** `pnpm lint`
3. **Build project:** `pnpm build`
4. **Update docs:** If adding features, update relevant documentation
5. **Write clear commit messages:** Follow conventional commits

### PR Guidelines

- Keep PRs focused on a single feature or fix
- Include description of changes
- Reference related issues
- Add screenshots for UI changes
- Update PROGRESS.md if completing a phase task

---

## Resources

### Documentation
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Material-UI v7 Docs](https://mui.com)
- [React Query v5 Docs](https://tanstack.com/query/latest)
- [Cloudinary Upload API](https://cloudinary.com/documentation/image_upload_api_reference)

### Tools
- [Prisma Studio](http://localhost:5555) - Database GUI
- [Swagger UI](http://localhost:3000/api-docs) - API Documentation
- [Cloudinary Console](https://cloudinary.com/console) - Media management

### Community
- [GitHub Issues](https://github.com/your-repo/issues) - Report bugs
- [GitHub Discussions](https://github.com/your-repo/discussions) - Ask questions

---

**Last Updated:** February 15, 2026  
**Maintainer:** Project Team
