const express = require('express');
const { 
  fetchWeatherData, 
  fetchForecast, 
  fetchWeatherByCity, 
  fetchWeatherByCoords 
} = require('../services/weatherService');

const router = express.Router();

// Get weather by city name
router.get('/city', async (req, res) => {
  const { location } = req.query;
  if (!location) return res.status(400).json({ error: 'Location is required' });

  try {
    const data = await fetchWeatherByCity(location);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching weather by city:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Get weather by coordinates
router.get('/coords', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    const data = await fetchWeatherByCoords(lat, lon);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching weather by coordinates:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Get current weather data by city name
router.get('/current', async (req, res) => {
  const { location } = req.query;
  if (!location) return res.status(400).json({ error: 'Location is required' });

  try {
    const data = await fetchWeatherData(location);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching current weather:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Get 5-day forecast by city name
router.get('/forecast', async (req, res) => {
  const { location } = req.query;
  if (!location) return res.status(400).json({ error: 'Location is required' });

  try {
    const data = await fetchForecast(location);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching forecast:', error.message);
    res.status(500).json({ error: 'Failed to fetch forecast data' });
  }
});

module.exports = router;
