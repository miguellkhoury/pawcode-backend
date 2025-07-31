const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory database (use MongoDB/PostgreSQL in production)
let petDatabase = {};
let scanLogs = {};

// Email configuration (using Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your-email@gmail.com
    pass: process.env.EMAIL_PASS  // your-app-password
  }
});

// SMS Configuration (using Twilio - replace with your preferred SMS service)
const twilio = require('twilio');
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

// Generate unique pet ID
function generatePetId() {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

// Generate QR code
async function generateQRCode(petId) {
  const qrData = `${process.env.BASE_URL || 'http://localhost:3000'}/found/${petId}`;
  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#2d5a3d',
        light: '#ffffff'
      }
    });
    return { qrData, qrCodeDataURL };
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
}

// Send notification to owner
async function notifyOwner(petData, scanLocation) {
  const { ownerName, ownerPhone, ownerEmail, petName } = petData;
  
  const message = `🚨 GREAT NEWS! ${petName} has been found! 

Someone just scanned their PawCode tag and can see your contact information. 

📍 Last scan location: ${scanLocation || 'Location not available'}
⏰ Time: ${new Date().toLocaleString()}

They now have access to your contact details and can reach out to you directly.

- PawCode Team`;

  // Send Email
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: ownerEmail,
      subject: `🐕 ${petName} has been found! - PawCode Alert`,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4a90e2 0%, #50c878 100%); padding: 20px; text-align: center; color: white;">
            <h1>🐕 ${petName} has been found!</h1>
          </div>
          <div style="padding: 20px; background: #f8fafb;">
            <p>Great news, ${ownerName}!</p>
            <p>Someone just scanned ${petName}'s PawCode tag and can now see your contact information.</p>
            <div style="background: white; padding: 15px; border-radius: 10px; margin: 20px 0;">
              <p><strong>📍 Last scan location:</strong> ${scanLocation || 'Location not available'}</p>
              <p><strong>⏰ Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p>They now have access to your contact details and can reach out to you directly.</p>
            <p style="color: #64748b; font-size: 14px; margin-top: 20px;">- PawCode Team</p>
          </div>
        </div>
      `
    });
    console.log('Email notification sent successfully');
  } catch (error) {
    console.error('Email notification failed:', error);
  }

  // Send SMS (if phone number provided)
  if (ownerPhone) {
    try {
      await twilioClient.messages.create({
        body: `🐕 PAWCODE ALERT: ${petName} has been found! Someone scanned their tag at ${new Date().toLocaleString()}. They can now see your contact info. Check your email for details.`,
        from: process.env.TWILIO_PHONE, // Your Twilio phone number
        to: ownerPhone
      });
      console.log('SMS notification sent successfully');
    } catch (error) {
      console.error('SMS notification failed:', error);
    }
  }
}

// API Routes

// 1. Register a new pet (called when form is submitted)
app.post('/api/register-pet', async (req, res) => {
  try {
    const {
      petName,
      petBreed,
      petAge,
      petColor,
      ownerName,
      ownerPhone,
      ownerEmail,
      ownerAddress,
      emergencyContact,
      medicalInfo,
      specialInstructions
    } = req.body;

    // Generate unique pet ID
    const petId = generatePetId();
    
    // Generate QR code
    const { qrData, qrCodeDataURL } = await generateQRCode(petId);

    // Store pet data
    petDatabase[petId] = {
      petId,
      petName,
      petBreed,
      petAge,
      petColor,
      ownerName,
      ownerPhone,
      ownerEmail,
      ownerAddress,
      emergencyContact,
      medicalInfo,
      specialInstructions,
      qrData,
      qrCodeDataURL,
      createdAt: new Date(),
      scanCount: 0
    };

    // Send registration confirmation email with QR code
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: ownerEmail,
      subject: `🐕 ${petName}'s PawCode Tag is Ready!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4a90e2 0%, #50c878 100%); padding: 20px; text-align: center; color: white;">
            <h1>🐕 ${petName}'s PawCode is Ready!</h1>
          </div>
          <div style="padding: 20px; background: #f8fafb;">
            <p>Hi ${ownerName},</p>
            <p>Great news! ${petName}'s PawCode tag has been created successfully.</p>
            
            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
              <h3>Pet ID: ${petId}</h3>
              <img src="${qrCodeDataURL}" alt="QR Code for ${petName}" style="max-width: 200px;">
              <p style="font-size: 12px; color: #64748b;">This QR code will be laser-engraved on ${petName}'s tag</p>
            </div>

            <h3>What happens when someone scans this code:</h3>
            <ul>
              <li>✅ They'll instantly see your contact information</li>
              <li>✅ You'll receive an immediate notification (email + SMS)</li>
              <li>✅ The scan location will be logged</li>
            </ul>

            <div style="background: #e8f5f3; padding: 15px; border-radius: 10px; margin: 20px 0;">
              <h4>📋 Pet Profile Summary:</h4>
              <p><strong>Name:</strong> ${petName}</p>
              <p><strong>Breed:</strong> ${petBreed}</p>
              <p><strong>Age:</strong> ${petAge}</p>
              <p><strong>Color:</strong> ${petColor}</p>
              ${medicalInfo ? `<p><strong>Medical Info:</strong> ${medicalInfo}</p>` : ''}
              ${specialInstructions ? `<p><strong>Special Instructions:</strong> ${specialInstructions}</p>` : ''}
            </div>

            <p>Your pet's tag will be prepared and shipped soon. Thank you for choosing PawCode!</p>
            <p style="color: #64748b; font-size: 14px; margin-top: 20px;">- PawCode Team</p>
          </div>
        </div>
      `
    });

    res.json({
      success: true,
      petId,
      qrCodeDataURL,
      message: 'Pet registered successfully! Check your email for the QR code.'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// 2. Handle QR code scans (when someone finds a pet)
app.get('/found/:petId', async (req, res) => {
  const { petId } = req.params;
  
  // Get location from query params or IP
  const scanLocation = req.query.location || req.ip || 'Unknown location';
  
  if (!petDatabase[petId]) {
    return res.status(404).send(`
      <html>
        <head><title>Pet Not Found - PawCode</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>❌ Pet Not Found</h1>
          <p>This QR code doesn't match any registered pets.</p>
          <p>Please contact PawCode support if you believe this is an error.</p>
        </body>
      </html>
    `);
  }

  const petData = petDatabase[petId];
  
  // Increment scan count
  petData.scanCount++;
  
  // Log the scan
  const scanId = crypto.randomUUID();
  scanLogs[scanId] = {
    petId,
    scanTime: new Date(),
    location: scanLocation,
    userAgent: req.get('User-Agent')
  };

  // Send notification to owner (async, don't wait)
  notifyOwner(petData, scanLocation).catch(console.error);

  // Show pet information to finder
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Found Pet: ${petData.petName} - PawCode</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #e8f5f3 0%, #f0f8ff 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          text-align: center;
        }
        .pet-header {
          background: linear-gradient(135deg, #4a90e2 0%, #50c878 100%);
          color: white;
          padding: 20px;
          border-radius: 15px;
          margin-bottom: 20px;
        }
        .pet-name { font-size: 2rem; margin: 0; }
        .pet-info {
          text-align: left;
          background: #f8fafb;
          padding: 20px;
          border-radius: 15px;
          margin: 20px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        .info-row:last-child { border-bottom: none; margin-bottom: 0; }
        .label { font-weight: 600; color: #2d5a3d; }
        .value { color: #64748b; }
        .contact-section {
          background: #e8f5f3;
          padding: 20px;
          border-radius: 15px;
          margin: 20px 0;
        }
        .contact-button {
          display: inline-block;
          background: #50c878;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 25px;
          margin: 5px;
          font-weight: 600;
        }
        .notification-badge {
          background: #50c878;
          color: white;
          padding: 10px 20px;
          border-radius: 10px;
          margin: 20px 0;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="pet-header">
          <h1 class="pet-name">🐕 ${petData.petName}</h1>
          <p>You found me! Thank you! 🎉</p>
        </div>

        <div class="notification-badge">
          ✅ Owner has been notified automatically!
        </div>

        <div class="pet-info">
          <div class="info-row">
            <span class="label">Pet Name:</span>
            <span class="value">${petData.petName}</span>
          </div>
          <div class="info-row">
            <span class="label">Breed:</span>
            <span class="value">${petData.petBreed}</span>
          </div>
          <div class="info-row">
            <span class="label">Age:</span>
            <span class="value">${petData.petAge}</span>
          </div>
          <div class="info-row">
            <span class="label">Color:</span>
            <span class="value">${petData.petColor}</span>
          </div>
          ${petData.medicalInfo ? `
            <div class="info-row">
              <span class="label">Medical Info:</span>
              <span class="value">${petData.medicalInfo}</span>
            </div>
          ` : ''}
          ${petData.specialInstructions ? `
            <div class="info-row">
              <span class="label">Instructions:</span>
              <span class="value">${petData.specialInstructions}</span>
            </div>
          ` : ''}
        </div>

        <div class="contact-section">
          <h3>📞 Contact Owner</h3>
          <p><strong>Owner:</strong> ${petData.ownerName}</p>
          ${petData.ownerPhone ? `<a href="tel:${petData.ownerPhone}" class="contact-button">📞 Call ${petData.ownerPhone}</a>` : ''}
          ${petData.ownerEmail ? `<a href="mailto:${petData.ownerEmail}" class="contact-button">✉️ Email Owner</a>` : ''}
          ${petData.ownerPhone ? `<a href="https://wa.me/${petData.ownerPhone.replace(/[^0-9]/g, '')}" class="contact-button">💬 WhatsApp</a>` : ''}
          ${petData.emergencyContact ? `<p><strong>Emergency Contact:</strong> ${petData.emergencyContact}</p>` : ''}
        </div>

        <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
          Scan #${petData.scanCount} • Powered by PawCode
        </p>
      </div>
    </body>
    </html>
  `);
});

// 3. Get pet statistics (optional admin endpoint)
app.get('/api/stats/:petId', (req, res) => {
  const { petId } = req.params;
  const petData = petDatabase[petId];
  
  if (!petData) {
    return res.status(404).json({ error: 'Pet not found' });
  }

  const petScans = Object.values(scanLogs).filter(log => log.petId === petId);
  
  res.json({
    petName: petData.petName,
    scanCount: petData.scanCount,
    createdAt: petData.createdAt,
    recentScans: petScans.slice(-5) // Last 5 scans
  });
});

// 4. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    registeredPets: Object.keys(petDatabase).length,
    totalScans: Object.keys(scanLogs).length
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🐕 PawCode server running on port ${PORT}`);
  console.log(`📱 Registration endpoint: http://localhost:${PORT}/api/register-pet`);
  console.log(`🔍 Pet lookup: http://localhost:${PORT}/found/[PET_ID]`);
});

module.exports = app;
