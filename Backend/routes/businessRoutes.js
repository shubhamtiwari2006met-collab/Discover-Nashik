const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY);

// Middleware to verify business role
async function verifyBusiness(req, res, next) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || session.user.role !== 'business') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.businessId = session.user.id;
  next();
}

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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

// Secure Business Photo Upload Endpoint
router.post('/upload', async (req, res) => {
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

    // File size check: 5 MB limit
    const MAX_SIZE = 5 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({ message: 'Image size must be less than 5 MB.' });
    }

    // Magic byte validation
    const detectedExt = isValidImageBuffer(buffer);
    if (!detectedExt) {
      return res.status(400).json({ message: 'Please select a valid JPG, PNG, or WebP image.' });
    }

    const randomName = `biz_photo_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${detectedExt}`;
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, randomName);
    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${randomName}`;
    return res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error('Error in /api/business/upload:', err);
    return res.status(500).json({ message: 'Unable to upload image. Please try again.' });
  }
});

// Register business endpoint removed (temporarily disabled). See backup at backend/routes/_businessRegisterBackup.js

router.use(verifyBusiness);

// Summary endpoint for dashboard cards
router.get('/summary', async (req, res) => {
  const businessId = req.businessId;
  const { count: placesCount } = await supabase.from('places').select('id', { count: 'exact', head: true }).eq('business_id', businessId);
  const { count: pendingReviews } = await supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'pending');
  // placeholders for other counts
  res.json({ placesCount, pendingReviews, bookings: 0, inquiries: 0, notifications: 0, supportTickets: 0, applicationStatus: 'pending' });
});

// CRUD for places
router.get('/places', async (req, res) => {
  const { data, error } = await supabase.from('places').select('*').eq('business_id', req.businessId);
  if (error) return res.status(400).json({ error });
  res.json(data);
});
router.post('/places', async (req, res) => {
  const payload = { ...req.body, business_id: req.businessId };
  const { error, data } = await supabase.from('places').insert(payload).single();
  if (error) return res.status(400).json({ error });
  res.status(201).json(data);
});
router.put('/places/:id', async (req, res) => {
  const { id } = req.params;
  const { error, data } = await supabase.from('places').update(req.body).eq('id', id).eq('business_id', req.businessId).single();
  if (error) return res.status(400).json({ error });
  res.json(data);
});
router.delete('/places/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('places').delete().eq('id', id).eq('business_id', req.businessId);
  if (error) return res.status(400).json({ error });
  res.status(204).end();
});

// Reviews moderation
router.get('/reviews', async (req, res) => {
  const { data, error } = await supabase.from('reviews').select('*').eq('business_id', req.businessId);
  if (error) return res.status(400).json({ error });
  res.json(data);
});
router.patch('/reviews/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { error, data } = await supabase.from('reviews').update({ status }).eq('id', id).eq('business_id', req.businessId).single();
  if (error) return res.status(400).json({ error });
  res.json(data);
});

// Application status (assuming a table business_applications)
router.get('/application-status', async (req, res) => {
  const { data, error } = await supabase.from('business_applications').select('status').eq('business_id', req.businessId).single();
  if (error) return res.status(400).json({ error });
  res.json(data);
});

module.exports = router;
