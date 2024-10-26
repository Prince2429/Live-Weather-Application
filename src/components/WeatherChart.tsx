import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { WeatherData } from '../libs/typing'; // Assuming typing exists

interface WeatherChartProps {
  data: WeatherData[];
}

const WeatherChart: React.FC<WeatherChartProps> = ({ data }) => {
  const [selectedDuration, setSelectedDuration] = useState('24'); // Default to 24 hours

  // Prepare chart data from the received weather data
  const chartData = data.map(d => ({
    ...d,
    time: new Date(d.dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'GMT' }),
    temp: parseFloat(d.temp),
  }));

  // Function to filter chart data based on selected duration
  const getFilteredData = () => {
    const currentTime = new Date();
    const cutoffDate = new Date(currentTime);

    switch (selectedDuration) {
      case '24':
        cutoffDate.setHours(cutoffDate.getHours() - 24); // Set to 24 hours ago
        break;
      case '5':
        cutoffDate.setDate(cutoffDate.getDate() - 5); // Set to 5 days ago
        break;
      case '15':
        cutoffDate.setDate(cutoffDate.getDate() - 15); // Set to 15 days ago
        break;
      case '30':
        cutoffDate.setDate(cutoffDate.getDate() - 30); // Set to 30 days ago
        break;
      default:
        break;
    }

    // Filter chart data based on the cutoff date
    return chartData.filter(d => new Date(d.dt) >= cutoffDate);
  };

  // Get filtered data based on the selected duration
  const filteredData = getFilteredData();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">Temperature Trends for {data[0]?.city}</h3>

      <div className="mb-4">
        <label className="mr-2">Select Duration:</label>
        <select 
          value={selectedDuration} 
          onChange={(e) => setSelectedDuration(e.target.value)} 
          className="border border-gray-300 rounded p-2"
        >
          <option value="24">Last 24 Hours</option>
          <option value="5">Last 5 Days</option>
          <option value="15">Last 15 Days</option>
          <option value="30">Last 30 Days</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" label={{ value: 'Time', position: 'insideBottomRight', offset: -5 }} />
          <YAxis 
            label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} 
            ticks={[0, 5, 10, 15, 20, 25, 30, 35, 40]} // Custom ticks
            domain={[-10, 40]} // Adjust this range as needed
          />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="temp" name="Temperature" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeatherChart;
