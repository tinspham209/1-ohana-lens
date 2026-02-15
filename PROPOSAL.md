# 1 Ohana Lens - Project Proposal

## Project Overview
**1 Ohana Lens** is a media management application designed for organizing run club photos and videos. It provides a simple, password-protected storage solution where admins can create folders and manage media organized by run events, with members accessing shared folders via secure links.

**Target Users:** Run club members (admin/members)  
**Primary Use Case:** Post-run media sharing and archival  
**Security Level:** Simple (password-based, not encryption-heavy)

---

## Key Features

### Core Features
1. **Folder Management**
   - Create, edit, delete folders (admin only)
   - Auto-generate unique folder IDs
   - One-time password generation per folder
   - Folder metadata (date, event name, description)

2. **Media Upload & Storage**
   - Batch upload images and videos
   - Support: JPG, PNG, GIF, MP4, MOV, WebM
   - Automatic thumbnail generation
   - File size validation (recommended: up to 500MB per file)

3. **Media Browsing & Preview**
   - Gallery/grid view with responsive layout
   - In-browser image preview
   - Video player with playback controls
   - Metadata display (upload date, file size)

4. **Access Control**
   - Admin dashboard (manage folders, passwords, analytics)
   - Support for multiple admins (3 admin users in your case)
   - Share folder via unique link + password (members)
   - Session-based access (remember login for 7 days)
   - No user registration required (password-based only)

5. **Additional Features**
   - Download individual media
   - Bulk download as ZIP (if storage quota allows)
   - Real-time storage monitoring (admin dashboard)
   - Storage warning notifications:
     - Toast alert at 80% of quota (yellow warning)
     - Critical alert at 95% of quota (red warning)
     - Cleanup confirmation when folder deleted
   - Access logs (view folder access history)
   - Responsive design (mobile-friendly)
   - SEO Optimization:
     - Favicon for browser tabs and shortcuts
     - Open Graph meta tags for social media sharing
     - Twitter Card support for better link previews
     - Canonical URL for search engines
     - Descriptive meta titles and descriptions
     - Dynamic Metadata per Folder:
       - Folder name appears in page title when sharing folder links
       - Folder description in meta description for rich previews
       - Open Graph metadata generated dynamically from folder data
       - Social media preview shows folder-specific information

---

## Recommended Tech Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **UI Library:** Material-UI (MUI v5+)
- **State Management:** Zustand (lightweight, minimal boilerplate)
- **Data Fetching:** React Query v5+ (TanStack Query)
- **File Upload:** React Dropzone (drag & drop with validation)
- **Image Lightbox:** yet-another-react-lightbox (modal gallery preview)
- **Video Player:** Native HTML5 video element (multi-format support: MP4, MOV, WebM)
- **Styling:** MUI sx prop + CSS modules

### Backend
- **Runtime:** Next.js 14+ API Routes (built-in, no separate server)
- **ORM:** Prisma (type-safe database access)
- **File Storage:** Cloudinary REST API (25GB free/month)
- **Authentication:** JWT + bcrypt (password hashing)

### Database
- **Development:** SQLite (local file, zero setup)
- **Production:** Turso SQLite (cloud-hosted, free tier: unlimited databases, 8GB/day usage)
- **ORM:** Prisma (works with both)

---

## Implementation Overview

### How It Works

**File Upload Flow:**
```
User selects file from device
  ↓
Frontend sends POST /api/media/upload/:folderId
  ↓
Next.js API Route:
  - Validates file (size, type)
  - Creates FormData with file
  - POSTs to Cloudinary REST API
  - Cloudinary returns: { secure_url, public_id }
  ↓
Prisma saves to SQLite/Turso:
  {
    id: UUID,
    folder_id: "folder-123",
    cloudinary_url: "https://res.cloudinary.com/.../image.jpg",
    cloudinary_public_id: "ohana-lens/folder-123/photo",
    file_name: "photo.jpg",
    uploaded_at: timestamp,
    media_type: "image"
  }
  ↓
Return to frontend with optimized URL
```

**Viewing Media in Folder:**
```
User accesses folder link: /folder/abc?token=xyz
  ↓
Frontend calls GET /api/folders/abc/media
  ↓
Prisma queries SQLite/Turso
  ↓
Return Cloudinary URLs to frontend
  ↓
Frontend renders gallery with fast-loading optimized media
```

**Admin Cleanup (Every 3 Weeks):**
```
Admin deletes folder from dashboard
  ↓
API receives DELETE request
  ↓
Prisma deletes media records from database
  ↓
API calls Cloudinary to delete all files in folder
  ↓
Storage freed up, stay under 25GB limit
```

### Storage Management Strategy

```
Week 1:    Upload Run Event 1 (2-5GB) → Total: 2-5GB
Week 2:    Upload Run Event 2 (2-5GB) → Total: 4-10GB
Week 3:    Upload Run Event 3 (2-5GB) → Total: 6-15GB
Week 4:    Delete Event 1 (oldest) → Total: 4-10GB ← Stay under 25GB
Week 5:    Upload Run Event 4 (2-5GB) → Total: 6-15GB
...continues rotating every 3 weeks...
```

---

## Cloudinary Storage Setup

- **Cost:** Completely FREE tier with 25GB/month
- **Upload Limit:** 100MB per file (free tier)
- **Retention:** Permanent (you control via manual deletion)
- **Features:** Image/video optimization, CDN, responsive delivery, easy API
- **URL:** https://cloudinary.com

**Setup:**
1. Sign up at cloudinary.com (free tier, no credit card)
2. Get Cloud Name, API Key, API Secret
3. Add to Vercel environment variables
4. Use REST API in Next.js to upload and delete files

---

## Recommended Architecture (MVP - Finalized)

```
Frontend Stack:
  ├── Next.js 14+ (App Router)
  ├── Material-UI v5+ (components)
  ├── Zustand (state management)
  ├── React Query v5+ (data fetching)
  ├── React Dropzone (file upload)
  ├── yet-another-react-lightbox (image preview)
  └── Native HTML5 video element (video playback)

Backend Stack:
  ├── Next.js 14+ API Routes (no separate server)
  ├── Prisma ORM (type-safe database)
  ├── Cloudinary REST API (file storage)
  └── JWT + bcrypt (authentication)

Database:
  - Development: SQLite (local .db file)
  - Production: Turso SQLite (cloud)
  - Both: Configured via Prisma

Hosting:
  - Frontend/Backend: Vercel (free tier)
  - Database: Turso (free tier)
  - Storage: Cloudinary (free 25GB/month tier)

Total Cost:       FREE
Setup Time:       ~1 hour
Development Time: 1-2 weeks
```

**Key Architecture Benefits:**
- ✅ No separate backend server (everything in Next.js)
- ✅ Type-safe database access with Prisma
- ✅ Seamless SQLite → Turso migration (same schema)
- ✅ Zero DevOps overhead (managed hosting)
- ✅ All free tiers with generous limits
- ✅ Perfect for small run club team

**Storage Rotation Workflow:**
```
1. Create folder → Generate password → Get unique folder_id
2. Upload media → Cloudinary stores files → Save URLs to DB
3. Every 3 weeks → Admin deletes oldest folder
   - Delete all media records from database
   - Delete all files from Cloudinary (via API)
   - Storage freed up, stay under 25GB limit
```

**File Structure:**
```
1-ohana-lens/
├── app/
│   ├── page.tsx (public folder access)
│   ├── admin/ (admin dashboard)
│   └── api/
│       ├── auth/
│       │   └── verify-password (password check)
│       ├── folders/
│       │   ├── route.ts (admin CRUD)
│       │   └── [folderId]/
│       │       └── route.ts (list media)
│       └── media/
│           ├── upload (handle Cloudinary upload)
│           ├── [mediaId]/
│           │   └── delete (remove from DB + Cloudinary)
│           └── stats (storage usage)
├── lib/
│   ├── db.ts (Prisma SQLite)
│   ├── auth.ts (JWT, password hashing)
│   └── cloudinary.ts (Cloudinary API wrapper)
└── components/
    └── (MUI components)
```

**Key Implementation: Cloudinary Storage Management**
```typescript
// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

// Track which files belong to which folder
// So we can delete them all when folder is deleted
export async function deleteFolder(folderId: string, mediaIds: string[]) {
  // Delete from Cloudinary (using public_ids)
  for (const publicId of mediaIds) {
    await cloudinary.uploader.destroy(publicId);
  }
  
  // Delete from database
  await db.media.deleteByFolder(folderId);
  await db.folders.delete(folderId);
  
  console.log(`Deleted folder ${folderId}, freed storage`);
}

// Monitor storage usage
export async function getStorageUsage() {
  const result = await cloudinary.api.resource_count();
  return {
    total_bytes: result.used_storage,
    total_gb: result.used_storage / (1024 * 1024 * 1024),
    percent_of_quota: (result.used_storage / (25 * 1024 * 1024 * 1024)) * 100
  };
}
```

**API Endpoints (Minimal CRUD):**
```typescript
// POST /api/auth/verify-password
// Verify folder password, return JWT token

// POST /api/folders/create
// Admin: create folder with name + password

// GET /api/folders/[folderId]/media
// Fetch all media in folder

// POST /api/media/upload
// Proxy upload to Cloudinary → save URL to DB

// DELETE /api/folders/[folderId]
// Delete ALL media in folder (Cloudinary + DB), free storage

// GET /api/admin/storage-usage
// Show current storage (admin dashboard)
```

---

## Development Phases (Completed)

### Phase 1: Setup & Database ✅
- [x] Create Next.js project with TypeScript
- [x] Setup database (SQLite local for development, Turso for production)
- [x] Create database schema (folders, media, sessions) using Prisma
- [x] Setup environment variables (Cloudinary API, Turso database URL)

### Phase 2: Authentication ✅
- [x] Implement password hashing (bcrypt)
- [x] Create JWT token generation
- [x] Build admin login page (Material-UI form)
- [x] Add API route: POST /api/auth/verify-password

### Phase 3: Admin Folder Management ✅
- [x] Create admin dashboard (list folders)
- [x] Add create folder form (name + auto-generate password)
- [x] Implement delete folder function
- [x] API routes: POST/DELETE /api/folders

### Phase 4: File Upload Pipeline ✅
- [x] Integrate Cloudinary REST API for file uploads
- [x] Create file upload form (drag & drop with React Dropzone)
- [x] Upload files to Cloudinary, save URLs to Prisma database
- [x] API route: POST /api/media/upload (Cloudinary integration)
- [x] Automatic image compression for large files
- [x] Media limits validation (size, dimensions, rate limits)

### Phase 5: Gallery & Preview ✅
- [x] Build responsive gallery grid (Material-UI Grid)
- [x] Add image lightbox preview with yet-another-react-lightbox
- [x] Add video player (native HTML5 video)
- [x] Lazy loading and image optimization

### Phase 6: Admin Cleanup Operations ✅
- [x] Implement manual folder deletion (triggered by admin)
- [x] Delete all media files from Cloudinary when folder is deleted
- [x] Clean up database records using Prisma cascade delete
- [x] Delete individual media files from folder view
- [x] Real-time storage calculation and updates

### Phase 7: Polish & Deploy ✅
- [x] Implement storage warning notifications (toast/banners at 80% and 95%)
- [x] Mobile responsiveness testing and optimization
- [x] Error handling & user feedback (ErrorBoundary, toasts)
- [x] Security implementation (JWT validation, password hashing)
- [x] Form validation with react-hook-form and yup
- [x] SEO optimization (metadata, Open Graph tags, favicon)
- [x] Cloudinary optimization (auto-format, auto-quality, responsive images)
- [x] API documentation with Swagger UI
- [x] Admin UI polish with FolderExplorer component
- [x] Ready for Vercel deployment

---

## Detailed Implementation: Cloudinary Integration

### How It Works

**1. File Upload Flow**
```
User selects file from device
  ↓
Frontend sends POST /api/media/upload/:folderId
  ↓
Next.js API Route:
  - Validates file (size, type)
  - Creates FormData with file
  - POSTs to Cloudinary API
  - Cloudinary returns: { 
      secure_url: "https://res.cloudinary.com/.../image.jpg",
      public_id: "ohana-lens/folder-123/photo"
    }
  ↓
Save to database:
  {
    id: UUID,
    folder_id: "folder-123",
    cloudinary_url: "https://res.cloudinary.com/.../image.jpg",
    cloudinary_public_id: "ohana-lens/folder-123/photo",
    file_name: "photo.jpg",
    uploaded_at: timestamp,
    media_type: "image",
    file_size: 2500000
  }
  ↓
Return to frontend with optimized URL
```

**2. Viewing Media in Folder**
```
User accesses folder link: /folder/abc?token=xyz
  ↓
Frontend calls GET /api/folders/abc/media
  ↓
Next.js API Route:
  1. Verify JWT token (user has permission)
  2. Fetch all media records from database
  3. Return Cloudinary URLs (no validation needed - Cloudinary hosts files)
  4. Cloudinary CDN delivers images/videos with optimization
  ↓
Frontend renders gallery with fast-loading optimized media
```

**3. Storage Cleanup (Every 3 Weeks)**
```
Admin goes to dashboard → Folders page
  ↓
Sees list of folders + their storage sizes
  ↓
Clicks "Delete" on oldest folder
  ↓
API receives DELETE request:
  1. Get all media records for that folder
  2. Delete each file from Cloudinary (using public_id)
  3. Delete all media records from database
  4. Delete folder record from database
  ↓
Storage freed up, stay under 25GB limit
  ↓
Example: After deleting a 5GB folder, usage drops from 20GB → 15GB
```

### Cloudinary Integration Setup

**1. Create Cloudinary Account**
```
- Sign up at https://cloudinary.com
- Get API Key & API Secret
- Free tier: 25GB/month
```

**2. Environment Variables**
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**3. Organize Files in Cloudinary**
```
Use folder structure to organize by run event:
- ohana-lens/folder-123/photo-001.jpg
- ohana-lens/folder-123/photo-002.jpg
- ohana-lens/folder-456/video-001.mp4

This makes it easy to delete entire folders at once
```

### Sample Next.js Implementation

**lib/cloudinary.ts**
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(
  file: File,
  folderId: string
): Promise<{
  url: string;
  public_id: string;
  size: number;
}> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const folder_path = `ohana-lens/${folderId}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folder_path, resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            size: result.bytes,
          });
      }
    );
    stream.write(buffer);
    stream.end();
  });
}

export async function deleteFromCloudinary(public_id: string) {
  await cloudinary.uploader.destroy(public_id, {
    resource_type: 'auto',
  });
}

export async function deleteFolder(folder_path: string) {
  // Delete all files in folder
  await cloudinary.api.delete_resources_by_prefix(folder_path);
}

export async function getStorageUsage() {
  const result = await cloudinary.api.resource_count();
  const bytes = result.used_storage || 0;
  const gb = bytes / (1024 * 1024 * 1024);
  const percent = (gb / 25) * 100;

  return {
    bytes,
    gb: parseFloat(gb.toFixed(2)),
    percent_of_quota: parseFloat(percent.toFixed(1)),
    status: percent > 80 ? 'warning' : 'ok',
  };
}
```

**app/api/media/upload/route.ts**
```typescript
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const folderId = request.nextUrl.searchParams.get('folderId');

  // Verify auth token
  const token = request.headers.get('authorization');
  // ... validate token ...

  // Validate file
  if (file.size > 100 * 1024 * 1024) {
    // 100MB limit
    return Response.json(
      { error: 'File too large' },
      { status: 400 }
    );
  }

  try {
    // Upload to Cloudinary
    const { url, public_id, size } = await uploadToCloudinary(file, folderId);

    // Save to database
    const media = await db.media.create({
      folder_id: folderId,
      cloudinary_url: url,
      cloudinary_public_id: public_id,
      file_name: file.name,
      file_size: size,
      media_type: file.type.startsWith('video') ? 'video' : 'image',
    });

    return Response.json({
      id: media.id,
      url: url,
      public_id: public_id,
    });
  } catch (error) {
    return Response.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

**app/api/folders/[folderId]/delete/route.ts**
```typescript
import { deleteFromCloudinary, deleteFolder } from '@/lib/cloudinary';

export async function DELETE(
  request: Request,
  { params }: { params: { folderId: string } }
) {
  // Verify admin token
  const token = request.headers.get('authorization');
  // ... validate token ...

  try {
    // Get all media in folder
    const mediaList = await db.media.findByFolder(params.folderId);

    // Delete from Cloudinary
    for (const media of mediaList) {
      await deleteFromCloudinary(media.cloudinary_public_id);
    }

    // Alternative: Delete entire folder at once (faster)
    // await deleteFolder(`ohana-lens/${params.folderId}`);

    // Delete from database
    await db.media.deleteByFolder(params.folderId);
    await db.folders.delete(params.folderId);

    return Response.json({
      ok: true,
      message: `Folder deleted, storage freed`,
    });
  } catch (error) {
    return Response.json(
      { error: 'Delete failed' },
      { status: 500 }
    );
  }
}
```

**app/api/admin/storage-usage/route.ts**
```typescript
import { getStorageUsage } from '@/lib/cloudinary';

export async function GET(request: Request) {
  // Verify admin token
  const token = request.headers.get('authorization');
  // ... validate token ...

  try {
    const usage = await getStorageUsage();

    return Response.json({
      current_gb: usage.gb,
      quota_gb: 25,
      percent_used: usage.percent_of_quota,
      status: usage.status, // 'ok' or 'warning'
      recommendation:
        usage.percent_of_quota > 80 ? 'Delete oldest folder soon' : 'OK',
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
```

### Storage Monitoring Dashboard (Admin View)

**What Admin Sees:**
```
Storage Usage:
┌─────────────────────────────────────┐
│ Current: 15.5GB / 25GB (62% used)   │
└─────────────────────────────────────┘

Folders (By Date - Newest First):
┌────────────────────────────────────────────────┐
│ Run Event #5 (Feb 14)    5.2GB  [Delete]       │
│ Run Event #4 (Feb 7)     4.8GB  [Delete]       │
│ Run Event #3 (Jan 31)    3.1GB  [Delete]       │
│ Run Event #2 (Jan 24)    2.4GB  [Delete]       │
│ Run Event #1 (Jan 17)    - DELETED -           │
└────────────────────────────────────────────────┘

Cleanup Workflow:
Week 3-4: Delete "Run Event #1" (oldest)
  - Frees 5GB
  - New total: 15.5GB - 5GB = 10.5GB
  - Ready for new event
```

### Monitoring & Alerts

**Admin Dashboard - Real-time Storage Display:**
```typescript
// app/admin/dashboard/page.tsx
import { useState, useEffect } from 'react';
import { Alert, AlertTitle } from '@mui/material';

export default function AdminDashboard() {
  const [storage, setStorage] = useState(null);

  useEffect(() => {
    // Fetch storage usage on page load
    fetch('/api/admin/storage-usage')
      .then(r => r.json())
      .then(data => setStorage(data));
  }, []);

  if (!storage) return <div>Loading...</div>;

  return (
    <div>
      {/* Yellow warning: approaching limit */}
      {storage.percent_used > 80 && storage.percent_used <= 95 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>⚠️ Storage Warning</AlertTitle>
          Storage at {storage.percent_used}% ({storage.current_gb}GB / 25GB).
          Plan to delete oldest folder within the next week.
        </Alert>
      )}

      {/* Red critical warning: near limit */}
      {storage.percent_used > 95 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>🚨 Critical Storage Alert</AlertTitle>
          Storage at {storage.percent_used}% ({storage.current_gb}GB / 25GB).
          DELETE oldest folder immediately to free space!
        </Alert>
      )}

      {/* Success: storage is fine */}
      {storage.percent_used <= 80 && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ Storage OK - {storage.percent_used}% used ({storage.current_gb}GB / 25GB)
        </Alert>
      )}

      <StorageProgressBar
        current={storage.current_gb}
        quota={storage.quota_gb}
        percent={storage.percent_used}
      />

      <FolderManagementTable />
    </div>
  );
}
```

**Automated Backend Checks:**
```typescript
// lib/storageAlerting.ts
// Run on-demand when admins view dashboard or via scheduled task

export async function checkStorageQuota() {
  const usage = await getStorageUsage();
  
  return {
    percent_used: usage.percent_of_quota,
    current_gb: usage.gb,
    quota_gb: 25,
    status: 
      usage.percent_of_quota > 95 ? 'CRITICAL' :
      usage.percent_of_quota > 80 ? 'WARNING' :
      'OK',
    action: 
      usage.percent_of_quota > 95 ? 'Delete oldest folder NOW' :
      usage.percent_of_quota > 80 ? 'Plan to delete oldest folder this week' :
      'None needed'
  };
}

// Delete folder with success notification
export async function deleteOldestFolder(folderId: string) {
  const beforeUsage = await getStorageUsage();
  
  // Delete from Cloudinary and database
  await deleteFolder(folderId);
  
  const afterUsage = await getStorageUsage();
  const freedGb = (beforeUsage.gb - afterUsage.gb).toFixed(1);
  
  return {
    success: true,
    message: `✅ Folder deleted! Freed ${freedGb}GB.`,
    new_usage: afterUsage.percent_of_quota,
    new_status: afterUsage.percent_of_quota > 80 ? 'WARNING' : 'OK'
  };
}
```

**Frontend Toast Notifications (MUI Snackbar):**
```typescript
// app/admin/dashboard/FolderActions.tsx
import { useSnackbar } from 'notistack'; // or use MUI Snackbar

export function FolderActions() {
  const { enqueueSnackbar } = useSnackbar();

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const result = await response.json();
      
      // Show success toast
      enqueueSnackbar(result.message, {
        variant: 'success',
        autoHideDuration: 5000
      });
      
      // Toast clears automatically after 5 seconds
    } catch (error) {
      enqueueSnackbar('Failed to delete folder', {
        variant: 'error',
        autoHideDuration: 5000
      });
    }
  };
  
  return (
    // Folder delete buttons with onClick handlers
  );
}
```

---

## Database Schema (SQLite via Prisma - Development & Production)

```sql
-- Folders Table
CREATE TABLE folders (
  id TEXT PRIMARY KEY,           -- UUID
  name VARCHAR NOT NULL,
  description TEXT,
  folder_key VARCHAR UNIQUE,     -- URL-friendly key for sharing
  password_hash VARCHAR NOT NULL, -- bcrypt hashed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  size_in_bytes BIGINT DEFAULT 0 -- Track folder size for cleanup planning
);

-- Admin Users Table (Multi-admin support - 3 admins)
CREATE TABLE admin_users (
  id TEXT PRIMARY KEY,           -- UUID
  username VARCHAR NOT NULL UNIQUE,
  password_hash VARCHAR NOT NULL, -- bcrypt hashed
  email VARCHAR UNIQUE,          -- Optional, for password recovery
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Media Table
CREATE TABLE media (
  id TEXT PRIMARY KEY,                   -- UUID
  folder_id TEXT NOT NULL,                -- FK to folders.id
  file_name VARCHAR NOT NULL,
  cloudinary_url VARCHAR NOT NULL,        -- The Cloudinary CDN URL
  cloudinary_public_id VARCHAR NOT NULL,  -- For deletion (e.g., "ohana-lens/folder-123/photo")
  media_type VARCHAR,                     -- 'image' or 'video'
  file_size BIGINT,                       -- in bytes (metadata)
  mime_type VARCHAR,                      -- e.g., 'image/jpeg'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
  INDEX idx_folder_id (folder_id)         -- For faster queries
);

-- Sessions Table (For better security & multi-admin tracking)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,          -- FK to admin_users.id (tracks which admin is logged in)
  token_hash VARCHAR NOT NULL,  -- bcrypt hashed JWT
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- Access Logs (For analytics & audit trail)
CREATE TABLE access_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT,                 -- Which admin performed action (if applicable)
  folder_id TEXT,                -- Which folder was accessed
  ip_address VARCHAR,
  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  action VARCHAR,                -- 'view', 'upload', 'download', 'delete'
  FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);
```

**Notes:**
- `admin_users` table: Stores 3 admin user credentials (you'll create these during setup)
- `cloudinary_url`: Full CDN URL from Cloudinary (e.g., https://res.cloudinary.com/...)
- `cloudinary_public_id`: Used to delete files from Cloudinary (e.g., ohana-lens/folder-123/photo)
- `sessions` table now tracks which admin is logged in (supports concurrent logins for 3 admins)
- `access_logs` table: Useful for audit trail - see which admin deleted which folder
- `size_in_bytes` in folders table: Helps track which folder to delete when approaching 25GB limit
- All file metadata stored in database for quick lookups
- No file paths needed - Cloudinary handles storage

---

## API Endpoints (Minimal CRUD for Next.js)

### Authentication (Dual System: Admins + Members)
```
# ADMIN LOGIN (3 admin users)
POST   /api/auth/admin-login
  Body: { username: string, password: string }
  Response: { token: string, expires_in: 604800, username: string }
  Note: Mutually exclusive with member/folder access
  
POST   /api/auth/admin-logout
  Response: { ok: true }

# MEMBER ACCESS (via folder password - 25 members)
POST   /api/auth/verify-password
  Body: { folder_id: string, password: string }
  Response: { token: string, expires_in: 604800 }
  Note: One password = access to one folder only

POST   /api/auth/logout
  Response: { ok: true }
```

### Folders (Admin-Only Operations)
```
POST   /api/folders/create
  Auth: Admin JWT token required
  Body: { name: string, description?: string }
  Response: { id: string, password: string, folder_key: string }

GET    /api/folders
  Auth: Admin JWT token required
  Response: [{ id, name, description, created_at, size_gb, media_count }]
  Purpose: Admin dashboard lists all folders

DELETE /api/folders/[folderId]
  Auth: Admin JWT token required
  Deletes: All Cloudinary files + database records (FREES STORAGE)
  Response: { ok: true, freed_gb: 5.2, message: "✅ Folder deleted!" }

PATCH  /api/folders/[folderId]
  Auth: Admin JWT token required
  Body: { name?: string, description?: string }
  Response: { ok: true }
```

### Member Access (Folder-Based for 25 members)
```
GET    /api/folders/[folderId]/media
  Auth: Folder JWT token required (from folder password)
  Response: [
    { 
      id: string,
      file_name: string,
      cloudinary_url: string,
      media_type: "image" | "video",
      file_size: number,
      uploaded_at: string
    }
  ]
  Note: Members can only see media in their folder

GET    /api/media/[mediaId]/download
  Auth: Folder JWT token required
  Redirect: Redirect to Cloudinary URL (Cloudinary handles downloads)
```

### Media Management (Admin-Only Upload & Delete)
```
POST   /api/media/upload/:folderId
  Auth: Admin JWT token required
  Body: FormData { file: File }
  Process: 
    1. Validate file (size, type)
    2. Upload to Cloudinary REST API
    3. Get Cloudinary URL + public_id from response
    4. Save metadata + URLs to database
    5. Update folder size_in_bytes
  Response: { 
    id: string, 
    url: string, 
    public_id: string,
    file_size: number
  }

GET    /api/folders/[folderId]/media
  Response: [
    { 
      id: string,
      file_name: string,
      cloudinary_url: string,
      media_type: "image" | "video",
      file_size: number,
      uploaded_at: string
    }
  ]
  Note: No validation needed - Cloudinary always serves files

DELETE /api/media/[mediaId]
  Auth: Admin JWT token required
  Deletes: From Cloudinary + database
  Response: { ok: true, freed_bytes: 2500000 }
```

### Admin Dashboard Endpoints
```
GET    /api/admin/storage-usage
  Auth: Admin JWT token required
  Response: { 
    current_gb: 15.5,
    quota_gb: 25,
    percent_used: 62,
    status: "ok" | "warning" | "critical",
    recommendation: "Delete oldest folder soon" | "OK"
  }

GET    /api/admin/folders-by-size
  Auth: Admin JWT token required
  Response: [
    { 
      id: string,
      name: string,
      created_at: string,
      size_gb: 5.2,
      media_count: 150
    },
    ...more folders sorted by size (largest first)
  ]
  Purpose: Help admin identify which folder to delete
```

---

## Database Setup

### Development: SQLite (Local)
- **File:** `.db` file in project root
- **Setup:** Zero setup needed
- **Perfect For:** Local testing before deploying to Turso
- **No credit card required**

**Prisma Configuration Example:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**Local .env.local:**
```
DATABASE_URL="file:./dev.db"
```

### Production: Turso SQLite (Cloud)
- **Cost:** FREE tier - unlimited databases, 8GB/day usage
- **Connection:** libSQL (SQLite compatible)
- **Setup:** ~3 minutes
- **No credit card required**
- **URL:** https://turso.tech

**Why Turso:**
- ✅ SQLite is lightweight & simple
- ✅ Schema migrates 1:1 from local to cloud (same database format)
- ✅ Truly free with generous usage
- ✅ Edge replication available (optional future feature)
- ✅ Easy integration with Prisma

**Setup Steps:**
```
1. Sign up at turso.tech (free)
2. Create a new database
3. Get connection string (turso-cli or dashboard)
4. Add to Vercel environment variables
5. Run: npx prisma migrate deploy
6. Done!
```

**Production .env (Vercel):**
```
DATABASE_URL="libsql://your-db-xyz.turso.io?authToken=your_token"
```

---

## Swagger/OpenAPI API Documentation

### Overview
Use Swagger/OpenAPI to automatically generate interactive API documentation. This allows frontend developers and external users to explore and test all API endpoints visually.

### Setup

**1. Install Dependencies:**
```bash
npm install swagger-ui-react swagger-jsdoc
npm install -D @types/swagger-jsdoc
```

**2. Create `lib/swagger.ts` (OpenAPI Specification):**
```typescript
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '1 Ohana Lens API',
      description: 'Media management API for run club photo/video storage',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://yourdomain.vercel.app',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Folder: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            folder_key: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            size_mb: { type: 'number' },
            media_count: { type: 'number' },
          },
        },
        Media: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            folder_id: { type: 'string' },
            file_name: { type: 'string' },
            cloudinary_url: { type: 'string' },
            media_type: { type: 'string', enum: ['image', 'video'] },
            file_size: { type: 'number' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./app/api/**/*.ts'], // Path to your API route files
};

export const swaggerSpec = swaggerJsdoc(options);
```

**3. Create `app/api/swagger/route.ts` (Swagger JSON Endpoint):**
```typescript
import { swaggerSpec } from '@/lib/swagger';

export async function GET() {
  return new Response(JSON.stringify(swaggerSpec), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
```

**4. Create `app/api-docs/page.tsx` (Swagger UI):**
```typescript
'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function APIDocs() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>1 Ohana Lens - API Documentation</h1>
      <SwaggerUI url="/api/swagger" />
    </div>
  );
}
```

**5. Document API Endpoints in Route Handlers:**

Example `app/api/folders/route.ts` with Swagger documentation:
```typescript
/**
 * @swagger
 * /api/folders:
 *   post:
 *     summary: Create a new folder
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Sydney Run - Feb 14"
 *               description:
 *                 type: string
 *                 example: "Morning 10K run photos"
 *     responses:
 *       201:
 *         description: Folder created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 password:
 *                   type: string
 *                 folder_key:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all folders (admin only)
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of folders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Folder'
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: Request) {
  // Implementation here
}

export async function GET(req: Request) {
  // Implementation here
}
```

### Access Swagger UI

**Development:**
- Navigate to `http://localhost:3000/api-docs`
- See all endpoints with request/response schemas
- Test endpoints directly from browser (POST, GET, DELETE, etc.)

**Production:**
- User visits `https://yourdomain.vercel.app/api-docs`
- Full interactive API documentation available
- Safe to expose (read-only documentation by default)

### Benefits
✅ Interactive API exploration (try it in browser)  
✅ Auto-generated from code (stays in sync)  
✅ Request/response examples builtin  
✅ Authentication testing (paste JWT token)  
✅ Share API docs with frontend team  
✅ Professional, standard format (OpenAPI 3.0)  

---

## Deployment Recommendations

### Frontend + Backend (Both on Vercel)
- **Vercel** (hosting Next.js + API Routes) - FREE with generous limits
  - Unlimited API Routes (serverless functions)
  - Bandwidth: 100GB per month (free)
  - Automatic deployments on git push
  - Perfect for your use case

### Database  (Turso SQLite)
- **Turso:** Cloud-hosted SQLite, free tier
- Get connection string from turso.tech dashboard
- Add to Vercel environment variables
- Use immediately with no credit card

### Storage (Cloudinary)
- **Cloudinary**: 25GB/month free tier
- Admin manually deletes old folders every 3 weeks
- Automatic cleanup when folder is deleted
- Storage monitoring via admin dashboard

### Example Cost Breakdown
```
Frontend/Backend (Vercel):      FREE
Database (Turso SQLite):        FREE
File Storage (Cloudinary):      FREE (25GB/month)
Domain (optional):              $0-12/year
───────────────────────────────
Total Monthly Cost:             $0
```

**This is a true zero-cost production architecture!**

### Setup Steps

1. **Vercel (Frontend + Backend)**
   - Connect GitHub repo to Vercel
   - Auto-deploys on push

2. **Turso SQLite (Database)**
   - Sign up at turso.tech (free tier: unlimited databases)
   - Create a new SQLite database
   - Get connection string with auth token
   - Add to Vercel environment variables as DATABASE_URL

3. **Cloudinary (Storage)**
   - Sign up at cloudinary.com
   - Get API credentials
   - Add to Vercel environment variables
   - Verify 25GB/month quota

---

## Security Considerations (Simple but Safe)

1. **Password Hashing:** 
   - bcrypt (10-12 rounds) for folder passwords (for 25 members)
   - bcrypt (10-12 rounds) for admin credentials (for 3 admins)

2. **Session Token:** JWT with 7-day expiry (users remember login in browser)

3. **Multi-Admin Support:**
   - 3 separate admin usernames + passwords in database
   - Each admin gets individual login session
   - Access logs track which admin deleted which folder
   - All 3 admins can see storage warnings and trigger cleanup

4. **CORS:** Restrict to your domain

5. **File Validation:** Check MIME type + file extension before upload to Cloudinary

6. **Rate Limiting:** 
   - Admin login: 10 attempts/minute per IP
   - Member password verification: 5 attempts/minute per IP

7. **HTTPS:** Always enabled (Vercel handles automatically)

8. **Environment Secrets:** Store in `.env.local` / Vercel (never commit):
   - Cloudinary API credentials
   - Turso database URL with auth token
   - Admin passwords (hashed in database)

9. **Admin Verification:** Only JWT-authenticated admin can:
   - Create folders
   - Upload media
   - Delete folders (free storage)
   - View all storage data

10. **Member Access Isolation:** 
    - Members can only access their folder (via folder ID + password)
    - No way to list all folders
    - No way to access other folders

**What you DON'T need to worry about:**
- ❌ File encryption (photos/videos are public after folder access)
- ❌ Long-term data retention (manual cleanup every 3 weeks)
- ❌ Automated backups (regenerate folders = recreate gallery)
- ❌ GDPR compliance (no PII stored except admin credentials)
- ❌ User accounts (password-based folder access only, no usernames for members)

**Admin Credential Setup (Do this once at start):**
```sql
-- Insert 3 admin users into admin_users table
-- You'll set the actual usernames and passwords
INSERT INTO admin_users (id, username, password_hash)
VALUES 
  ('admin-1', 'admin-name-1', bcrypt('your-secure-password-1')),
  ('admin-2', 'admin-name-2', bcrypt('your-secure-password-2')),
  ('admin-3', 'admin-name-3', bcrypt('your-secure-password-3'));

-- All 3 admins will then use POST /api/auth/admin-login with their credentials
```

---

## Recommended Next Steps

1. **Create Accounts (All free, no credit card)**
   - Vercel: https://vercel.com (for hosting)
   - Cloudinary: https://cloudinary.com (for storage)
   - Turso: https://turso.tech (for database)
   - Get API credentials from each

2. **Setup Local Development Environment**
   - Create GitHub repo
   - Run: `npx create-next-app@latest 1-ohana-lens --typescript`
   - Install dependencies:
     ```bash
     npm install @prisma/client bcryptjs jsonwebtoken
     npm install swagger-ui-react swagger-jsdoc
     npm install -D @types/swagger-jsdoc prisma
     ```

3. **Initialize Prisma with SQLite**
   ```bash
   npx prisma init
   # Update .env.local with SQLite database URL
   # DATABASE_URL="file:./dev.db"
   ```

4. **Define Database Schema**
   - Create `prisma/schema.prisma` with folders, media, sessions tables
   - Run: `npx prisma migrate dev --name init`
   - Test locally with sample data

5. **Setup Swagger API Documentation**
   - Create `lib/swagger.ts` with OpenAPI specification
   - Add API route `app/api/swagger/route.ts` to serve Swagger JSON
   - Create `app/api-docs/page.tsx` with Swagger UI for interactive documentation
   - Document all endpoints with request/response schemas
   - Access at `http://localhost:3000/api-docs` during development

6. **Setup Cloudinary Integration**
   - Test REST API file upload locally
   - Confirm files organized as: `ohana-lens/folder-123/photo.jpg`
   - Create helper functions for upload/delete

6. **Build Core Features**
   - Phase 1: Folder CRUD + password auth
   - Phase 2: File upload to Cloudinary
   - Phase 3: Gallery + media preview
   - Phase 4: Admin storage management

7. **Deploy to Production**
   - Push code to GitHub
   - Connect to Vercel (auto-deploy on push)
   - Create Turso database
   - Update Vercel env variables
   - Deploy and test

---

## Project Configuration Summary

**Your Setup Status:**
- ✅ Vercel account created
- ⏳ Cloudinary account needed (free signup, ~5 minutes)
- ⏳ Turso database needed (free signup, ~2 minutes)

**Run Club Configuration:**
- **Members:** 25 people (non-admin): view-only access via folder links
- **Events:** 4-6 events per month (one folder per event)
- **Files per Event:** ~100 images + 10 videos (estimated 700MB per event)
- **Admin Users:** 3 (can create folders, manage cleanup, view storage)
- **Timeline:** Production-ready implementation (no MVP phase)

**Storage Projection:**
```
Per Event:      ~700MB (100 images @2MB + 10 videos @50MB)
Per Month:      ~3.5GB (5 events average)
Peak Storage:   ~2.1GB (3 events × 700MB)
25GB Quota:     ✅ SAFE - only using ~8% of available space

Storage stays well under 25GB limit!
Cleanup frequency: Every 3 weeks (plenty of buffer)
```

**Cleanup & Warnings:**
- ✅ Can manually delete oldest folder every 3 weeks
- ✅ Will add toast/banner notifications for:
  - Storage approaching 80% (yellow warning)
  - Storage above 95% (red critical alert)
  - Successful folder deletion (confirmation message)
- Admin watches for warnings and performs cleanup as needed

**Admin Access:**
- 3 admin users can create folders
- 3 admin users can view/delete folders and manage storage
- 3 admin users receive storage warning notifications
- All 25 members access folders via password-protected links (no login)

---

## Implementation Checklist

**Phase 0: Accounts & Credentials (Before Development)**
- [ ] Create Cloudinary account (cloudinary.com)
  - Get: Cloud Name, API Key, API Secret
  - Add to Vercel environment variables
- [ ] Create Turso database (turso.tech)
  - Get: Database URL with auth token
  - Add to Vercel environment variables
- [ ] GitHub repository created and connected to Vercel

**Phase 1-7: Development** (See "Proposed Development Phases" section above)

---

## Resources & References

**Documentation:**
- [Next.js 14 Docs](https://nextjs.org)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma ORM Docs](https://www.prisma.io/docs)
- [Prisma with SQLite](https://www.prisma.io/docs/reference/database-reference/connection-urls#sqlite)
- [Material-UI Components](https://mui.com)
- [Cloudinary REST API](https://cloudinary.com/documentation/image_upload_api_reference)
- [Turso SQLite Docs](https://docs.turso.tech)
- [Swagger UI React](https://github.com/swagger-api/swagger-ui/tree/master/swagger-ui-react)
- [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc)
- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.0)
- [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)

**Tutorials:**
- [Prisma Getting Started](https://www.prisma.io/docs/getting-started)
- [Next.js File Upload](https://nextjs.org/docs/app/building-your-application/data-fetching/forms-and-mutations)
- [JWT Authentication](https://nextjs.org/docs/authentication)
- [React Dropzone](https://www.react-dropzone.org)
- [react-player](https://github.com/cookpete/react-player)

**Tools:**
- Code editor: VS Code
- Database: Turso SQLite (production, free tier)
- Local Development: SQLite file (dev.db)
- Hosting: Vercel (free)
- Media: Cloudinary (free tier, 25GB/month)
- Version control: GitHub

---

**Document Version:** 5.0 (Implementation Complete)  
**Last Updated:** February 15, 2026  
**Status:** ✅ Development Complete - Ready for Production Deployment

**Your Specifications:**
- 25 members (view-only access via folder passwords)
- 3 admins (full management access)
- 4-6 events/month (~700MB per event)
- Manual 3-week cleanup cycle with storage warnings
- 100 images + 10 videos per event
- Zero cost using free tiers: Vercel + Cloudinary + Turso SQLite
