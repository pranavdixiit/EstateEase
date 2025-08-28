const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  notes: String,
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  paymentDone: Boolean,
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);
