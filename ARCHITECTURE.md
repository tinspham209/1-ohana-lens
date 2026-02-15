# System Architecture - 1 Ohana Lens

This document provides a comprehensive overview of the technical architecture, system design patterns, data flows, and infrastructure decisions for 1 Ohana Lens.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Layers](#architecture-layers)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Database Schema](#database-schema)
6. [Authentication & Authorization](#authentication--authorization)
7. [File Storage Strategy](#file-storage-strategy)
8. [API Design](#api-design)
9. [Frontend Architecture](#frontend-architecture)
10. [Security Architecture](#security-architecture)
11. [Performance Optimizations](#performance-optimizations)
12. [Deployment Architecture](#deployment-architecture)
13. [Scalability Considerations](#scalability-considerations)

---

## System Overview

**1 Ohana Lens** is a full-stack web application built with Next.js 14 that provides media management for run club events. The architecture follows a modern serverless approach with edge-optimized delivery and automatic scaling.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  (Next.js React App + Material-UI + React Query)           │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTPS/API Calls
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│        (Next.js 14 App Router + API Routes)                │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Server Components│  │  API Endpoints   │               │
│  │   (Pages/RSC)    │  │  (REST + JWT)    │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────┬───────────────┬───────────────────────────┘
                  │               │
        ┌─────────▼───────┐  ┌───▼──────────────┐
        │   Data Layer    │  │  Storage Layer   │
        │  (Prisma ORM)   │  │  (Cloudinary)    │
        └────────┬────────┘  └──────────────────┘
                 │
        ┌────────▼────────┐
        │    Database     │
        │ (SQLite/Turso)  │
        └─────────────────┘
```

### Key Design Principles

1. **Serverless-First**: No traditional server management, auto-scaling via Vercel
2. **Type Safety**: End-to-end TypeScript with Prisma for compile-time safety
3. **API-Driven**: RESTful API design with clear separation of concerns
4. **Edge Optimization**: Leverage CDN for media delivery (Cloudinary)
5. **Progressive Enhancement**: Works without JavaScript for basic content
6. **Security-First**: JWT authentication, password hashing, input validation

---

## Technology Stack

### Frontend

| Technology     | Version | Purpose                      |
| -------------- | ------- | ---------------------------- |
| Next.js        | 14.2+   | React framework (App Router) |
| React          | 18.3+   | UI library                   |
| TypeScript     | 5.0+    | Type safety                  |
| Material-UI    | 7.3+    | Component library            |
| Emotion        | 11.14+  | CSS-in-JS (MUI dependency)   |
| React Query    | 5.90+   | Data fetching & caching      |
| Zustand        | 5.0+    | State management             |
| React Dropzone | 15.0+   | File upload UI               |

| yet-another-react-lightbox | 3.29+   | Image preview                |
| react-hook-form            | 7.71+   | Form handling                |
| yup                        | 1.7+    | Form validation              |

### Backend

| Technology         | Version | Purpose               |
| ------------------ | ------- | --------------------- |
| Next.js API Routes | 14.2+   | REST API endpoints    |
| Prisma             | 7.4+    | ORM & database client |
| bcryptjs           | 3.0+    | Password hashing      |
| jsonwebtoken       | 9.0+    | JWT token generation  |
| Cloudinary         | 2.9+    | File storage & CDN    |
| Sharp              | 0.33+   | Image compression     |

### Database

| Technology | Purpose                            |
| ---------- | ---------------------------------- |
| SQLite     | Development database               |
| Turso      | Production database (cloud SQLite) |
| libsql     | Turso client adapter               |

### Development Tools

| Tool          | Purpose                                |
| ------------- | -------------------------------------- |
| ESLint        | Code linting                           |
| Prettier      | Code formatting (implicit via Next.js) |
| Prisma Studio | Database GUI                           |
| Swagger UI    | API documentation                      |
| dotenv        | Environment variable management        |

---

## Architecture Layers

### 1. Presentation Layer (Client)

**Responsibilities:**
- User interface rendering
- User interaction handling
- Client-side state management
- Form validation
- Optimistic UI updates

**Key Components:**
```
app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout (metadata, theme)
├── admin/                      # Admin-only routes
│   ├── page.tsx               # Dashboard
│   ├── login/page.tsx         # Admin login
│   └── folders/               # Folder management
│       ├── page.tsx           # Folder list + explorer
│       └── [folderId]/
│           ├── page.tsx       # Folder detail
│           └── upload/page.tsx # Upload media
├── folder/                     # Public folder access
│   ├── access/page.tsx        # Password entry
│   └── [folderId]/page.tsx    # Member gallery view
└── api-docs/page.tsx          # API documentation
```

### 2. Application Layer (Server)

**Responsibilities:**
- Request routing
- Authentication & authorization
- Business logic execution
- Data validation
- API response formatting
- Error handling

**API Structure:**
```
app/api/
├── auth/                       # Authentication endpoints
│   ├── admin-login/
│   ├── admin-logout/
│   ├── verify-password/       # Folder password check
│   └── logout/
├── folders/                    # Folder CRUD
│   ├── route.ts               # List, Create
│   └── [folderId]/
│       ├── route.ts           # Get, Update, Delete
│       ├── media/route.ts     # List folder media
│       └── metadata/route.ts  # Public folder metadata
├── media/                      # Media operations
│   ├── upload/[folderId]/     # Upload to folder
│   ├── [mediaId]/route.ts     # Delete single media
│   └── limits/route.ts        # Get Cloudinary limits
└── admin/                      # Admin-only endpoints
    ├── storage-usage/
    └── folders-by-size/
```

### 3. Data Layer (ORM)

**Responsibilities:**
- Database abstraction
- Type-safe queries
- Relationship management
- Transaction handling
- Migration management

**Prisma Client Usage:**
```typescript
import { db } from "@/lib/db";

// Type-safe queries
const folders = await db.folder.findMany({
  include: {
    media: true,
    _count: {
      select: { media: true }
    }
  }
});
```

### 4. Storage Layer (Cloudinary)

**Responsibilities:**
- File upload & storage
- CDN delivery
- Image optimization
- Video transcoding
- Asset deletion

**Integration Pattern:**
```typescript
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

// Upload with folder organization
const result = await uploadToCloudinary(fileBuffer, folderId);
// Returns: { url, public_id }

// Delete by public_id
await deleteFromCloudinary(publicId);
```

---

## Data Flow Diagrams

### 1. Admin Login Flow

```
User enters credentials
         │
         ▼
  ┌──────────────────┐
  │ POST /api/auth/  │
  │  admin-login     │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Validate input   │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Query admin user │
  │ from database    │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Compare password │
  │ with bcrypt      │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Generate JWT     │
  │ with admin_id    │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Create session   │
  │ in database      │
  └────────┬─────────┘
           │
           ▼
  Return token + admin data
         │
         ▼
  Store in localStorage
  Redirect to dashboard
```

### 2. File Upload Flow (Direct Upload)

**Architecture:** Client-side direct upload to Cloudinary to bypass Vercel's 4.5MB payload limit.

```
Admin selects files
         │
         ▼
  ┌──────────────────┐
  │ Client-side      │
  │ validation       │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ POST /api/media/ │
  │ upload-signature │ ← Get upload credentials
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Verify admin JWT │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Generate signed  │
  │ upload params    │ ← Signature, timestamp, folder
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Direct upload to │
  │ Cloudinary API   │ ← Files bypass API route
  │ (from browser)   │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Get URL &        │
  │ public_id from   │
  │ Cloudinary       │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ POST /api/media/ │
  │ save             │ ← Save metadata only
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Save to database │
  │ via Prisma       │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Update folder    │
  │ size_in_bytes    │
  └────────┬─────────┘
           │
           ▼
  Return media records
         │
         ▼
  Display in gallery
```

**Benefits:**
- ✅ Supports files up to 100MB (Cloudinary limit)
- ✅ Bypasses Vercel's 4.5MB serverless function payload limit
- ✅ Faster uploads (direct to CDN)
- ✅ Reduced serverless function execution time

### 3. Folder Access Flow (Member)

```
User visits folder link
         │
         ▼
  ┌──────────────────┐
  │ Check for token  │
  │ in URL/storage   │
  └────────┬─────────┘
           │
     No token found
           │
           ▼
  ┌──────────────────┐
  │ Redirect to      │
  │ password page    │
  └────────┬─────────┘
           │
           ▼
  User enters password
         │
         ▼
  ┌──────────────────┐
  │ POST /api/auth/  │
  │ verify-password  │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Query folder     │
  │ by folder_id     │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Compare password │
  │ with bcrypt      │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Generate JWT     │
  │ with folder_id   │
  └────────┬─────────┘
           │
           ▼
  Return token
         │
         ▼
  Store in localStorage
  Redirect to gallery
         │
         ▼
  ┌──────────────────┐
  │ GET /api/folders/│
  │ [id]/media       │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Verify folder JWT│
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Query media from │
  │ database         │
  └────────┬─────────┘
           │
           ▼
  Return media array
         │
         ▼
  Display in gallery grid
```

### 4. Delete Folder Flow

```
Admin clicks delete
         │
         ▼
  Confirmation dialog
         │
         ▼
  ┌──────────────────┐
  │ DELETE /api/     │
  │ folders/[id]     │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Verify admin JWT │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Get all media    │
  │ for folder       │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Delete from      │
  │ Cloudinary       │
  │ (batch delete)   │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Delete folder    │
  │ from database    │
  │ (CASCADE media)  │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ Log action to    │
  │ access_logs      │
  └────────┬─────────┘
           │
           ▼
  Return freed storage
         │
         ▼
  Show success toast
  Refresh folder list
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐        ┌─────────────────┐
│   admin_users   │1────*│    sessions     │
│                 │        │                 │
│ • id (PK)       │        │ • id (PK)       │
│ • username      │        │ • admin_id (FK) │
│ • passwordHash  │        │ • tokenHash     │
│ • email         │        │ • expiresAt     │
│ • isActive      │        └─────────────────┘
└─────────┬───────┘
          │1
          │
          │*
┌─────────▼───────┐
│   access_logs   │
│                 │
│ • id (PK)       │
│ • adminId (FK)  │
│ • folderId (FK) │
│ • action        │
│ • ipAddress     │
└─────────────────┘
          │*
          │
          │1
┌─────────▼───────┐        ┌─────────────────┐
│    folders      │1────*│     media       │
│                 │        │                 │
│ • id (PK)       │        │ • id (PK)       │
│ • name          │        │ • folderId (FK) │
│ • description   │        │ • fileName      │
│ • folderKey     │        │ • cloudinaryUrl │
│ • passwordHash  │        │ • publicId      │
│ • sizeInBytes   │        │ • mediaType     │
└─────────────────┘        │ • fileSize      │
                            │ • mimeType      │
                            └─────────────────┘
```

### Table Specifications

#### admin_users

| Column       | Type      | Constraints      | Description             |
| ------------ | --------- | ---------------- | ----------------------- |
| id           | UUID      | PRIMARY KEY      | Unique identifier       |
| username     | VARCHAR   | UNIQUE, NOT NULL | Login username          |
| passwordHash | VARCHAR   | NOT NULL         | Bcrypt hash (12 rounds) |
| email        | VARCHAR   | UNIQUE, NOT NULL | Admin email             |
| isActive     | BOOLEAN   | DEFAULT true     | Account status          |
| createdAt    | TIMESTAMP | DEFAULT now()    | Creation time           |
| updatedAt    | TIMESTAMP | AUTO UPDATE      | Last update time        |
| lastLogin    | TIMESTAMP | NULLABLE         | Last login timestamp    |

**Indexes:**
- Primary: `id`
- Unique: `username`, `email`

#### folders

| Column       | Type      | Constraints      | Description             |
| ------------ | --------- | ---------------- | ----------------------- |
| id           | UUID      | PRIMARY KEY      | Unique identifier       |
| name         | VARCHAR   | NOT NULL         | Folder name             |
| description  | TEXT      | NULLABLE         | Event description       |
| folderKey    | UUID      | UNIQUE, NOT NULL | URL-safe identifier     |
| passwordHash | VARCHAR   | NOT NULL         | Bcrypt hash (12 rounds) |
| sizeInBytes  | BIGINT    | DEFAULT 0        | Total media size        |
| createdAt    | TIMESTAMP | DEFAULT now()    | Creation time           |
| updatedAt    | TIMESTAMP | AUTO UPDATE      | Last update time        |

**Indexes:**
- Primary: `id`
- Unique: `folderKey`

#### media

| Column             | Type      | Constraints           | Description         |
| ------------------ | --------- | --------------------- | ------------------- |
| id                 | UUID      | PRIMARY KEY           | Unique identifier   |
| folderId           | UUID      | FOREIGN KEY, NOT NULL | Parent folder       |
| fileName           | VARCHAR   | NOT NULL              | Original filename   |
| cloudinaryUrl      | VARCHAR   | NOT NULL              | CDN URL             |
| cloudinaryPublicId | VARCHAR   | NOT NULL              | Cloudinary asset ID |
| mediaType          | VARCHAR   | NOT NULL              | 'image' or 'video'  |
| fileSize           | BIGINT    | NOT NULL              | File size in bytes  |
| mimeType           | VARCHAR   | NOT NULL              | MIME type           |
| uploadedAt         | TIMESTAMP | DEFAULT now()         | Upload time         |

**Indexes:**
- Primary: `id`
- Foreign: `folderId` (CASCADE delete)

#### sessions

| Column    | Type      | Constraints           | Description       |
| --------- | --------- | --------------------- | ----------------- |
| id        | UUID      | PRIMARY KEY           | Unique identifier |
| adminId   | UUID      | FOREIGN KEY, NOT NULL | Admin user        |
| tokenHash | VARCHAR   | NOT NULL              | Hashed JWT        |
| expiresAt | TIMESTAMP | NOT NULL              | Expiration time   |
| createdAt | TIMESTAMP | DEFAULT now()         | Creation time     |

**Indexes:**
- Primary: `id`
- Foreign: `adminId` (CASCADE delete)

#### access_logs

| Column    | Type      | Constraints           | Description       |
| --------- | --------- | --------------------- | ----------------- |
| id        | UUID      | PRIMARY KEY           | Unique identifier |
| adminId   | UUID      | FOREIGN KEY, NULLABLE | Admin user        |
| folderId  | UUID      | FOREIGN KEY, NULLABLE | Folder accessed   |
| action    | VARCHAR   | NOT NULL              | Action performed  |
| ipAddress | VARCHAR   | NULLABLE              | Client IP         |
| userAgent | VARCHAR   | NULLABLE              | Client user agent |
| createdAt | TIMESTAMP | DEFAULT now()         | Log time          |

**Indexes:**
- Primary: `id`
- Foreign: `adminId` (SET NULL on delete)
- Foreign: `folderId` (SET NULL on delete)

---

## Authentication & Authorization

### JWT Token Strategy

**Dual Authentication System:**

1. **Admin Tokens** - Full system access
   - Contains: `admin_id`, `username`, `email`
   - Expiry: 7 days
   - Stored: localStorage (client)
   - Usage: All admin endpoints

2. **Folder Tokens** - Single folder access
   - Contains: `folder_id`, `folder_key`
   - Expiry: 7 days
   - Stored: localStorage (client)
   - Usage: Folder media viewing only

### Token Generation

```typescript
// lib/auth.ts
import jwt from "jsonwebtoken";

export function generateAdminToken(adminId: string, username: string, email: string): string {
  return jwt.sign(
    { admin_id: adminId, username, email, type: "admin" },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );
}

export function generateFolderToken(folderId: string, folderKey: string): string {
  return jwt.sign(
    { folder_id: folderId, folder_key: folderKey, type: "folder" },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );
}
```

### Token Verification

```typescript
export async function verifyAdminToken(token: string | null): Promise<AdminPayload | null> {
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (decoded.type !== "admin") return null;
    return decoded as AdminPayload;
  } catch {
    return null;
  }
}
```

### Password Security

**Hashing:**
- Algorithm: bcrypt
- Rounds: 12 (development), 12 (production)
- Salt: Auto-generated per password

**Password Requirements:**
- Admin: Managed manually (no requirements enforced)
- Folder: 8-character auto-generated (alphanumeric + special)

---

## File Storage Strategy

### Cloudinary Organization

**Folder Structure:**
```
ohana-lens/
├── folder-{uuid}/
│   ├── image1.jpg
│   ├── video1.mp4
│   └── ...
├── folder-{uuid}/
│   └── ...
```

**Benefits:**
- Easy bulk deletion by folder prefix
- Organized asset management
- Prevents naming conflicts

### Upload Process

```typescript
// lib/cloudinary.ts
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folderId: string,
  fileName: string
): Promise<{ url: string; public_id: string }> {
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: `${process.env.CLOUDINARY_FOLDER_NAME}/folder-${folderId}`,
      resource_type: "auto", // Auto-detect image/video
      quality: "auto:eco", // Optimize for bandwidth
      fetch_format: "auto", // Serve best format (WebP, AVIF)
      transformation: [
        { quality: "auto" },
        { fetch_format: "auto" }
      ]
    },
    (error, result) => {
      // Handle upload complete
    }
  );
  
  // Stream buffer to Cloudinary
  return uploadResult;
}
```

### Optimization Strategy

**Images:**
- Auto-format: WebP (Chrome), AVIF (modern), JPEG (fallback)
- Auto-quality: Smart compression based on content
- Responsive: srcset with 300w, 600w, 900w, 1200w
- Thumbnails: 400x400 for grid, 1000x1000 for lightbox

**Videos:**
- Format: MP4 (H.264)
- Poster frame: Auto-generated from 1st second
- Streaming: Adaptive bitrate delivery

### Deletion Process

```typescript
// Delete single file
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

// Delete entire folder
export async function deleteFolder(folderPath: string): Promise<void> {
  await cloudinary.api.delete_resources_by_prefix(folderPath);
  await cloudinary.api.delete_folder(folderPath);
}
```

---

## API Design

### REST Principles

1. **Resource-based URLs:** `/api/folders`, `/api/media`
2. **HTTP verbs:** GET (read), POST (create), PATCH (update), DELETE (delete)
3. **Status codes:** 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Server Error)
4. **JSON responses:** Consistent format with `{ ok, data/error }`

### Response Format

**Success:**
```json
{
  "ok": true,
  "data": { /* response data */ }
}
```

**Error:**
```json
{
  "ok": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Endpoint Patterns

#### CRUD Operations

```typescript
// GET /api/folders - List all
export async function GET(request: Request) {
  const admin = await verifyAdminToken(getToken(request));
  if (!admin) return unauthorized();
  
  const folders = await db.folder.findMany();
  return Response.json({ ok: true, data: folders });
}

// POST /api/folders - Create
export async function POST(request: Request) {
  const admin = await verifyAdminToken(getToken(request));
  if (!admin) return unauthorized();
  
  const body = await request.json();
  const folder = await db.folder.create({ data: body });
  return Response.json({ ok: true, data: folder }, { status: 201 });
}

// PATCH /api/folders/[id] - Update
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await verifyAdminToken(getToken(request));
  if (!admin) return unauthorized();
  
  const body = await request.json();
  const folder = await db.folder.update({
    where: { id: params.id },
    data: body
  });
  return Response.json({ ok: true, data: folder });
}

// DELETE /api/folders/[id] - Delete
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await verifyAdminToken(getToken(request));
  if (!admin) return unauthorized();
  
  await db.folder.delete({ where: { id: params.id } });
  return Response.json({ ok: true, data: { message: "Deleted" } });
}
```

---

## Frontend Architecture

### Component Structure

```
components/
├── admin/                  # Admin-only components
│   ├── DeleteFolderDialog.tsx
│   ├── FolderExplorer.tsx
│   ├── FolderFormDialog.tsx
│   └── StorageWarning.tsx
├── folder/                 # Folder view components
│   ├── AdminMediaGrid.tsx # Media grid with delete
│   ├── MediaGrid.tsx      # Read-only media grid
│   ├── ImageLightbox.tsx  # Image preview modal
│   └── VideoPlayer.tsx    # Video playback modal
├── shared/                 # Reusable components
│   └── PasswordField.tsx
├── ErrorBoundary.tsx
├── FileUploadZone.tsx
├── MUIThemeProvider.tsx
└── SwaggerUiClient.tsx
```

### State Management

**React Query:**
- API data caching
- Automatic refetch on window focus
- Optimistic updates
- Background refetch

**Zustand:**
- Minimal client state
- Toast notifications
- UI preferences

**Example:**
```typescript
// Using React Query
const { data: folders, isLoading } = useQuery({
  queryKey: ["folders"],
  queryFn: async () => {
    const res = await fetch("/api/folders");
    return res.json();
  }
});

// Using Zustand
const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => set((state) => ({ toasts: [...state.toasts, toast] })),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }))
}));
```

### Routing Strategy

**App Router (Next.js 14):**
- File-based routing
- Server components by default
- Client components: `"use client"` directive
- Nested layouts for shared UI
- Dynamic routes: `[folderId]`

---

## Security Architecture

### Threat Model

**Threats Mitigated:**
1. Unauthorized access to admin panel ✓ JWT validation
2. Unauthorized folder access ✓ Password + JWT
3. SQL injection ✓ Prisma parameterized queries
4. XSS attacks ✓ React auto-escaping + CSP headers
5. CSRF attacks ✓ SameSite cookies (future)
6. File upload attacks ✓ Type & size validation
7. Token theft ✓ HttpOnly cookies (future improvement)

### Security Measures

**Input Validation:**
```typescript
// Server-side validation
if (!body.name || body.name.length > 255) {
  return Response.json({ error: "Invalid name" }, { status: 400 });
}
```

**SQL Injection Prevention:**
- Prisma ORM with parameterized queries
- No raw SQL execution

**File Upload Security:**
- MIME type validation: `['image/jpeg', 'image/png', 'video/mp4']`
- File size limits: 100MB max
- Cloudinary scans for malware

**Rate Limiting** (Future):
- Admin login: 5 attempts per 15 minutes
- Folder access: 10 attempts per 15 minutes
- API endpoints: 100 requests per minute

---

## Performance Optimizations

### Image Optimization

**Cloudinary Transformations:**
```typescript
// Thumbnail for grid (400x400, auto-quality, auto-format)
const thumbnailUrl = `${baseUrl}/w_400,h_400,c_fill,q_auto,f_auto/${publicId}`;

// Preview for lightbox (1000x1000)
const previewUrl = `${baseUrl}/w_1000,h_1000,c_limit,q_auto,f_auto/${publicId}`;

// Responsive srcset
const srcset = [300, 600, 900, 1200]
  .map(w => `${baseUrl}/w_${w},q_auto,f_auto/${publicId} ${w}w`)
  .join(", ");
```

**Benefits:**
- 60-70% bandwidth reduction
- Faster page loads
- Automatic format conversion (WebP, AVIF)

### React Query Caching

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true
    }
  }
});
```

### Code Splitting

- Automatic route-based splitting (Next.js)
- Dynamic imports for heavy components
- Lazy loading of images

---

## Deployment Architecture

### Vercel Platform

```
┌─────────────────────────────────────────────┐
│         Vercel Edge Network (CDN)           │
│  ┌───────────────────────────────────────┐  │
│  │  Static Assets (/_next/static/*)      │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │  Serverless Functions (API Routes)    │  │
│  │  Auto-scaling, ~deploy per request    │  │
│  └───────────────────────────────────────┘  │
└─────────────────┬───────────────────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
┌──────────────┐      ┌──────────────┐
│ Turso DB     │      │ Cloudinary   │
│ (SQLite)     │      │ (CDN)        │
└──────────────┘      └──────────────┘
```

### Build Process

1. **Build command:** `npm run build`
2. **Output:** `.next` directory
3. **Static generation:** Pre-render static pages
4. **Server components:** Bundle for serverless functions
5. **Environment variables:** Inject from Vercel dashboard

### Environment Variables (Production)

```bash
DATABASE_URL=libsql://your-db.turso.io
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=123456
CLOUDINARY_API_SECRET=abc123
JWT_SECRET=production_secret_64_chars
COMPRESS_IMAGES=true
```

---

## Scalability Considerations

### Current Limits

- **Users:** 25 members + 3 admins
- **Folders:** ~6 per month = 72 per year
- **Storage:** 25GB (Cloudinary free tier)
- **Requests:** 500 per 5 min (Cloudinary rate limit)

### Scaling Strategy

**Phase 1 (Current):** Manual cleanup every 3 weeks

**Phase 2 (100+ members):**
- Implement pagination for folder lists
- Add search/filter for folders
- Lazy load media in gallery (virtual scrolling)

**Phase 3 (1000+ members):**
- Upgrade Cloudinary plan (100GB+)
- Implement auto-deletion based on age
- Add CDN caching headers
- Implement Redis for session storage

**Phase 4 (10,000+ members):**
- Multi-region database (Turso replicas)
- Edge functions for low-latency
- Separate admin API from public API
- Implement webhook-based cleanup

---

## Monitoring & Observability

### Current Logging

- Server-side: `console.error` for errors
- Client-side: ErrorBoundary component
- Database: Access logs table

### Future Improvements

- **Error tracking:** Sentry integration
- **Analytics:** Vercel Analytics
- **Performance:** Web Vitals monitoring
- **Uptime:** StatusPage.io
- **Database:** Turso query metrics

---

## Appendix

### Useful Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Cloudinary Upload API](https://cloudinary.com/documentation/image_upload_api_reference)
- [Vercel Deployment](https://vercel.com/docs)

### Glossary

| Term | Definition                                            |
| ---- | ----------------------------------------------------- |
| JWT  | JSON Web Token - used for authentication              |
| ORM  | Object-Relational Mapping - database abstraction      |
| CDN  | Content Delivery Network - fast global file delivery  |
| RSC  | React Server Components - server-rendered React       |
| SSR  | Server-Side Rendering - HTML generated on server      |
| SSG  | Static Site Generation - HTML pre-built at build time |
| ISR  | Incremental Static Regeneration - SSG with updates    |

---

**Last Updated:** February 15, 2026  
**Version:** 1.0.0  
**Maintainer:** Project Team
