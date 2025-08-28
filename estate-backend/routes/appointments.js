const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const Appointment = require('../models/Appointment');

const {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
  notifyLister,
} = require('../controllers/appointmentsController');

// Apply auth and role middleware to all routes
router.use(authMiddleware);
router.use(roleMiddleware(['agent', 'admin']));

// Place the markAllSeen route BEFORE parameterized routes to avoid routing conflicts
router.post('/markAllSeen', async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) return res.status(401).json({ msg: 'Unauthorized' });

    await Appointment.updateMany(
      {
        $or: [
          { client: userId },
          { recipient: userId }
        ],
        seenBy: { $ne: userId }
      },
      { $push: { seenBy: userId } }
    );

    res.json({ msg: 'All appointments marked as seen' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.get('/', getAppointments);
router.get('/:id', getAppointmentById);
router.post('/', createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

router.patch('/:id/status', updateAppointmentStatus);
router.post('/:id/notify-lister', notifyLister);

module.exports = router;
