// routes/notifications.js

const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Appointment = require('../models/Appointment');
const authMiddleware = require('../middleware/auth');

// Return counts of new/unread clients and appointments
router.get('/counts',authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Count Clients where agent is user and not in seenBy
    const newClients = await Client.countDocuments({
      agent: userId,
      seenBy: { $ne: userId }
    });

    // Count Appointments where user is client or recipient and not in seenBy
    const newAppointments = await Appointment.countDocuments({
      $and: [
        { status: { $ne: 'cancelled' } }, // optionally exclude cancelled
        { seenBy: { $ne: userId }},
        {
          $or: [
            { client: userId },
            { recipient: userId }
          ]
        }
      ]
    });

    res.json({ newClients, newAppointments });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});


module.exports = router;
