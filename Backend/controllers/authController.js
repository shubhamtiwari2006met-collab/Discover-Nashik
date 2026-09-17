const Business = require('../models/Business');
const User = require('../models/User');

exports.getCurrentUser = async (req, res) => {
  res.status(200).json({
    id: req.user._id,
    supabaseId: req.user.supabaseId,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    businessStatus: req.user.businessStatus,
    avatar: req.user.avatar
  });
};

exports.registerBusiness = async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      contactName,
      phone,
      email,
      address,
      description,
      documents = [],
      photos = []
    } = req.body;

    if (!businessName || !businessType || !contactName || !phone || !email || !address) {
      return res.status(400).json({ message: 'Business name, type, contact, phone, email and address are required' });
    }

    const existing = await Business.findOne({ owner: req.user._id });
    if (existing && existing.verificationStatus === 'approved') {
      return res.status(409).json({ message: 'This business is already approved' });
    }

    const business = existing
      ? await Business.findByIdAndUpdate(existing._id, {
          businessName, businessType, contactName, phone, email, address, description, documents, photos,
          verificationStatus: 'pending', rejectionReason: '', reviewedBy: undefined, reviewedAt: undefined
        }, { new: true, runValidators: true })
      : await Business.create({ owner: req.user._id, businessName, businessType, contactName, phone, email, address, description, documents, photos });

    await User.findByIdAndUpdate(req.user._id, { role: 'business', businessStatus: 'pending' });
    res.status(existing ? 200 : 201).json(business);
  } catch (error) {
    res.status(400).json({ message: 'Business registration failed', error: error.message });
  }
};

exports.listBusinesses = async (req, res) => {
  const businesses = await Business.find().populate('owner', 'name email supabaseId').sort({ createdAt: -1 });
  res.status(200).json(businesses);
};

exports.reviewBusiness = async (req, res) => {
  try {
    const { verificationStatus, rejectionReason = '' } = req.body;
    if (!['approved', 'rejected'].includes(verificationStatus)) {
      return res.status(400).json({ message: 'verificationStatus must be approved or rejected' });
    }

    const business = await Business.findByIdAndUpdate(req.params.id, {
      verificationStatus,
      rejectionReason: verificationStatus === 'rejected' ? rejectionReason : '',
      reviewedBy: req.user._id,
      reviewedAt: new Date()
    }, { new: true }).populate('owner', 'name email supabaseId');

    if (!business) return res.status(404).json({ message: 'Business registration not found' });

    await User.findByIdAndUpdate(business.owner._id, {
      role: 'business',
      businessStatus: verificationStatus
    });

    res.status(200).json(business);
  } catch (error) {
    res.status(400).json({ message: 'Business review failed', error: error.message });
  }
};