const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Listing = require('../models/Listing');

// Create new listing
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, price, images } = req.body;
    const userId = req.user.id;

    if (!title || !price || !images || !images.length) {
      return res.status(400).json({ msg: 'Title, price, and images are required' });
    }

    const newListing = new Listing({
      title,
      description,
      price,
      images,
      userId,
    });

    await newListing.save();
    res.status(201).json(newListing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get listings - optionally filter by userId via query ?userId=...
router.get('/', async (req, res) => {
  try {
    // If a userId query parameter exists, filter; else return all
    const { userId } = req.query;
    const filter = userId ? { userId } : {};
    const listings = await Listing.find(filter);
    res.json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ msg: 'Listing not found' });
  // Increment views
  listing.views = (listing.views || 0) + 1;
  await listing.save();
  res.json(listing);
});
router.get('/trending', async (req, res) => {
  const trendingListings = await Listing.find().sort({ views: -1 }).limit(10);
  res.json(trendingListings);
});

// Delete a listing by ID
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });

    if (listing.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized to delete this listing' });
    }

    await listing.deleteOne();
    res.json({ msg: 'Listing deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PATCH /api/listings/:id/rating - Update listing rating
router.patch('/:id/rating', authMiddleware, async (req, res) => {
  const { rating } = req.body;
  const userId = req.user.id;

  if (typeof rating !== 'number' || rating < 0 || rating > 5) {
    return res.status(400).json({ msg: 'Rating must be between 0 and 5' });
  }

  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });

    // Check if user already rated
    const existingIndex = listing.ratings.findIndex(r => r.userId.toString() === userId);
    if (existingIndex > -1) {
      listing.ratings[existingIndex].value = rating;
    } else {
      listing.ratings.push({ userId, value: rating });
    }

    // Compute average
    listing.rating = listing.ratings.reduce((sum, r) => sum + r.value, 0) / listing.ratings.length;

    await listing.save();

    res.json(listing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to update rating' });
  }
});

router.post('/:id/favorite-toggle', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });

    // This logic depends on your schema.
    // Option 1: listing has a 'favorites' array of user IDs
    if (!listing.favorites) listing.favorites = [];

    const index = listing.favorites.indexOf(userId);
    let isFavorite;
    if (index === -1) {
      listing.favorites.push(userId);
      isFavorite = true;
    } else {
      listing.favorites.splice(index, 1);
      isFavorite = false;
    }

    await listing.save();

    // Optionally, update a computed property `isFavorite` for client convenience
    res.json({ isFavorite, listing });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Update a listing by ID (agent can only update own listings)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });

    // Only agent who created or admin can update
    if (listing.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Unauthorized to update this listing' });
    }

    // Apply updates
    const updates = req.body;
    Object.assign(listing, updates);

    await listing.save();
    res.json(listing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});




module.exports = router;
