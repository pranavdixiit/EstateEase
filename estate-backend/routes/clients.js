const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const Client = require('../models/Client');
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  confirmClientRequest,    // Import the new controller
} = require('../controllers/clientsController');

router.use(authMiddleware);
router.use(roleMiddleware(['agent', 'admin']));

// New route: mark all clients as seen - place before parameterized routes
router.post('/markAllSeen', async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) return res.status(401).json({ msg: 'Unauthorized' });

    await Client.updateMany(
      {
        agent: userId,
        seenBy: { $ne: userId }
      },
      { $push: { seenBy: userId } }
    );

    res.json({ msg: 'All clients marked as seen' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.get('/', getClients);
router.get('/:id', getClientById);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

// New route: confirm client request
router.put('/:id/confirm', confirmClientRequest);

// Mark single client as seen route
router.post('/:id/markSeen', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ msg: 'Client not found' });

    if (!client.seenBy) client.seenBy = [];

    if (!client.seenBy.includes(req.user.id)) {
      client.seenBy.push(req.user.id);
      await client.save();
    }

    res.json({ msg: 'Client marked as seen' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

module.exports = router;
