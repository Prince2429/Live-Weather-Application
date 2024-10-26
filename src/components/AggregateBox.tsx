// AggregateBox.tsx
import React from 'react';

interface AggregateBoxProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const AggregateBox: React.FC<AggregateBoxProps> = ({ title, value, icon }) => {
  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center space-x-2">
        {icon}
        <span className="text-lg font-semibold">{title}</span>
      </div>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
};

export default AggregateBox;
