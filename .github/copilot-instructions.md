# GitHub Copilot Instructions for 1 Ohana Lens

## Project Overview

**1 Ohana Lens** is a media management application for a run club to share photos and videos from events. It provides password-protected folder-based storage with admin management and automatic storage rotation.

## Tech Stack

### Frontend

- **Framework:** Next.js 14+ (App Router)
- **UI Library:** Material-UI (MUI v5+)
- **State Management:** Zustand
- **Data Fetching:** React Query v5+ (TanStack Query)
- **File Upload:** React Dropzone
- **Image Lightbox:** yet-another-react-lightbox
- **Video Player:** Native HTML5 video element
- **Styling:** MUI sx prop + CSS modules

### Backend

- **Runtime:** Next.js 14+ API Routes
- **ORM:** Prisma
- **File Storage:** Cloudinary REST API
- **Authentication:** JWT + bcrypt

### Database

- **Development:** SQLite (local file: dev.db)
- **Production:** Turso SQLite
- **ORM:** Prisma

## Code Style & Conventions

### TypeScript

- Use TypeScript for all files
- Prefer interface over type for object definitions
- Use strict mode
- Explicitly type function parameters and return types
- Use const for immutable values

### React Components

- Use functional components with hooks
- Prefer named exports for components
- Use `"use client"` directive for client components in Next.js App Router
- Keep components small and focused (single responsibility)
- Extract complex logic into custom hooks

### File Naming

- Components: PascalCase (e.g., `FolderCard.tsx`)
- Utilities/Helpers: camelCase (e.g., `authUtils.ts`)
- API Routes: lowercase with route.ts (e.g., `app/api/folders/route.ts`)
- Types: PascalCase with `.types.ts` suffix (e.g., `folder.types.ts`)

### API Routes Structure

```typescript
// Use Next.js 14 App Router format
export async function GET(request: Request) {
	// Implementation
}

export async function POST(request: Request) {
	// Implementation
}
```

### Error Handling

- Always wrap async operations in try-catch
- Return consistent error format:
  ```typescript
  return Response.json(
  	{ error: "Error message", code: "ERROR_CODE" },
  	{ status: 400 },
  );
  ```
- Log errors for debugging: `console.error('[API] Error:', error)`

### Authentication

- **Dual System:**
  - Admin authentication: JWT token with admin_id
  - Member authentication: JWT token with folder_id
- Always verify JWT tokens in API routes
- Password hashing: Use bcrypt with 10-12 rounds
- Session expiry: 7 days

### Database (Prisma)

- Use Prisma Client for all database operations
- Always handle transaction failures
- Use CASCADE delete for related records
- Index foreign keys for performance

### Cloudinary Integration

- Organize files by folder: `${CLOUDINARY_FOLDER_NAME}/folder-{id}/file-name`
- Store both `cloudinary_url` and `cloudinary_public_id` in database
- Always delete from Cloudinary when deleting from database
- Use REST API for uploads and deletions

### Material-UI Best Practices

- Use MUI sx prop for styling
- Prefer MUI components over custom HTML elements
- Use MUI theme for consistent colors and spacing
- Responsive design: Use Grid, Stack, Box for layout

### Security

- Never expose API secrets in client code
- Validate all user inputs
- Sanitize file uploads (MIME type, size, extension)
- Rate limit authentication endpoints
- Use HTTPS (handled by Vercel)

## Project Structure

```
1-ohana-lens/
├── app/
│   ├── page.tsx                    # Public folder access page
│   ├── admin/                      # Admin dashboard pages
│   │   ├── page.tsx               # Admin dashboard home
│   │   ├── folders/               # Folder management
│   │   └── login/                 # Admin login
│   ├── folder/                     # Member folder access
│   │   └── [folderId]/page.tsx   # View folder media
│   ├── api/                        # API routes
│   │   ├── auth/                  # Authentication endpoints
│   │   ├── folders/               # Folder CRUD
│   │   ├── media/                 # Media upload/delete
│   │   ├── admin/                 # Admin-only endpoints
│   │   └── swagger/               # API documentation
│   └── api-docs/                   # Swagger UI page
├── lib/
│   ├── db.ts                       # Prisma client
│   ├── auth.ts                     # JWT utilities
│   ├── cloudinary.ts               # Cloudinary API wrapper
│   ├── swagger.ts                  # OpenAPI spec
│   └── utils/                      # Helper functions
├── components/
│   ├── admin/                      # Admin-specific components
│   ├── folder/                     # Folder view components
│   └── shared/                     # Reusable components
├── types/
│   └── *.types.ts                  # TypeScript type definitions
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Migration files
└── public/                         # Static assets
```

## Database Schema Reference

### Key Tables

- `admin_users`: 3 admin credentials
- `folders`: Event folders with passwords
- `media`: Images and videos (linked to folders)
- `sessions`: JWT session tracking
- `access_logs`: Audit trail

### Important Relationships

- `media.folder_id` → `folders.id` (CASCADE delete)
- `sessions.admin_id` → `admin_users.id` (CASCADE delete)
- `access_logs.folder_id` → `folders.id` (SET NULL on delete)

## Key Features to Implement

### 1. Dual Authentication System

- **Admin Login:** Username + password → JWT with admin_id
- **Member Access:** Folder password → JWT with folder_id
- Keep sessions separate (can't use admin token for folder access)

### 2. Folder Management (Admin Only)

- Create folder with auto-generated password
- List all folders with size and metadata
- Delete folder (triggers Cloudinary cleanup)
- Update folder metadata

### 3. Media Upload (Admin Only)

- Upload to Cloudinary via REST API
- Save URL and public_id to database
- Support: JPG, PNG, GIF, MP4, MOV, WebM
- Validate file size (max 100MB per file)

### 4. Gallery View (Members + Admins)

- Responsive grid layout
- Image preview with lightbox
- Video player with controls
- Download individual files

### 5. Storage Management

- Real-time storage monitoring
- Warning notifications at 80% and 95%
- Manual folder deletion (every 3 weeks)
- Show freed storage after deletion

## API Endpoints Pattern

### Response Format

```typescript
// Success
{ data: any, ok: true }

// Error
{ error: string, code: string, ok: false }
```

### Authentication Headers

```typescript
// Admin requests
headers: {
	Authorization: `Bearer ${adminToken}`;
}

// Member/Folder requests
headers: {
	Authorization: `Bearer ${folderToken}`;
}
```

## Environment Variables

```
# Database
DATABASE_URL="file:./dev.db"  # Development
DATABASE_URL="libsql://..."    # Production (Turso)

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Authentication
JWT_SECRET=your_jwt_secret
```

## Testing Guidelines

- Test admin and member authentication separately
- Verify Cloudinary cleanup when folder is deleted
- Test storage warnings at 80% and 95% thresholds
- Test file upload with various formats and sizes
- Verify CASCADE delete for media when folder is deleted

## Performance Considerations

- Use Cloudinary CDN for fast media delivery
- Implement pagination for large media lists
- Index database queries on foreign keys
- Use React Query for caching API responses
- Lazy load images in gallery view

## User Configuration

- **Members:** 25 people (view-only access)
- **Admins:** 3 people (full management)
- **Events:** 4-6 per month (~700MB per event)
- **Storage:** ~2.1GB peak (8% of 25GB Cloudinary quota)
- **Cleanup:** Manual every 3 weeks

## Common Patterns

### Verify Admin Token

```typescript
import { verifyAdminToken } from "@/lib/auth";

export async function POST(request: Request) {
	const token = request.headers.get("Authorization")?.split(" ")[1];
	const admin = await verifyAdminToken(token);
	if (!admin) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}
	// Continue with admin-only logic
}
```

### Upload to Cloudinary

```typescript
import { uploadToCloudinary } from "@/lib/cloudinary";

const result = await uploadToCloudinary(file, folderId);
// Save result.url and result.public_id to database
```

### Delete from Cloudinary

```typescript
import { deleteFromCloudinary } from "@/lib/cloudinary";

// When deleting media
await deleteFromCloudinary(media.cloudinary_public_id);

// When deleting folder (all media)
await deleteFolder(`ohana-lens/folder-${folderId}`);
```

## Documentation

- API documentation via Swagger UI at `/api-docs`
- Keep OpenAPI spec in sync with actual endpoints
- Document all API changes in PROGRESS.md

## Deployment

- **Platform:** Vercel (auto-deploy from GitHub)
- **Database:** Turso SQLite (production)
- **Storage:** Cloudinary (25GB free tier)
- **Cost:** $0/month (all free tiers)

---

When generating code, follow these guidelines and patterns to maintain consistency across the project.
