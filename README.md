# 1 Ohana Lens

> A modern, password-protected media management application for run clubs to share and organize event photos and videos.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-7-blue)](https://mui.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)](https://www.prisma.io/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](https://github.com)

---

## 📖 Overview

**1 Ohana Lens** is a full-stack web application that provides password-protected folder-based storage for run club event media. Admins can create folders, upload photos and videos, and share secure access links with members. The application features automatic storage monitoring, Cloudinary CDN delivery, and a responsive mobile-first design.

### Key Features

- 🔐 **Dual Authentication** - Separate admin and member access with JWT tokens
- 📁 **Folder Management** - Create, organize, and delete event folders
- 📤 **Batch Upload** - Drag-and-drop multiple images and videos
- 🖼️ **Gallery View** - Responsive grid with lightbox preview
- 🎥 **Video Support** - In-browser playback with controls
- 📊 **Storage Monitoring** - Real-time usage with 80%/95% warnings
- 🗑️ **Easy Cleanup** - Delete folders and automatically free Cloudinary storage
- 📱 **Mobile Responsive** - Optimized for all screen sizes
- ⚡ **CDN Delivery** - Fast global image/video delivery via Cloudinary
- 🎨 **Modern UI** - Material-UI components with polished UX

---

## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** Material-UI v7
- **State:** React Query + Zustand
- **Forms:** react-hook-form + yup
- **File Upload:** React Dropzone
- **Media:** yet-another-react-lightbox

### Backend
- **Runtime:** Next.js API Routes
- **ORM:** Prisma
- **Database:** SQLite (dev) / Turso (production)
- **Storage:** Cloudinary
- **Auth:** JWT + bcrypt

### Deployment
- **Platform:** Vercel (serverless)
- **Database:** Turso SQLite
- **CDN:** Cloudinary
- **Cost:** $0/month (all free tiers)

---

## 📦 Quick Start

### Prerequisites

- Node.js 20+ and pnpm 9+
- Cloudinary account (free tier)
- Turso account for production (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/1-ohana-lens.git
cd 1-ohana-lens

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Initialize database
pnpm exec prisma migrate dev --name init
pnpm exec prisma db seed

# Start development server
pnpm dev
```

Visit http://localhost:3000

### Default Admin Credentials

```
Username: admin1
Password: admin123
```

⚠️ **Change these credentials before deploying to production!**

---

## 📚 Documentation

| Document                           | Description                              |
| ---------------------------------- | ---------------------------------------- |
| [PROPOSAL.md](PROPOSAL.md)         | Project requirements and specifications  |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical architecture and system design |
| [DEVELOPMENT.md](DEVELOPMENT.md)   | Developer guide and setup instructions   |
| [PROGRESS.md](PROGRESS.md)         | Development progress tracking            |

---

## 🎯 Usage

### For Admins

1. **Login**: Visit `/admin/login` with admin credentials
2. **Create Folder**: Go to admin dashboard → Create new folder
3. **Upload Media**: Select folder → Upload photos/videos via drag-and-drop
4. **Share Access**: Copy folder link and password, share with members
5. **Monitor Storage**: Check dashboard for storage usage warnings
6. **Cleanup**: Delete old folders every 3 weeks to free storage

### For Members

1. **Access Folder**: Click on shared folder link
2. **Enter Password**: Use password provided by admin
3. **View Gallery**: Browse photos and videos in responsive grid
4. **Preview Media**: Click to open lightbox (images) or video player
5. **Download**: Download individual files as needed

---

## 🏗️ Project Structure

```
1-ohana-lens/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard and management
│   ├── folder/            # Member folder access
│   ├── api/               # REST API endpoints
│   └── api-docs/          # Swagger documentation
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── folder/           # Gallery and media components
│   └── shared/           # Reusable components
├── lib/                   # Utilities and configurations
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # JWT authentication
│   ├── cloudinary.ts     # File storage
│   └── swagger.ts        # API documentation
├── prisma/               # Database schema and migrations
├── providers/            # React context providers
└── public/               # Static assets
```

---

## 🔐 Security Features

- ✅ Bcrypt password hashing (12 rounds)
- ✅ JWT token authentication (7-day expiry)
- ✅ Dual authentication system (admin + folder)
- ✅ Server-side input validation
- ✅ Type-safe database queries (Prisma)
- ✅ Secure session tracking
- ✅ No sensitive data in client code

---

## 🎨 Features in Detail

### Storage Management
- Real-time storage calculation from actual file sizes
- Warning notifications at 80% (yellow) and 95% (red)
- Manual folder deletion with storage freed confirmation
- Automatic Cloudinary cleanup on folder deletion

### Media Optimization
- Automatic format conversion (WebP, AVIF, JPEG)
- Responsive image delivery with srcset
- Smart quality compression (auto:eco)
- Video poster frame generation
- 60-70% bandwidth reduction

### Admin Dashboard
- FolderExplorer with split-panel design
- Storage usage visualization
- Folder properties and metadata
- Quick actions (edit, delete, share, open)
- Mobile drawer sidebar for small screens

### Member Experience
- Password-protected folder access
- Responsive gallery grid layout
- Image lightbox with navigation
- Video player with full controls
- Touch-friendly mobile interface

---

## 🛠️ Development

### Available Scripts

```bash
pnpm dev             # Start development server
pnpm build           # Build for production
pnpm start           # Start production server
pnpm lint            # Run ESLint
pnpm exec prisma studio    # Open database GUI
pnpm exec prisma migrate dev # Create new migration
```

### Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Authentication
JWT_SECRET=your_64_char_secret

# Optional
COMPRESS_IMAGES=false
```

---

## 📊 Project Status

**Status:** ✅ Development Complete - Ready for Production Deployment  
**Version:** 1.0.0  
**Last Updated:** February 15, 2026

### Completed Features

- [x] Admin authentication and dashboard
- [x] Folder CRUD operations
- [x] Batch media upload with validation
- [x] Gallery view with lightbox and video player
- [x] Storage monitoring and warnings
- [x] Individual media deletion
- [x] Cloudinary optimization
- [x] Mobile responsive design
- [x] Form validation
- [x] Error handling
- [x] SEO optimization
- [x] API documentation (Swagger)
- [x] Comprehensive documentation

### Ready for Deployment

The application is fully functional and ready to deploy to Vercel with Turso database.

---

## 📝 Configuration

### User Specifications

- **Members:** 25 people (view-only access)
- **Admins:** 3 people (full management)
- **Events:** 4-6 per month
- **Files per Event:** ~100 images + 10 videos (~700MB)
- **Storage Quota:** 25GB Cloudinary (free tier)
- **Peak Usage:** ~8% of quota with 3-week rotation

---

## 🤝 Contributing

This is a private project for **1 Ohana Run Club**. For questions or issues, please contact the project maintainers.

---

## 📄 License

Private - All Rights Reserved

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI powered by [Material-UI](https://mui.com/)
- Media storage via [Cloudinary](https://cloudinary.com/)
- Database hosted on [Turso](https://turso.tech/)
- Deployed on [Vercel](https://vercel.com/)

---

**Made with ❤️ for 1 Ohana Run Club**