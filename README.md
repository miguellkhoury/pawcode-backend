# 🐕 PawCode - Smart QR Pet Tags Backend

## Quick Start Guide

### 1. Deploy to Railway/Vercel
1. Upload these files to GitHub
2. Connect your GitHub repo to Railway
3. Railway will automatically deploy

### 2. Set Environment Variables
Add these to your hosting platform:

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
BASE_URL=https://your-app-name.railway.app
```

### 3. Test Your API
Visit: `https://your-domain.com/api/health`

## 📱 How It Works

### Registration Flow:
1. Customer fills Google Form
2. Apps Script processes submission
3. Unique QR code generated (e.g., ABC123)
4. Owner receives email with QR code
5. Physical tag is created with laser-engraved QR

### Lost Pet Flow:
1. Finder scans QR code
2. Phone opens: `your-domain.com/found/ABC123`
3. Beautiful page shows pet info & owner contact
4. Owner gets instant email + SMS notification
5. Reunion! 🎉

## 🔧 API Endpoints

### POST `/api/register-pet`
Register a new pet and generate QR code

```json
{
  "petName": "Max",
  "petBreed": "Golden Retriever", 
  "ownerName": "John Doe",
  "ownerEmail": "john@example.com",
  "ownerPhone": "+96170321552"
}
```

### GET `/found/:petId`
Display pet information when QR code is scanned

### GET `/api/stats/:petId`
Get scan statistics for a pet

## 🚀 Deployment Options

### Railway (Recommended)
- Free tier available
- Automatic deployments
- Built-in environment variables

### Vercel
- Free for personal use
- Serverless functions
- Global CDN

### Heroku
- Reliable hosting
- Add-ons available
- Paid plans only

## 📧 Email Setup (Gmail)

1. Create dedicated Gmail account
2. Enable 2-Factor Authentication  
3. Generate App Password:
   - Google Account > Security > App passwords
   - Select "Mail" and "Other"
   - Use generated password in EMAIL_PASS

## 📱 SMS Setup (Optional)

### Twilio (International)
```env
TWILIO_SID=your-account-sid
TWILIO_TOKEN=your-auth-token  
TWILIO_PHONE=+1234567890
```

### Lebanese SMS Providers
- Contact Ogero for SMS API
- Check LibanPost SMS services
- Search local "Lebanon SMS API" providers

## 🔗 Google Forms Integration

1. Create Google Form with pet/owner questions
2. Add Apps Script trigger
3. Process submissions automatically
4. Generate unique QR codes

## ✅ Testing Checklist

- [ ] Backend deployed successfully
- [ ] Environment variables configured
- [ ] Test pet registration works
- [ ] Email notifications received
- [ ] QR code scanning works
- [ ] Pet found page displays correctly

## 📞 Support

For questions: **Miguel** - WhatsApp: +961 70 321 552

## 🎯 Next Steps

1. Deploy backend to Railway
2. Set up Gmail for notifications
3. Create Google Form
4. Test with sample pet
5. Start taking orders!

---

Made with ❤️ for Lebanese pet owners