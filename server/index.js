const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

app.use(cors());
app.use(express.json());

// WeatherData model with timestamps for data tracking
const WeatherDataSchema = new mongoose.Schema({
  city: { type: String, required: true },
  country: { type: String, required: true },
  temperature: { type: Number, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  isSaved: { type: Boolean, default: false },
}, { timestamps: true });

const WeatherData = mongoose.model('WeatherData', WeatherDataSchema);

// Route to save or update weather data
app.post('/api/weather', async (req, res) => {
  try {
    const { city, country, temperature, description, icon } = req.body;

    // Check if the location already exists
    const existingData = await WeatherData.findOne({ city, country });

    if (existingData) {
      existingData.temperature = temperature;
      existingData.description = description;
      existingData.icon = icon;
      await existingData.save();
      return res.json({ message: 'Weather data updated successfully', data: existingData });
    }

    // Save new weather data
    const newWeatherData = new WeatherData(req.body);
    await newWeatherData.save();
    res.json({ message: 'Weather data saved successfully', data: newWeatherData });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Route to fetch all saved weather data
app.get('/api/weather', async (req, res) => {
  try {
    const savedWeather = await WeatherData.find({ isSaved: true });
    res.json(savedWeather);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Route to toggle save status
app.patch('/api/weather/:id/save', async (req, res) => {
  try {
    const weatherData = await WeatherData.findById(req.params.id);
    if (!weatherData) {
      return res.status(404).json({ error: 'Weather data not found' });
    }

    weatherData.isSaved = !weatherData.isSaved; // Toggle save status
    await weatherData.save();
    res.json({ message: 'Save status updated', isSaved: weatherData.isSaved });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Route to fetch weather details by ID
app.get('/api/weather/:id', async (req, res) => {
  try {
    const weatherData = await WeatherData.findById(req.params.id);
    if (!weatherData) {
      return res.status(404).json({ error: 'Weather data not found' });
    }
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
