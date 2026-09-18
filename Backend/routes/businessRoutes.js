const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { authenticate, optionalAuthenticate, requireRoles } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Dedicated Rate Limiter for Image Uploads (15 uploads per 15 minutes per IP)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many upload attempts. Please try again after a few minutes." }
});

// Magic byte validation for JPG, PNG, WebP
function isValidImageBuffer(buffer) {
  if (!buffer || buffer.length < 12) return false;
  
  // JPEG: FF D8 FF
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  if (isJpeg) return 'jpg';

  // PNG: 89 50 4E 47
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  if (isPng) return 'png';

  // WebP: RIFF ... WEBP
  const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
  const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
  if (isRiff && isWebp) return 'webp';

  return false;
}

// Secure Business Photo Upload Endpoint (Enforcing strictly 1 MB = 1,048,576 bytes)
router.post('/upload', uploadLimiter, optionalAuthenticate, async (req, res) => {
  try {
    const { imageBase64, image } = req.body;
    const rawData = imageBase64 || image;

    if (!rawData || typeof rawData !== 'string') {
      return res.status(400).json({ message: 'No image data provided.' });
    }

    const matches = rawData.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/i);
    let base64String = rawData;

    if (matches) {
      base64String = matches[3];
    } else if (rawData.startsWith('data:')) {
      return res.status(400).json({ message: 'Please select a valid JPG, PNG, or WebP image.' });
    }

    const buffer = Buffer.from(base64String, 'base64');

    // STRICT 1 MB limit (1,048,576 bytes)
    const MAX_SIZE = 1048576;
    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({ message: 'Image size must be 1 MB or less.' });
    }

    // Magic byte validation (Ensuring JPEG, PNG, or WEBP only)
    const detectedExt = isValidImageBuffer(buffer);
    if (!detectedExt) {
      return res.status(400).json({ message: 'Please select a valid JPG, PNG, or WebP image.' });
    }

    // Server-side random filename (prevents path traversal)
    const safeRandomName = `biz_photo_${Date.now()}_${crypto.randomBytes(8).toString('hex')}.${detectedExt}`;
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, safeRandomName);
    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${safeRandomName}`;
    return res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error('Error in /api/business/upload:', err);
    return res.status(500).json({ message: 'Unable to upload image. Please try again.' });
  }
});

// Middleware to verify authenticated business account
const verifyBusinessAuth = [authenticate, requireRoles('business', 'admin')];

// Summary endpoint for dashboard cards
router.get('/summary', verifyBusinessAuth, async (req, res) => {
  try {
    const businessId = req.user.supabaseId || req.user._id.toString();
    let placesCount = 0;
    let pendingReviews = 0;
    if (supabase) {
      const { count: pCount } = await supabase.from('places').select('id', { count: 'exact', head: true }).eq('business_id', businessId);
      const { count: rCount } = await supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'pending');
      placesCount = pCount || 0;
      pendingReviews = rCount || 0;
    }
    res.json({ placesCount, pendingReviews, bookings: 0, inquiries: 0, notifications: 0, supportTickets: 0, applicationStatus: req.user.businessStatus || 'approved' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load business summary.' });
  }
});

// CRUD for places
router.get('/places', verifyBusinessAuth, async (req, res) => {
  try {
    const businessId = req.user.supabaseId || req.user._id.toString();
    if (!supabase) return res.json([]);
    const { data, error } = await supabase.from('places').select('*').eq('business_id', businessId);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching business places.' });
  }
});

router.post('/places', verifyBusinessAuth, async (req, res) => {
  try {
    const businessId = req.user.supabaseId || req.user._id.toString();
    const payload = { ...req.body, business_id: businessId };
    if (!supabase) return res.status(500).json({ message: 'Database service unconfigured' });
    const { error, data } = await supabase.from('places').insert(payload).single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error creating business place.' });
  }
});

router.put('/places/:id', verifyBusinessAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user.supabaseId || req.user._id.toString();
    if (!supabase) return res.status(500).json({ message: 'Database service unconfigured' });
    const { error, data } = await supabase.from('places').update(req.body).eq('id', id).eq('business_id', businessId).single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error updating business place.' });
  }
});

router.delete('/places/:id', verifyBusinessAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user.supabaseId || req.user._id.toString();
    if (!supabase) return res.status(500).json({ message: 'Database service unconfigured' });
    const { error } = await supabase.from('places').delete().eq('id', id).eq('business_id', businessId);
    if (error) return res.status(400).json({ error: error.message });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: 'Error deleting business place.' });
  }
});

// Reviews moderation
router.get('/reviews', verifyBusinessAuth, async (req, res) => {
  try {
    const businessId = req.user.supabaseId || req.user._id.toString();
    if (!supabase) return res.json([]);
    const { data, error } = await supabase.from('reviews').select('*').eq('business_id', businessId);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews.' });
  }
});

router.patch('/reviews/:id', verifyBusinessAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const businessId = req.user.supabaseId || req.user._id.toString();
    if (!supabase) return res.status(500).json({ message: 'Database service unconfigured' });
    const { error, data } = await supabase.from('reviews').update({ status }).eq('id', id).eq('business_id', businessId).single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error updating review status.' });
  }
});

// Application status
router.get('/application-status', verifyBusinessAuth, async (req, res) => {
  try {
    const businessId = req.user.supabaseId || req.user._id.toString();
    if (!supabase) return res.json({ status: req.user.businessStatus || 'approved' });
    const { data, error } = await supabase.from('business_applications').select('status').eq('business_id', businessId).single();
    if (error) return res.json({ status: req.user.businessStatus || 'approved' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching application status.' });
  }
});

module.exports = router;

