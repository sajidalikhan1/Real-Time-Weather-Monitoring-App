const axios = require('axios');
const { Weather, DailySummary } = require('../db/weatherModel');
const cron = require('node-cron');
require('dotenv').config();

const API_KEY = process.env.API_KEY;

const THRESHOLD_TEMP = 35; // Temperature threshold
const THRESHOLD_CONDITION = 'Rain'; // Example for specific weather condition

// Fetch weather data by location name
async function fetchWeatherByCity(location) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching weather for ${location}: ${error.message}`);
    throw error;
  }
}

// Fetch weather data by coordinates
async function fetchWeatherByCoords(lat, lon) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching weather by coordinates: ${error.message}`);
    throw error;
  }
}

// Fetch weather data (current) by location name
async function fetchWeatherData(location, unit = 'metric') {
  try {
    const units = unit === 'metric' ? 'Celsius' : 'Fahrenheit';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=${unit}`;
    const response = await axios.get(url);
    console.log(`Temperature in ${location}: ${response.data.main.temp}°${units}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch weather data for ${location}: ${error.message}`);
    throw error;
  }
}

// Fetch 5-day forecast by city name
async function fetchForecast(location) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${API_KEY}&units=metric`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching forecast for ${location}: ${error.message}`);
    throw error;
  }
}

// Save weather data to MongoDB
async function saveWeatherData(data) {
  const weather = new Weather({
    location: data.name,
    temperature: data.main.temp,

    humidity: data.main.humidity, // Store humidity
    wind_speed: data.wind.speed, // Store wind speed

    feels_like: data.main.feels_like,
    condition: data.weather[0].main,
    timestamp: new Date(),
  });

  try {
    await weather.save();
    console.log(`Weather data saved for ${data.name}`);
    return weather;
  } catch (error) {
    console.error(`Error saving weather data: ${error.message}`);
    throw error;
  }
}

// Check temperature threshold breach
async function checkThresholdAndAlert(location) {
  const recentWeather = await Weather.find({ location }).sort({ timestamp: -1 }).limit(2);
  if (recentWeather.length === 2) {
    const [latest, previous] = recentWeather;
    const bothBreached = latest.temperature > THRESHOLD_TEMP && previous.temperature > THRESHOLD_TEMP;

    const conditionBreached = latest.condition === THRESHOLD_CONDITION && previous.condition === THRESHOLD_CONDITION;

    if (bothBreached && !latest.breachedThreshold) {
      console.log(`⚠️ Alert! Temperature in ${location} exceeded ${THRESHOLD_TEMP}°C for two consecutive updates.`);
      alert(`⚠️ Alert! Temperature in ${location} exceeded ${THRESHOLD_TEMP}°C for two consecutive updates.`)
      latest.breachedThreshold = true;
      await latest.save();
    }

    if (conditionBreached) {
      console.log(`- Weather condition is ${THRESHOLD_CONDITION} for two consecutive updates.`);
    }
  }
}

async function simulateThresholdBreach() {
  const updates = [
    { temperature: 36, condition: 'Clear' },  // First breach
    { temperature: 37, condition: 'Clear' }   // Second breach
  ];
  for (const update of updates) {
    const weather = new Weather({
      location: 'Delhi',
      temperature: update.temperature,
      condition: update.condition,
    });
    await weather.save();
  }
  await checkThresholdAndAlert('Delhi');
}


// Calculate and save daily summary
async function calculateDailySummary(location) {
  const today = new Date().toISOString().split('T')[0];
  const data = await Weather.find({ location, timestamp: { $gte: new Date(today) } });

  if (data.length === 0) {
    console.log(`No data available for ${location} on ${today}`);
    return;
  }

  const maxTemp = Math.max(...data.map(entry => entry.temperature));
  const minTemp = Math.min(...data.map(entry => entry.temperature));
  const avgTemp = data.reduce((sum, entry) => sum + entry.temperature, 0) / data.length;

  // Handle missing humidity and wind speed data
  const humidityData = data.map(entry => entry.humidity).filter(h => h != null); // Only include valid values
  const windSpeedData = data.map(entry => entry.wind_speed).filter(w => w != null); // Only include valid values


  // Calculate average humidity, fallback to 0 if no data
  const avgHumidity = humidityData.length > 0
  ? humidityData.reduce((sum, h) => sum + h, 0) / humidityData.length
  : 0; 

  // Calculate average wind speed in km/h (1 m/s = 3.6 km/h), fallback to 0 if no data
  const avgWindSpeed = windSpeedData.length > 0
  ? windSpeedData.reduce((sum, w) => sum + w, 0) / windSpeedData.length
  : 0;

  const dominantCondition = data
    .map(entry => entry.condition)
    .reduce((a, b, _, arr) =>
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
    );

  const summary = new DailySummary({
    location,
    date: today,
    maxTemp,
    minTemp,
    avgTemp,
    avgHumidity, // Store average humidity
    avgWindSpeed, // Store average wind speed
    dominantCondition,
  });

  try {
    await summary.save();
    console.log(`Daily summary saved for ${location}`);
  } catch (error) {
    console.error(`Error saving daily summary: ${error.message}`);
    throw error;
  }
}


async function simulateWeatherUpdates(location) {
  const updates = [
    { temperature: 25, condition: 'Clear' },
    { temperature: 28, condition: 'Clear' },
    { temperature: 22, condition: 'Clouds' },
    { temperature: 30, condition: 'Clear' }
  ];
  for (const update of updates) {
    const weather = new Weather({
      location,
      temperature: update.temperature,
      condition: update.condition,
    });
    await weather.save();
  }
  await calculateDailySummary(location);
}


// Cron job to update weather every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('Fetching weather data every 5 minutes');
  const locations = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad'];

  for (const location of locations) {
    try {
      const data = await fetchWeatherData(location);
      console.log(`Weather data for ${location}:`, data);
      await saveWeatherData(data);
      await calculateDailySummary(location);

      await checkThresholdAndAlert(location); // Check for threshold breaches
    } catch (error) {
      console.error(`Error processing weather data for ${location}: ${error.message}`);
    }
  }
});

// Export functions
module.exports = {
  fetchWeatherData,
  fetchForecast,
  saveWeatherData,
  checkThresholdAndAlert,
  fetchWeatherByCity,
  fetchWeatherByCoords,
};
