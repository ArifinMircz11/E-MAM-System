import express from 'express';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import { getAdminDb } from '../../src/lib/firebase-admin.js';

const router = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// Helper for dynamic config
const getWhatsAppConfig = async () => {
  try {
    const adminDb = getAdminDb();
    const doc = await adminDb.collection('settings').doc('madrasahInfo').get();
    const data = doc.data() || {};

    return {
      enabled: data.whatsappEnabled ?? true, // Default true for backward compatibility
      gateway: data.whatsappGateway || 'fonnte',
      fonnteToken: data.whatsappToken || process.env.WHATSAPP_API_TOKEN,
      getwayToken: data.whatsappGetwayToken || process.env.WHATSAPP_GETWAY_TOKEN,
    };
  } catch (e) {
    console.error('Error fetching WA config from Firestore:', e);
    return {
      enabled: !!process.env.WHATSAPP_API_TOKEN,
      gateway: 'fonnte',
      fonnteToken: process.env.WHATSAPP_API_TOKEN,
      getwayToken: process.env.WHATSAPP_GETWAY_TOKEN,
    };
  }
};

// ==========================================
// WHATSAPP SEND ROUTE
// ==========================================

router.post('/send', limiter, async (req, res) => {
  const { target, message } = req.body;
  const config = await getWhatsAppConfig();

  if (!config.enabled) {
    return res.status(503).json({ error: 'WhatsApp service is disabled' });
  }

  try {
    if (config.gateway === 'fonnte') {
      if (!config.fonnteToken) {
        return res.status(500).json({ error: 'Fonnte token not configured' });
      }

      const response = await axios({
        method: 'POST',
        url: 'https://api.fonnte.com/send',
        headers: {
          Authorization: config.fonnteToken,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: new URLSearchParams({ target, message }).toString(),
      });
      return res.json(response.data);
    }

    if (config.gateway === 'getway') {
      if (!config.getwayToken) {
        return res.status(500).json({ error: 'Getway token not configured' });
      }

      // Generic Getway.id implementation (token in body is common for this provider)
      const response = await axios({
        method: 'POST',
        url: 'https://app.gateway.id/api/send-message',
        data: {
          token: config.getwayToken,
          number: target,
          message: message,
        },
      });
      return res.json(response.data);
    }

    res.status(400).json({ error: 'Unknown gateway provider' });
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Unknown error';
    console.error(`WhatsApp ${config.gateway} API Error:`, errorMessage);
    res.status(500).json({ error: `Failed to send via ${config.gateway}: ${errorMessage}` });
  }
});

// Webhook untuk menerima pesan dari Fonnte
router.post('/webhook', async (req, res) => {
  // AI auto-reply removed as requested by user
  res.status(200).json({ success: true, message: 'Webhook received. AI reply disabled.' });
});

export default router;
