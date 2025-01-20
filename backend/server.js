const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { connectDB } = require('./config/database');
const userRoutes = require('./routes/userRoutes'); // Import routes here

const app = express(); // Initialize app first

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
connectDB();

// Use routes after initializing the app
app.use('/api/users', userRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('QR Attendance System Backend');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
