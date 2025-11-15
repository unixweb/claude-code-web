"use client";

import { useEffect, useState } from "react";
import { LocationResponse } from "@/types/location";
import { DEVICES } from "@/lib/devices";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalDevices: 0,
    totalPoints: 0,
    lastUpdated: "",
    onlineDevices: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch directly from n8n (client-side)
        const response = await fetch("https://n8n.unixweb.home64.de/webhook/location");
        const data: LocationResponse = await response.json();

        const uniqueDevices = new Set(
          data.history
            .filter((loc) => loc.user_id == 0) // Loose equality (handles "0" or 0)
            .map((loc) => loc.username)
        );

        setStats({
          totalDevices: Object.keys(DEVICES).length,
          totalPoints: data.total_points || data.history.length,
          lastUpdated: data.last_updated || new Date().toISOString(),
          onlineDevices: uniqueDevices.size,
        });
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: "Total Devices",
      value: stats.totalDevices,
      icon: "📱",
    },
    {
      title: "Online Devices",
      value: stats.onlineDevices,
      icon: "🟢",
    },
    {
      title: "Total Locations",
      value: stats.totalPoints,
      icon: "📍",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-lg shadow p-6 flex items-center gap-4"
          >
            <div className="text-4xl">{stat.icon}</div>
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Device List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Configured Devices
          </h3>
        </div>
        <div className="p-6">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Color
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.values(DEVICES).map((device) => (
                <tr
                  key={device.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {device.id}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {device.name}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: device.color }}
                      />
                      <span className="text-sm text-gray-600">
                        {device.color}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-sm text-gray-500 text-right">
        Last updated: {new Date(stats.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}
