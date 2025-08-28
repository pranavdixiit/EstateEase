const Listing = require('../models/Listing');
const { io } = require('../server');


// Get all listings (optionally add filters later)
const getListings = async (req, res) => {
  try {
    const listings = await Listing.find().populate('agent', 'name email');
    res.json(listings);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get a single listing by ID
const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('agent', 'name email');
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Create a new listing (agent or admin only)
const createListing = async (req, res) => {
  try {
    const { title, price, images, description, location } = req.body;
    const newListing = new Listing({
      title, price, images, description, location,
      agent: req.user.id,  // from auth middleware
    });
    await newListing.save();
    res.status(201).json(newListing);
  } catch (err) {
    res.status(400).json({ msg: 'Bad request', error: err.message });
  }
};

// Update a listing by ID (agent can only update own listings, admin can update all)
const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });

    if (req.user.role !== 'admin' && listing.agent.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const updates = req.body;
    Object.assign(listing, updates);
    await listing.save();
    res.json(listing);
  } catch (err) {
    res.status(400).json({ msg: 'Bad request', error: err.message });
  }
};

// Delete a listing by ID (agent can only delete own listings, admin can delete all)
const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });

    if (req.user.role !== 'admin' && listing.agent.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    await listing.remove();
    res.json({ msg: 'Listing deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
};
