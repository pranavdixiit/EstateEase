const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },       // buyer/requester
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // lister/seller
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  appointmentDate: { type: Date, required: true },
  notes: String,
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
