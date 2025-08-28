const fs = require('fs');
const path = require('path');
const http = require('http');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',       // Localhost origin
  'https://pranavdixiit.github.io/EstateEase',// GitHub Pages origin (replace with actual URL)
  'https://estateease-cz25.onrender.com'  // Render app origin (replace with actual URL)
];

app.use(cors({
  origin: function(origin, callback){
    // Allow requests with no origin like mobile apps or curl requests
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  allowedHeaders: ['Authorization', 'Content-Type'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}));


app.use(express.json());
app.use('/uploads', express.static('uploads'));

const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const clientRoutes = require('./routes/clients');
const appointmentRoutes = require('./routes/appointments');
const uploadRoutes = require('./routes/upload');
const notificationsRoutes = require('./routes/notifications');


app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationsRoutes);


const server = http.createServer(app);

// Remove socket-related code completely here
// No Socket.io initialization or export

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
