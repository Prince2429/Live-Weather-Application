import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Sun, Cloud, CloudRain, Snowflake, AlertTriangle, Thermometer, Wind, Droplet } from 'lucide-react';
import WeatherChart from './WeatherChart';
import AlertsPanel from './AlertsPanel';
import AggregateBox from './AggregateBox';
import { WeatherData } from '../libs/typing';

const cities = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad'];

// Updated fetch function to ensure all required parameters are fetched
const fetchWeatherData = async (city: string): Promise<WeatherData[]> => {
  try {
    const response = await axios.get(`http://localhost:5001/api/weather?city=${city}`);
    return response.data; // Ensure this returns humidity and wind speed as well as temp and feels_like
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};

const WeatherDashboard: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<string>(cities[0]);
  const { data, isLoading, error } = useQuery<WeatherData[]>(['weatherData', selectedCity], 
    () => fetchWeatherData(selectedCity), {
    refetchInterval: 300000,
  });

  if (isLoading) return <div className="text-center mt-8">Loading...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Error fetching weather data. Please check the console for more details.</div>;

  const cityData = data || [];

  const getAggregates = (data: WeatherData[]) => {
    const tempValues = data.map(d => parseFloat(d.temp)).filter(v => !isNaN(v));
    const feelsLikeValues = data.map(d => parseFloat(d.feels_like)).filter(v => !isNaN(v));
    const humidityValues = data.map(d => parseFloat(d.humidity)).filter(v => !isNaN(v));
    const windSpeedValues = data.map(d => parseFloat(d.wind_speed)).filter(v => !isNaN(v));
  
    const avgTemp = tempValues.length > 0 ? (tempValues.reduce((sum, value) => sum + value, 0) / tempValues.length).toFixed(2) : 'N/A';
    const avgFeelsLike = feelsLikeValues.length > 0 ? (feelsLikeValues.reduce((sum, value) => sum + value, 0) / feelsLikeValues.length).toFixed(2) : 'N/A';
    
    const maxTemp = tempValues.length > 0 ? Math.max(...tempValues).toFixed(2) : 'N/A';
    const minTemp = tempValues.length > 0 ? Math.min(...tempValues).toFixed(2) : 'N/A';
    const maxFeelsLike = feelsLikeValues.length > 0 ? Math.max(...feelsLikeValues).toFixed(2) : 'N/A';
    const minFeelsLike = feelsLikeValues.length > 0 ? Math.min(...feelsLikeValues).toFixed(2) : 'N/A';
  
    // Calculate averages for humidity and wind speed
    const avgHumidity = humidityValues.length > 0 ? (humidityValues.reduce((sum, value) => sum + value, 0) / humidityValues.length).toFixed(2) : 'N/A';
    const avgWindSpeed = windSpeedValues.length > 0 ? (windSpeedValues.reduce((sum, value) => sum + value, 0) / windSpeedValues.length).toFixed(2) : 'N/A';
  
    return {
      avgTemp,
      maxTemp,
      minTemp,
      avgFeelsLike,
      maxFeelsLike,
      minFeelsLike,
      avgHumidity,
      avgWindSpeed,
    };
  };
  

  const aggregates = getAggregates(cityData);

  // Icons for new parameters
  const tempIcon = <Sun className="w-6 h-6 text-yellow-500" />;
  const feelsLikeIcon = <Thermometer className="w-6 h-6 text-blue-300" />;
  const humidityIcon = <Droplet className="w-6 h-6 text-blue-500" />;
  const windSpeedIcon = <Wind className="w-6 h-6 text-gray-500" />;
  const maxTempIcon = <Thermometer className="w-6 h-6 text-red-600" />; // Red thermometer for max temp
  const minTempIcon = <Thermometer className="w-6 h-6 text-blue-400" />; // Blue thermometer for min temp

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return <Sun className="w-8 h-8 text-yellow-500" />;
      case 'cloudy':
        return <Cloud className="w-8 h-8 text-gray-500" />;
      case 'rain':
        return <CloudRain className="w-8 h-8 text-blue-500" />;
      case 'snow':
        return <Snowflake className="w-8 h-8 text-blue-300" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-b from-blue-100 to-blue-300 rounded-lg shadow-lg">
      <div className="flex justify-center space-x-4 mb-6">
        {cities.map(city => (
          <button
            key={city}
            onClick={() => setSelectedCity(city)}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${city === selectedCity ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-blue-600 hover:bg-blue-500 hover:text-white'}`}
          >
            {city}
          </button>
        ))}
      </div>

      {cityData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-gray-800">{selectedCity}</h2>
            {getWeatherIcon(cityData[cityData.length - 1].main)}
          </div>
          
          <p className="text-5xl font-extrabold text-gray-900">{parseFloat(cityData[cityData.length - 1].temp).toFixed(2)}°C</p>
          <p className="text-lg text-gray-600">Feels like: <span className="font-semibold">{parseFloat(cityData[cityData.length - 1].feels_like).toFixed(2)}°C</span></p>
          <p className="text-lg text-gray-600">Humidity: <span className="font-semibold">{cityData[cityData.length - 1].humidity}%</span></p>
          <p className="text-lg text-gray-600">Wind Speed: <span className="font-semibold">{cityData[cityData.length - 1].wind_speed} m/s</span></p>
          <p className="text-lg text-gray-600">Condition: <span className="font-semibold">{cityData[cityData.length - 1].main}</span></p>
          <p className="text-sm text-gray-500">Last updated: <span className="font-semibold">{new Date(cityData[cityData.length - 1].dt).toLocaleString('en-US', { timeZone: 'GMT' })}</span></p>
        </div>
      )}

<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
  <AggregateBox title="Average Temp" value={`${aggregates.avgTemp}°C`} icon={tempIcon} />
  <AggregateBox title="Max Temp" value={`${aggregates.maxTemp}°C`} icon={tempIcon} />
  <AggregateBox title="Min Temp" value={`${aggregates.minTemp}°C`} icon={tempIcon} />
  
  <AggregateBox title="Avg Feels Like" value={`${aggregates.avgFeelsLike}°C`} icon={feelsLikeIcon} />
  <AggregateBox title="Max Feels Like" value={`${aggregates.maxFeelsLike}°C`} icon={feelsLikeIcon} />
  <AggregateBox title="Min Feels Like" value={`${aggregates.minFeelsLike}°C`} icon={feelsLikeIcon} />

  <AggregateBox title="Avg Humidity" value={`${aggregates.avgHumidity}%`} icon={humidityIcon} />
  <AggregateBox title="Avg Wind Speed" value={`${aggregates.avgWindSpeed} m/s`} icon={windSpeedIcon} />
  
 
</div>




      <WeatherChart data={cityData} />
      <AlertsPanel />
    </div>
  );
};

export default WeatherDashboard;
