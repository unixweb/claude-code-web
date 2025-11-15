"use client";

import { useEffect, useState } from "react";
import { LocationResponse, Location } from "@/types/location";
import { getDevice } from "@/lib/devices";

export default function DevicesPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // Fetch directly from n8n (client-side)
        const response = await fetch("https://n8n.unixweb.home64.de/webhook/location");
        const data: LocationResponse = await response.json();
        setLocations(data.history.filter((loc) => loc.user_id == 0)); // Loose equality (handles "0" or 0)
      } catch (err) {
        console.error("Failed to fetch locations", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
    const interval = setInterval(fetchLocations, 5000);
    return () => clearInterval(interval);
  }, []);

  // Group by device and get latest location
  const deviceStatus = Object.entries(
    locations.reduce((acc, loc) => {
      const deviceId = loc.username;
      if (!acc[deviceId] || new Date(loc.timestamp) > new Date(acc[deviceId].timestamp)) {
        acc[deviceId] = loc;
      }
      return acc;
    }, {} as Record<string, Location>)
  ).map(([deviceId, loc]) => ({
    device: getDevice(deviceId),
    lastLocation: loc,
  }));

  if (loading) {
    return <div>Loading devices...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Device Management</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Add Device
        </button>
      </div>

      {/* Device Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {deviceStatus.map(({ device, lastLocation }) => {
          const lastSeen = new Date(lastLocation.timestamp);
          const isRecent =
            Date.now() - lastSeen.getTime() < 10 * 60 * 1000; // 10 minutes

          return (
            <div
              key={device.id}
              className="bg-white rounded-lg shadow-md p-6 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center"
                    style={{ backgroundColor: device.color }}
                  >
                    <span className="text-white text-xl">📱</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {device.name}
                    </h3>
                    <p className="text-sm text-gray-500">ID: {device.id}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isRecent
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {isRecent ? "Online" : "Offline"}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Seen:</span>
                  <span className="font-medium text-gray-900">
                    {lastLocation.display_time}
                  </span>
                </div>

                {lastLocation.battery !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Battery:</span>
                    <span className="font-medium text-gray-900">
                      {lastLocation.battery}%
                    </span>
                  </div>
                )}

                {lastLocation.speed !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Speed:</span>
                    <span className="font-medium text-gray-900">
                      {(lastLocation.speed * 3.6).toFixed(1)} km/h
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium text-gray-900">
                    {Number(lastLocation.latitude).toFixed(5)},{" "}
                    {Number(lastLocation.longitude).toFixed(5)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium">
                  View History
                </button>
                <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium">
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {deviceStatus.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No devices found. Add a device to get started.
        </div>
      )}
    </div>
  );
}
