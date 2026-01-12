# Deployment Guide

This guide covers deploying Restaurant OS to production using Railway (backend), Vercel (frontend), and DigitalOcean Spaces (file storage).

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Vercel      │────▶│    Railway      │────▶│  DO Spaces      │
│    (Frontend)   │     │    (Backend)    │     │   (Storage)     │
│    Next.js 15   │     │   Strapi 5.x    │     │   S3-compatible │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                        ┌────────▼────────┐
                        │   PostgreSQL    │
                        │   (Railway)     │
                        └─────────────────┘
```

## Prerequisites

- GitHub repository with this code
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- DigitalOcean account with Spaces enabled (optional, for file uploads)

---

## 1. Backend Deployment (Railway)

### 1.1 Create Railway Project

1. Go to [Railway](https://railway.app) and create a new project
2. Choose "Deploy from GitHub repo" and select this repository
3. Set the root directory to `backend`

### 1.2 Add PostgreSQL Database

1. In your Railway project, click "New" → "Database" → "PostgreSQL"
2. Railway will automatically create `DATABASE_URL` variable

### 1.3 Configure Environment Variables

In Railway project settings, add these environment variables:

```env
# Required
NODE_ENV=production
HOST=0.0.0.0
PORT=1337

# Security (see key generation script below)
APP_KEYS=key1,key2,key3,key4
API_TOKEN_SALT=your-api-token-salt
ADMIN_JWT_SECRET=your-admin-jwt-secret
TRANSFER_TOKEN_SALT=your-transfer-token-salt
JWT_SECRET=your-jwt-secret

# Database (auto-set by Railway PostgreSQL addon)
DATABASE_CLIENT=postgres
# DATABASE_URL is auto-set by Railway

# CORS - add your Vercel domain(s)
FRONTEND_URL=https://your-app.vercel.app,http://localhost:3000

# Optional: DigitalOcean Spaces for file uploads
DO_SPACE_ACCESS_KEY=your-access-key
DO_SPACE_SECRET_KEY=your-secret-key
DO_SPACE_ENDPOINT=nyc3.digitaloceanspaces.com
DO_SPACE_REGION=nyc3
DO_SPACE_BUCKET=your-bucket-name
```

### 1.4 Generate Security Keys

Run this script to generate all required keys:

```bash
echo "APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)"
echo "API_TOKEN_SALT=$(openssl rand -base64 32)"
echo "ADMIN_JWT_SECRET=$(openssl rand -base64 32)"
echo "TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 32)"
```

Copy each generated value to Railway environment variables.

### 1.5 Deploy

Railway will automatically deploy when you push to the main branch.

After deployment, note your Railway backend URL (e.g., `https://your-backend.up.railway.app`).

---

## 2. Frontend Deployment (Vercel)

### 2.1 Create Vercel Project

1. Go to [Vercel](https://vercel.com) and import your GitHub repository
2. Set the root directory to `frontend`
3. Framework preset: Next.js

### 2.2 Configure Environment Variables

In Vercel project settings → Environment Variables:

```env
# Production backend URL from Railway
NEXT_PUBLIC_STRAPI_URL=https://your-backend.up.railway.app
```

### 2.3 Deploy

Vercel will automatically deploy when you push to the main branch.

---

## 3. DigitalOcean Spaces Setup (Optional)

If you want to store uploaded files in DigitalOcean Spaces:

### 3.1 Create a Space

1. Go to DigitalOcean → Spaces
2. Create a new Space (e.g., `restaurant-os-uploads`)
3. Choose a region (e.g., `nyc3`)

### 3.2 Create API Keys

1. Go to API → Spaces Keys
2. Generate a new key pair
3. Note the Access Key and Secret Key

### 3.3 Configure CORS (in Space settings)

Add CORS configuration:
```json
[
  {
    "origin": ["https://your-app.vercel.app", "https://your-backend.up.railway.app"],
    "method": ["GET", "PUT", "POST", "DELETE"],
    "header": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

### 3.4 Update Railway Variables

Add the DO Spaces variables to Railway (see section 1.3).

---

## 4. Local Development with Production Backend

To run the frontend locally while using the production backend:

1. Copy the example file:
   ```bash
   cd frontend
   cp .env.local.example .env.local
   ```

2. Edit `.env.local`:
   ```env
   NEXT_PUBLIC_STRAPI_URL=https://your-backend.up.railway.app
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

---

## 5. Security Checklist

Before going live:

- [ ] Generate all security keys with `openssl rand -base64 32`
- [ ] Set `NODE_ENV=production` on Railway
- [ ] Configure CORS with exact frontend domain(s)
- [ ] Enable SSL on all services (automatic on Railway/Vercel)
- [ ] Set up database backups on Railway
- [ ] Review Strapi admin permissions

---

## 6. Useful Commands

### Backend (Strapi)

```bash
cd backend
npm run dev          # Local development
npm run build        # Build for production
npm run start        # Start production server
```

### Frontend (Next.js)

```bash
cd frontend
npm run dev          # Local development
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
```

---

## 7. Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` on Railway includes your Vercel domain
- Include `http://localhost:3000` for local development

### Database Connection Issues
- Check `DATABASE_URL` is set correctly on Railway
- Verify PostgreSQL addon is running

### Upload Issues
- Verify DO Spaces credentials
- Check Space CORS configuration
- Ensure bucket name and endpoint are correct

### Build Failures
- Check Node.js version (requires 20.x)
- Clear cache and rebuild: `npm ci && npm run build`

---

## 8. Monitoring

- **Railway**: Built-in logs and metrics dashboard
- **Vercel**: Analytics and logs in project dashboard
- **Strapi**: Admin panel at `https://your-backend.up.railway.app/admin`

---

## Support

For issues specific to this project, check the GitHub repository issues.

For platform-specific help:
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Strapi Docs](https://docs.strapi.io)
- [DigitalOcean Spaces Docs](https://docs.digitalocean.com/products/spaces/)
