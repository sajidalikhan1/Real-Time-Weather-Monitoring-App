const mongoose = require('mongoose');

// Weather Data Schema
const weatherSchema = new mongoose.Schema({
  location: String,
  temperature: Number,
  humidity: Number, // New field for humidity
  wind_speed: Number, // New field for wind speed
  feels_like: Number,
  condition: String,
  timestamp: { type: Date, default: Date.now },


  breachedThreshold: { type: Boolean, default: false }, // Track if alert was triggered
});


// Daily Summary Schema with additional parameters
const dailySummarySchema = new mongoose.Schema({
  location: String,
  date: String,
  avgTemp: Number,
  maxTemp: Number,
  minTemp: Number,
  avgHumidity: Number, // New field for average humidity
  avgWindSpeed: Number, // New field for average wind speed
  dominantCondition: String,
});

const Weather = mongoose.model('Weather', weatherSchema);
const DailySummary = mongoose.model('DailySummary', dailySummarySchema);

module.exports = { Weather, DailySummary };
