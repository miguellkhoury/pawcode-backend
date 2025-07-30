# 🐕 PawCode - Smart QR Pet Tags Backend

## Quick Start Guide

### 1. Deploy to Render (Free Hosting)
1. Upload these files to GitHub
2. Go to https://render.com
3. Click "New Web Service", connect your GitHub repo
4. Use `npm install` as Build Command, and `npm start` as Start Command
5. Set `PORT=10000` in Environment Variables
6. Render will deploy and give you a public link

### 2. Set Environment Variables
Add these to Render under the "Environment" tab:

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
BASE_URL=https://pawcode-backend.onrender.com
PORT=10000
