# GitHub Copilot Skills for 1 Ohana Lens

## Available Skills

### 1. Database Query Skill
**Trigger:** "query database for...", "fetch from database...", "prisma query..."

**Context:**
- Always use Prisma Client
- Import from '@/lib/db'
- Handle errors with try-catch
- Return null for not found, throw for errors

**Example:**
```typescript
import { prisma } from '@/lib/db';

// Get folder with media count
const folder = await prisma.folder.findUnique({
  where: { id: folderId },
  include: {
    media: true,
    _count: {
      select: { media: true }
    }
  }
});
```

### 2. Cloudinary Upload Skill
**Trigger:** "upload to cloudinary", "cloudinary upload...", "upload media file..."

**Context:**
- Use REST API, not SDK
- Organize files: `ohana-lens/folder-{id}/filename`
- Store URL and public_id in database
- Validate file before upload

**Example:**
```typescript
import { uploadToCloudinary } from '@/lib/cloudinary';

const formData = await request.formData();
const file = formData.get('file') as File;

const result = await uploadToCloudinary(file, folderId);
// result: { url, public_id, size, format }

await prisma.media.create({
  data: {
    folder_id: folderId,
    cloudinary_url: result.url,
    cloudinary_public_id: result.public_id,
    file_size: result.size,
    media_type: result.format.includes('video') ? 'video' : 'image'
  }
});
```

### 3. Authentication Skill
**Trigger:** "verify token", "check authentication", "admin auth...", "folder access..."

**Context:**
- Dual authentication system
- Admin JWT: contains admin_id
- Folder JWT: contains folder_id
- 7-day expiry for both

**Example:**
```typescript
import { verifyAdminToken, verifyFolderToken } from '@/lib/auth';

// Admin-only endpoint
export async function POST(request: Request) {
  const token = request.headers.get('Authorization')?.split(' ')[1];
  const admin = await verifyAdminToken(token);
  
  if (!admin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Admin-only logic here
}

// Folder access endpoint
export async function GET(request: Request, { params }: { params: { folderId: string } }) {
  const token = request.headers.get('Authorization')?.split(' ')[1];
  const access = await verifyFolderToken(token);
  
  if (!access || access.folder_id !== params.folderId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Member can access this folder
}
```

### 4. Storage Management Skill
**Trigger:** "check storage", "storage usage...", "storage warning...", "delete folder..."

**Context:**
- Monitor Cloudinary usage
- Warnings at 80% and 95%
- Manual cleanup every 3 weeks

**Example:**
```typescript
import { getStorageUsage, deleteFolder } from '@/lib/cloudinary';

// Check storage
const usage = await getStorageUsage();
const percentage = (usage.used_gb / usage.quota_gb) * 100;

let warningLevel = 'safe';
if (percentage >= 95) warningLevel = 'critical';
else if (percentage >= 80) warningLevel = 'warning';

// Delete folder with cleanup
const mediaList = await prisma.media.findMany({
  where: { folder_id: folderId },
  select: { cloudinary_public_id: true, file_size: true }
});

// Delete from Cloudinary
await deleteFolder(`ohana-lens/folder-${folderId}`);

// Delete from database (CASCADE will delete media records)
await prisma.folder.delete({ where: { id: folderId } });

const freedGB = mediaList.reduce((sum, m) => sum + m.file_size, 0) / (1024 ** 3);
return { ok: true, freed_gb: freedGB.toFixed(2) };
```

### 5. MUI Component Skill
**Trigger:** "create mui component", "material-ui form...", "mui layout..."

**Context:**
- Use MUI v5+ components
- Styling with sx prop
- Responsive with Grid/Stack/Box
- Theme-aware colors

**Example:**
```typescript
'use client';

import { Box, Card, CardContent, Typography, Button, Grid } from '@mui/material';
import { useState } from 'react';

export default function FolderCard({ folder }) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          {folder.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {folder.description}
        </Typography>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          {folder.media_count} files • {(folder.size_in_bytes / (1024 ** 2)).toFixed(1)} MB
        </Typography>
      </CardContent>
      <Box sx={{ p: 2, pt: 0 }}>
        <Button variant="outlined" fullWidth>
          View Folder
        </Button>
      </Box>
    </Card>
  );
}
```

### 6. API Route Skill
**Trigger:** "create api route", "next.js api...", "api endpoint..."

**Context:**
- Use App Router format (route.ts)
- Standard response format
- Error handling with status codes
- Authentication middleware pattern

**Example:**
```typescript
// app/api/folders/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminToken } from '@/lib/auth';

/**
 * @swagger
 * /api/folders:
 *   get:
 *     summary: List all folders
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of folders
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    const admin = await verifyAdminToken(token);
    
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const folders = await prisma.folder.findMany({
      include: {
        _count: { select: { media: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    
    return Response.json({ data: folders, ok: true });
  } catch (error) {
    console.error('[API] Error fetching folders:', error);
    return Response.json(
      { error: 'Internal server error', code: 'FETCH_ERROR', ok: false },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/folders:
 *   post:
 *     summary: Create new folder
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    const admin = await verifyAdminToken(token);
    
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, description } = body;
    
    // Validation
    if (!name || typeof name !== 'string') {
      return Response.json(
        { error: 'Folder name is required', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }
    
    // Generate unique folder key and password
    const folderKey = crypto.randomUUID();
    const password = crypto.randomUUID().slice(0, 8);
    const passwordHash = await bcrypt.hash(password, 12);
    
    const folder = await prisma.folder.create({
      data: {
        id: crypto.randomUUID(),
        name,
        description,
        folder_key: folderKey,
        password_hash: passwordHash,
        created_by: admin.id
      }
    });
    
    return Response.json({
      data: { ...folder, password }, // Return plaintext password once
      ok: true
    }, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating folder:', error);
    return Response.json(
      { error: 'Failed to create folder', code: 'CREATE_ERROR', ok: false },
      { status: 500 }
    );
  }
}
```

### 7. Form Validation Skill
**Trigger:** "validate form", "form validation...", "validate input..."

**Context:**
- Validate on client and server
- Show user-friendly error messages
- Use MUI TextField error props

**Example:**
```typescript
'use client';

import { useState } from 'react';
import { TextField, Button, Alert } from '@mui/material';

export default function CreateFolderForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Client-side validation
    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }
    
    if (name.length < 3) {
      setError('Folder name must be at least 3 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ name, description })
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        setError(result.error || 'Failed to create folder');
        return;
      }
      
      // Success - show password to admin
      alert(`Folder created! Password: ${result.data.password}`);
      setName('');
      setDescription('');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <TextField
        fullWidth
        label="Folder Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        sx={{ mb: 2 }}
      />
      
      <TextField
        fullWidth
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={3}
        sx={{ mb: 2 }}
      />
      
      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Folder'}
      </Button>
    </form>
  );
}
```

### 8. React Query Skill
**Trigger:** "fetch data with react query", "useQuery...", "useMutation..."

**Context:**
- Use TanStack Query v5+
- Cache API responses
- Automatic refetching

**Example:**
```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useFolders() {
  return useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const response = await fetch('/api/folders', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (!response.ok) throw new Error('Failed to fetch folders');
      const result = await response.json();
      return result.data;
    }
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (folderId: string) => {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (!response.ok) throw new Error('Failed to delete folder');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch folders list
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    }
  });
}
```

## Skill Usage Tips

1. **Combine Skills:** Use multiple skills together for complex features
   - Example: Auth Skill + Database Query Skill for protected endpoints

2. **Follow Patterns:** Always use the established patterns shown above
   - Consistent error handling
   - Standard response format
   - Proper TypeScript types

3. **Security First:** Always verify authentication before database operations
   - Check admin token for write operations
   - Check folder token for read operations

4. **Error Handling:** Always wrap async operations in try-catch
   - Log errors for debugging
   - Return user-friendly error messages

5. **Documentation:** Add Swagger comments to API routes
   - Helps generate API documentation
   - Keep documentation in sync with code

---

These skills help GitHub Copilot generate consistent, production-ready code for the 1 Ohana Lens project.
