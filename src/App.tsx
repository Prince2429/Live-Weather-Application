import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import WeatherDashboard from './components/WeatherDashboard.tsx';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-blue-600 text-white p-4">
          <h1 className="text-2xl font-bold">Weather Monitoring System</h1>
        </header>
        <main className="container mx-auto p-4">
          <WeatherDashboard />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;