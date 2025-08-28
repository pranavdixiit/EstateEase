const Appointment = require('../models/Appointment');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Client = require('../models/Client');



// ✅ Get all appointments for logged-in user
const getAppointments = async (req, res) => {
  try {
    const userId = req.user.id;

    // Outgoing requests (user booked someone else’s listing)
    const outgoing = await Appointment.find({ client: userId })
      .populate('recipient', 'name email')   // listing owner
      .populate('property', 'title price')
      .populate('client', 'name email');     // current user info (optional)

    // Incoming requests (someone booked this user’s listing)
    const incoming = await Appointment.find({ recipient: userId })
      .populate('client', 'name email')      // requester details
      .populate('property', 'title price')
      .populate('recipient', 'name email');  // current user (optional)

    res.json({ outgoing, incoming });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};


// ✅ Get single appointment
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('client', 'name email')
      .populate('recipient', 'name email')
      .populate('property', 'title price');

    if (!appointment) return res.status(404).json({ msg: 'Appointment not found' });

    // Authorization: logged-in user must be client or recipient
    if (
      appointment.client.toString() !== req.user.id &&
      appointment.recipient.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};


// ✅ Create new appointment
const createAppointment = async (req, res) => {
  try {
    const { property, appointmentDate, notes } = req.body;

    // Find the listing
    const listing = await Listing.findById(property);
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });

    // recipient = owner of the listing
    const recipientId = listing.userId || listing.listerId; // whichever you used in Listing schema

    // client = currently logged-in user
    const appointment = new Appointment({
      client: req.user.id,
      recipient: recipientId,
      property,
      appointmentDate,
      notes
    });

    await appointment.save();

    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ msg: 'Bad request', error: err.message });
  }
};


// ✅ Update an appointment (only those involved can do this)
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ msg: 'Appointment not found' });

    if (
      appointment.client.toString() !== req.user.id &&
      appointment.recipient.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    Object.assign(appointment, req.body);
    await appointment.save();

    res.json(appointment);
  } catch (err) {
    res.status(400).json({ msg: 'Bad request', error: err.message });
  }
};


// ✅ Delete an appointment (only those involved can delete)
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ msg: 'Appointment not found' });

    if (
      appointment.client.toString() !== req.user.id &&
      appointment.recipient.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    await appointment.deleteOne();
    res.json({ msg: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};


// ✅ Update Appointment status (pending / confirmed / cancelled)
const updateAppointmentStatus = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('client')     // to get client info from appointment
      .populate('property');  // to get property info

    if (!appointment) return res.status(404).json({ msg: 'Appointment not found' });

    // Authorization: client or recipient can update status
    if (
      appointment.client._id.toString() !== req.user.id &&
      appointment.recipient.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status value' });
    }

    appointment.status = status;
    await appointment.save();

    let clientRecord = null;

    // If status is confirmed, create or update Client record accordingly
    if (status === 'confirmed') {
      // Check if client already exists by email + property
      clientRecord = await Client.findOne({ 
        email: appointment.client.email, 
        property: appointment.property._id 
      });

      if (!clientRecord) {
        // Create new client
        clientRecord = new Client({
          name: appointment.client.name,
          email: appointment.client.email,
          phone: appointment.client.phone || '',
          agent: appointment.recipient,         // The lister is the agent for client
          property: appointment.property._id,
          status: 'confirmed',
          paymentDone: false,
        });
      } else {
        // Update existing client record (optional: update property or status)
        clientRecord.property = appointment.property._id;
        clientRecord.status = 'confirmed';
      }

      await clientRecord.save();
    }

    // Populate appointment refs for response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('client', 'name email phone')
      .populate('recipient', 'name email')
      .populate('property', 'title price');

    // Populate client record for response if created/updated
    if (clientRecord) {
      clientRecord = await Client.findById(clientRecord._id)
        .populate('agent', 'name email')
        .populate('property', 'title');
    }

    // Send back both updated appointment and client data
    res.json({ appointment: populatedAppointment, client: clientRecord });
  } catch (err) {
    res.status(400).json({ msg: 'Bad request', error: err.message });
  }
};







// ✅ Notify Owner (Lister) - can be hooked up to email/push
const notifyLister = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await Appointment.findById(appointmentId)
      .populate('property')
      .populate('client', 'name email');

    if (!appointment) return res.status(404).json({ msg: 'Appointment not found' });

    const listing = appointment.property;
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });

    const lister = await User.findById(listing.userId || listing.listerId);
    if (!lister || !lister.email) return res.status(404).json({ msg: 'Lister not found' });

    // Replace this with actual mail/push notification
    console.log(`📢 Notifying lister ${lister.email} about appointment ${appointmentId}`);

    res.json({ msg: 'Lister notified successfully.' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};


module.exports = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
  notifyLister,
};
