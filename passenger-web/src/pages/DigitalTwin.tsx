import React, { useState, useEffect } from 'react';
import { Activity, Radio, Cpu, Settings, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function DigitalTwin() {
  const [sensors, setSensors] = useState([
    { id: 'HVAC-12', type: 'climate', status: 'operational', x: 20, y: 30, temp: 72, vibration: 12 },
    { id: 'BAGGAGE-04', type: 'mechanical', status: 'operational', x: 60, y: 40, temp: 85, vibration: 25 },
    { id: 'ELEV-T1', type: 'mechanical', status: 'maintenance', x: 80, y: 70, temp: 75, vibration: 45 },
    { id: 'RUNWAY-22L', type: 'infrastructure', status: 'operational', x: 40, y: 80, temp: 65, vibration: 5 },
    { id: 'SERVER-MAIN', type: 'it', status: 'operational', x: 50, y: 50, temp: 68, vibration: 2 },
  ]);

  // Simulate real-time IoT anomaly
  useEffect(() => {
    const timer = setTimeout(() => {
      setSensors(prev => prev.map(s => 
        s.id === 'BAGGAGE-04' ? { ...s, status: 'critical', vibration: 88 } : s
      ));
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Digital Twin Operations Center</h1>
          <p className="text-gray-500 mt-2 flex items-center gap-2">
            <Radio size={16} className="text-green-500 animate-pulse" />
            Live Airport Infrastructure Telemetry
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-500"/>
            <span className="font-bold text-sm text-gray-700">Drone Fleet: Standby</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Floor Plan */}
        <div className="lg:col-span-2 bg-[#0A192F] rounded-2xl p-6 shadow-2xl relative overflow-hidden h-[600px] border border-[#1E2D3D]">
          {/* Grid Background */}
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px' 
          }} />
          
          <h3 className="absolute top-6 left-6 text-[#64FFDA] font-mono text-sm tracking-widest flex items-center gap-2">
            <Cpu size={16} /> TERMINAL 1 BLUEPRINT
          </h3>

          {/* Sensors Rendered on Map */}
          {sensors.map((sensor) => {
            const isCritical = sensor.status === 'critical';
            const isMaint = sensor.status === 'maintenance';
            
            return (
              <div 
                key={sensor.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
                style={{ left: `${sensor.x}%`, top: `${sensor.y}%` }}
              >
                {/* Ping Animation */}
                {isCritical && (
                  <div className="absolute w-12 h-12 bg-red-500 rounded-full animate-ping opacity-20" />
                )}
                
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-colors ${
                  isCritical ? 'bg-red-500 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.7)]' : 
                  isMaint ? 'bg-yellow-500 border-yellow-300' :
                  'bg-[#64FFDA] border-teal-200 shadow-[0_0_10px_rgba(100,255,218,0.3)]'
                }`}>
                  {isCritical && <AlertTriangle size={12} className="text-white" />}
                </div>

                {/* Tooltip Popup */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-8 w-48 bg-white rounded-lg shadow-xl p-3 z-20 pointer-events-none">
                  <p className="font-bold text-gray-900 text-sm border-b pb-1 mb-2">{sensor.id}</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Temp:</span>
                      <span className="font-mono text-gray-900">{sensor.temp}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vibration:</span>
                      <span className={`font-mono ${isCritical ? 'text-red-600 font-bold' : 'text-gray-900'}`}>{sensor.vibration} Hz</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Telemetry Panel */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Settings size={20} className="text-gray-400"/> System Telemetry
          </h2>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {sensors.map(sensor => (
              <div key={sensor.id} className={`p-4 rounded-xl border ${sensor.status === 'critical' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-sm text-gray-900">{sensor.id}</h4>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${
                    sensor.status === 'critical' ? 'bg-red-100 text-red-700' : 
                    sensor.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {sensor.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-white p-2 rounded border border-gray-100">
                    <p className="text-[10px] text-gray-500 uppercase">Temp</p>
                    <p className="font-mono text-sm">{sensor.temp}°C</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-100">
                    <p className="text-[10px] text-gray-500 uppercase">Vibration</p>
                    <p className={`font-mono text-sm ${sensor.status === 'critical' ? 'text-red-600 font-bold' : ''}`}>{sensor.vibration} Hz</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
