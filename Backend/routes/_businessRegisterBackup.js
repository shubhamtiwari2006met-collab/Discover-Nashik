// Backup of the original business registration endpoint
// This file is kept for reference but not mounted in the app.
// To re‑enable registration, import and use this router in server.js.

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY);

router.post('/register', async (req, res) => {
  const { name, email, phone, address, category, tagline } = req.body;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return res.status(401).json({ error: 'No session' });
  const businessData = {
    owner: session.user.id,
    businessName: name,
    businessType: category,
    contactName: name,
    phone,
    email,
    address,
    tagline,
  };
  const { error, data } = await supabase.from('businesses').insert(businessData).single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

module.exports = router;
