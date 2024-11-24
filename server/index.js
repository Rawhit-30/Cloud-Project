const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

app.use(cors());
app.use(express.json());

// WeatherData model with timestamp
const WeatherData = mongoose.model('WeatherData', {
  city: String,
  country: String,
  temperature: Number,
  description: String,
  icon: String,
  isSaved: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }, // Automatically set timestamp when saved
});

// Route to save weather data
app.post('/api/weather', async (req, res) => {
  try {
    const { city, country, temperature, description, icon } = req.body;
    if (!city || !country || !temperature || !description || !icon) {
      return res.status(400).json({ error: 'Missing required weather data' });
    }
    const weatherData = new WeatherData(req.body);
    await weatherData.save();
    res.json({ message: 'Weather data saved successfully', weatherData }); // Ensure that weatherData has _id
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to fetch all saved weather data
app.get('/api/weather', async (req, res) => {
  try {
    const savedWeather = await WeatherData.find({ isSaved: true });
    res.json(savedWeather);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to toggle the 'isSaved' flag (for saving or unsaving a location)
app.patch('/api/weather/:id/save', async (req, res) => {
  try {
    const weatherData = await WeatherData.findById(req.params.id);
    if (!weatherData) {
      return res.status(404).json({ error: 'Weather data not found' });
    }

    // Toggle the 'isSaved' field (save/unsave)
    weatherData.isSaved = !weatherData.isSaved;
    await weatherData.save();

    // Return the updated weather data after saving
    res.json({ message: 'Weather data save status updated', isSaved: weatherData.isSaved, weatherData });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to fetch the most recently saved weather data
app.get('/api/weather/saved', async (req, res) => {
  try {
    const savedWeather = await WeatherData.findOne({ isSaved: true }).sort({ timestamp: -1 }); // Sort by timestamp descending
    if (!savedWeather) {
      return res.status(404).json({ message: 'No saved weather data found' });
    }
    res.json(savedWeather);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to delete saved weather data by ID
app.delete('/api/weather/:id', async (req, res) => {
  try {
    const weatherDataId = req.params.id;

    // Find and delete the weather data by ID
    const weatherData = await WeatherData.findByIdAndDelete(weatherDataId);
    
    if (!weatherData) {
      return res.status(404).json({ error: 'Weather data not found' });
    }

    res.status(200).json({ message: 'Weather data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
