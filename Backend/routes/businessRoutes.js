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
