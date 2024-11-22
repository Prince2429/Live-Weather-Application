import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';

interface Alert {
  id: number;
  city: string;
  message: string;
  timestamp: string;
}

const fetchAlerts = async (): Promise<Alert[]> => {
  const response = await axios.get('https://live-weather-application-sfnk.vercel.app/api/alerts');
  return response.data;
};

const AlertsPanel: React.FC = () => {
  const { data: alerts, isLoading, error } = useQuery<Alert[]>('alerts', fetchAlerts, {
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) return <div>Loading alerts...</div>;
  if (error) return <div>Error fetching alerts</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">Weather Alerts</h3>
      {alerts && alerts.length > 0 ? (
        <ul className="space-y-2">
          {alerts.map(alert => (
            <li key={alert.id} className="flex items-center space-x-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              <span>{alert.city}: {alert.message} - {new Date(alert.timestamp).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No active alerts at the moment.</p>
      )}
    </div>
  );
};

export default AlertsPanel;