const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory database (for now)
let petDatabase = {};
let scanLogs = {};

// Email setup (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ✅ Twilio setup — safely (prevents crash)
let twilioClient = null;
if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
}

// Unique pet ID
function generatePetId() {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

// QR Code generation
async function generateQRCode(petId) {
  const qrData = `${process.env.BASE_URL || 'http://localhost:3000'}/found/${petId}`;
  const qrCodeDataURL = await QRCode.toDataURL(qrData, {
    width: 300,
    margin: 2,
    color: { dark: '#2d5a3d', light: '#ffffff' }
  });
  return { qrData, qrCodeDataURL };
}

// Notification (email + optional SMS)
async function notifyOwner(petData, scanLocation) {
  const { ownerName, ownerPhone, ownerEmail, petName } = petData;

  const message = `🚨 ${petName} has been found!\nLocation: ${scanLocation || 'Unknown'}\nTime: ${new Date().toLocaleString()}`;

  // Send Email
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: ownerEmail,
      subject: `🐕 ${petName} has been found!`,
      text: message,
      html: `<p>${message}</p>`
    });
    console.log('✅ Email sent');
  } catch (err) {
    console.error('❌ Email failed:', err);
  }

  // Send SMS (only if Twilio configured)
  if (ownerPhone && twilioClient) {
    try {
      await twilioClient.messages.create({
        body: `🐾 ${petName} has been found! Scan logged at ${new Date().toLocaleString()}.`,
        from: process.env.TWILIO_PHONE,
        to: ownerPhone
      });
      console.log('✅ SMS sent');
    } catch (err) {
      console.error('❌ SMS failed:', err);
    }
  }
}

// API endpoints (shortened here for brevity)
// Keep your existing routes: /api/register-pet, /found/:petId, /api/stats/:petId

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    registeredPets: Object.keys(petDatabase).length,
    totalScans: Object.keys(scanLogs).length
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PawCode backend running at http://localhost:${PORT}`);
});
