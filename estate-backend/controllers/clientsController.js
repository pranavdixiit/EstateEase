const Client = require('../models/Client');
const { io } = require('../server');


// Get all clients for logged-in agent or admin
const getClients = async (req, res) => {
  try {
    let clients;

    if (req.user.role === 'admin') {
      clients = await Client.find()
        .populate('agent', 'name email')
        .populate('property', 'title');  // Assuming Client schema has property ref
    } else {
      clients = await Client.find({ agent: req.user.id })
        .populate('property', 'title')
        .populate('agent', 'name email');
    }

    res.json(clients);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};


// Get client by ID
const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('agent', 'name email')
      .populate('property', 'title');

    if (!client) return res.status(404).json({ msg: 'Client not found' });

    if (req.user.role !== 'admin' && client.agent.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(client);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};


// Create a new client
const createClient = async (req, res) => {
  try {
    const { name, email, phone, notes, property } = req.body;

    // No duplicate check, always create new client
    const client = new Client({
      name,
      email,
      phone,
      notes,
      agent: req.user.id,
      property
    });

    await client.save();

    const populatedClient = await Client.findById(client._id)
      .populate('agent', 'name email')
      .populate('property', 'title');

    res.status(201).json(populatedClient);
  } catch (err) {
    res.status(400).json({ msg: 'Bad request', error: err.message });
  }
};




// Update existing client
const updateClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ msg: 'Client not found' });

    if (req.user.role !== 'admin' && client.agent.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    Object.assign(client, req.body);
    await client.save();

    const populatedClient = await Client.findById(client._id)
      .populate('agent', 'name email')
      .populate('property', 'title');

    res.json(populatedClient);
  } catch (err) {
    res.status(400).json({ msg: 'Bad request', error: err.message });
  }
};


// Delete a client
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ msg: 'Client not found' });

    if (req.user.role !== 'admin' && client.agent.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    await client.deleteOne();

    res.json({ msg: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};


const confirmClientRequest = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ msg: 'Client not found' });

    // Authorization: only assigned agent or admin
    if (req.user.role !== 'admin' && client.agent.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Update client status to confirmed
    client.status = 'confirmed';  // Make sure your Client schema supports 'status' field
    await client.save();

    // Return populated updated client
    const populatedClient = await Client.findById(client._id)
      .populate('agent', 'name email')
      .populate('property', 'title');

    res.json(populatedClient);
    io.emit('newClient', populatedClient);
  } catch (err) {
    res.status(400).json({ msg: 'Bad request', error: err.message });
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  confirmClientRequest,
};
