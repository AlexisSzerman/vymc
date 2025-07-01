// src/components/StatCard.jsx
import React from "react";

const StatCard = ({ title, value, icon }) => (
  <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-blue-100 dark:border-blue-700">
    <div className="flex-shrink-0">{icon}</div>
    <div className="ml-4">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

export default StatCard;
