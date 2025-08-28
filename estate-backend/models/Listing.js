const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, min: 0, max: 5, required: true },
});

const ListingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    images: { type: [String], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // lister
    views: { type: Number, default: 0 },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    ratings: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        value: { type: Number, min: 0, max: 5 },
      },
    ],
    rating: { type: Number, default: 0 },
});



module.exports = mongoose.model('Listing', ListingSchema);
