const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const weatherRoute = require('./routes/weather');
// require('dotenv').config();
const dotenv = require('dotenv');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/weather', weatherRoute);

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));

