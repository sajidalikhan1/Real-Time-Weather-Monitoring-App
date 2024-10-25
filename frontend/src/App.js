import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TextField, Button, Typography, Box, Paper, Grid, 
} from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import OpacityIcon from '@mui/icons-material/Opacity';
import AirIcon from '@mui/icons-material/Air';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import WbSunnyIcon from '@mui/icons-material/WbSunny';

function App() {
  const [location, setLocation] = useState('');
  const [currentLocationName, setCurrentLocationName] = useState('');
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await axios.get(
              `http://localhost:5000/api/weather/coords?lat=${latitude}&lon=${longitude}`
            );
            setWeather(response.data);
            setCurrentLocationName(response.data.name);
            fetchForecast(response.data.name);
          } catch (err) {
            setError('Failed to fetch weather for your location.');
          }
        },
        (err) => setError('Geolocation not available.')
      );
    }
  }, []);

  const fetchWeather = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/weather/city?location=${location}`
      );
      setWeather(response.data);
      setError('');
      fetchForecast(location);
    } catch (err) {
      setError('Failed to fetch weather data.');
    }
  };

  const fetchForecast = async (loc) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/weather/forecast?location=${loc}`
      );

      const groupedData = groupByDay(response.data.list);
      setForecast(groupedData);
      setError('');
    } catch (err) {
      setError('Failed to fetch forecast data.');
    }
  };

  const groupByDay = (forecastList) => {
    const days = {};

    forecastList.forEach((item) => {
      const date = new Date(item.dt * 1000).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });

      if (!days[date]) {
        days[date] = [];
      }
      days[date].push(item);
    });

    return Object.entries(days).map(([day, data]) => {
      const temps = data.map((entry) => entry.main.temp);
      return {
        day,
        minTemp: Math.min(...temps),
        maxTemp: Math.max(...temps),
        avgTemp: (temps.reduce((sum, t) => sum + t, 0) / temps.length).toFixed(1),
        condition: data[0].weather[0].main,
        humidity: data[0].main.humidity,
        windSpeed: (data[0].wind.speed * 3.6).toFixed(1),
      };
    });
  };

  const getWeatherIconUrl = (condition) => {
    const iconBaseUrl = 'https://ssl.gstatic.com/onebox/weather/64/';
    const conditionIcons = {
      clear: 'sunny.png',
      clouds: 'cloudy.png',
      rain: 'rain_light.png',
      snow: 'snow.png',
      thunderstorm: 'thunderstorms.png',
      drizzle: 'rain_s_cloudy.png',
    };

    return iconBaseUrl + (conditionIcons[condition.toLowerCase()] || 'cloudy.png');
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      sx={{ backgroundColor: '#E0F7FA' }} // Sky blue background
    >
      <Paper 
        elevation={3} 
        sx={{ padding: 4, width: '80%', maxWidth: '1200px', backgroundColor: '#ffffff', borderRadius: '10px' }}
      >
        <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', color: '#0288D1', fontWeight: 'bold' }}>
          Weather Monitoring
        </Typography>

        {currentLocationName && (
          <Typography variant="h6" color="textSecondary" sx={{ textAlign: 'center', marginBottom: 2 }}>
            Current Location: {currentLocationName}
          </Typography>
        )}

        <TextField
          label="Enter Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          fullWidth
          margin="normal"
          sx={{
            input: { color: '#01579B' },
            label: { color: '#01579B' },
          }}
        />

        <Button
          variant="contained"
          onClick={fetchWeather}
          fullWidth
          sx={{ marginTop: 2, backgroundColor: '#0288D1', color: '#FFFFFF', '&:hover': { backgroundColor: '#01579B' } }}
        >
          Get Weather
        </Button>

        {location && (
          <Typography variant="subtitle1" sx={{ marginTop: 2, textAlign: 'center', color: '#0288D1' }}>
            Showing weather for: {location}
          </Typography>
        )}

        {error && (
          <Typography color="error" sx={{ marginTop: 2, textAlign: 'center' }}>
            {error}
          </Typography>
        )}

        {weather && (
          <Box mt={2}>
            <Typography variant="h6" sx={{ textAlign: 'center', color: '#01579B', fontWeight: 'bold' }}>Current Weather: {weather.name}</Typography>
            <Grid container spacing={2} sx={{ textAlign: 'center' }}>
              <Grid item xs={12} sm={6}>
                <ThermostatIcon sx={{ verticalAlign: 'middle', color: '#FF5722' }} /> Temperature: {weather.main.temp}°C
              </Grid>
              <Grid item xs={12} sm={6}>
                <DeviceThermostatIcon sx={{ verticalAlign: 'middle', color: '#FF9800' }} /> Feels Like: {weather.main.feels_like}°C
              </Grid>
              <Grid item xs={12} sm={6}>
                <OpacityIcon sx={{ verticalAlign: 'middle', color: '#2196F3' }} /> Humidity: {weather.main.humidity}%
              </Grid>
              <Grid item xs={12} sm={6}>
                <AirIcon sx={{ verticalAlign: 'middle', color: '#00BCD4' }} /> Wind Speed: {(weather.wind.speed * 3.6).toFixed(1)} km/h
              </Grid>
              <Grid item xs={12}>
                <WbSunnyIcon sx={{ verticalAlign: 'middle', color: '#FFC107' }} /> Condition: {weather.weather[0].main}{' '}
                <img src={getWeatherIconUrl(weather.weather[0].main)} alt={weather.weather[0].main} />
              </Grid>
            </Grid>
          </Box>
        )}

        {forecast.length > 0 && (
          <Box mt={4}>
            <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', color: '#0288D1', fontWeight: 'bold' }}>
              5-Day Forecast
            </Typography>
            <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
              {forecast.map((day, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Paper elevation={2} sx={{ padding: 2, backgroundColor: '#B2EBF2', borderRadius: '8px' }}>
                    <Typography variant="subtitle1" sx={{ textAlign: 'center', color: '#01579B', fontWeight: 'bold' }}>{day.day}</Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <ArrowDownwardIcon sx={{ verticalAlign: 'middle', color: '#D32F2F' }} /> Min: {day.minTemp}°C
                      </Grid>
                      <Grid item xs={6}>
                        <ArrowUpwardIcon sx={{ verticalAlign: 'middle', color: '#388E3C' }} /> Max: {day.maxTemp}°C
                      </Grid>
                      <Grid item xs={12}>
                        <ThermostatIcon sx={{ verticalAlign: 'middle', color: '#FF5722' }} /> Avg: {day.avgTemp}°C
                      </Grid>
                      <Grid item xs={12}>
                        <OpacityIcon sx={{ verticalAlign: 'middle', color: '#2196F3' }} /> Humidity: {day.humidity}%
                      </Grid>
                      <Grid item xs={12}>
                        <AirIcon sx={{ verticalAlign: 'middle', color: '#00BCD4' }} /> Wind Speed: {day.windSpeed} km/h
                      </Grid>
                      <Grid item xs={12}>
                        <WbSunnyIcon sx={{ verticalAlign: 'middle', color: '#FFC107' }} /> Condition: {day.condition}{' '}
                        <img src={getWeatherIconUrl(day.condition)} alt={day.condition} />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default App;
