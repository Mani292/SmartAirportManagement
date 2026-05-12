import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Radio, Cpu, Settings, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Position map for known asset types on the terminal blueprint
const POSITION_MAP: Record<string, { x: number; y: number }> = {
  'Elevator':          { x: 80, y: 70 },
  'Baggage Conveyor':  { x: 60, y: 40 },
  'HVAC':              { x: 20, y: 30 },
  'Runway Lighting':   { x: 40, y: 80 },
  'Escalator':         { x: 30, y: 55 },
  'Digital Display':   { x: 70, y: 20 },
  'default':           { x: 50, y: 50 },
};

interface AssetHealth {
  asset_id: string;
  name: string;
  type: string;
  terminal: string;
  health: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'NO_DATA';
  criticality: string;
}

export default function DigitalTwin() {
  const [assets, setAssets] = useState<AssetHealth[]>([]);
  const [fleetStatus, setFleetStatus] = useState('LOADING');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchFleetHealth = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('access_token');
      const res = await fetch(`${API_URL}/iot/fleet-health?airport_id=SJC-01`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
        setFleetStatus(data.overall_status || 'UNKNOWN');
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error('Fleet health fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFleetHealth();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchFleetHealth, 30_000);
    return () => clearInterval(interval);
  }, [fetchFleetHealth]);

  const getPosition = (type: string, index: number) => {
    const base = POSITION_MAP[type] || POSITION_MAP['default'];
    // Slightly offset assets of same type to avoid overlap
    return { x: (base.x + index * 3) % 90, y: (base.y + index * 2) % 85 };
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Digital Twin Operations Center</h1>
          <p className="text-gray-500 mt-2 flex items-center gap-2">
            <Radio size={16} className="text-green-500 animate-pulse" />
            Live Airport Infrastructure — SJC-01
            {lastUpdated && (
              <span className="text-xs text-gray-400 ml-2">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <div className={`px-4 py-2 rounded-lg border shadow-sm flex items-center gap-2 text-sm font-bold ${
            fleetStatus === 'CRITICAL' ? 'bg-red-50 border-red-200 text-red-700' :
            fleetStatus === 'WARNING'  ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
            'bg-green-50 border-green-200 text-green-700'
          }`}>
            <ShieldCheck size={16} />
            Fleet: {fleetStatus}
          </div>
          <button
            onClick={fetchFleetHealth}
            className="px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Floor Plan */}
        <div className="lg:col-span-2 bg-[#0A192F] rounded-2xl p-6 shadow-2xl relative overflow-hidden h-[580px] border border-[#1E2D3D]">
          {/* Grid Background */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

          <h3 className="absolute top-5 left-5 text-[#64FFDA] font-mono text-xs tracking-widest flex items-center gap-2 z-10">
            <Cpu size={14} /> TERMINAL 1 — LIVE BLUEPRINT
          </h3>

          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-[#64FFDA] font-mono animate-pulse">Loading live telemetry...</div>
            </div>
          ) : assets.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 font-mono text-sm text-center">
                No assets found.<br />
                <span className="text-xs">POST telemetry data to begin monitoring.</span>
              </div>
            </div>
          ) : (
            assets.map((asset, idx) => {
              const pos = getPosition(asset.type, idx);
              const isCritical = asset.health === 'CRITICAL';
              const isWarning = asset.health === 'WARNING';
              return (
                <div
                  key={asset.asset_id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  {isCritical && <div className="absolute w-10 h-10 bg-red-500 rounded-full animate-ping opacity-20" />}
                  {isWarning && <div className="absolute w-10 h-10 bg-yellow-400 rounded-full animate-pulse opacity-10" />}

                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                    isCritical ? 'bg-red-500 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.8)]' :
                    isWarning  ? 'bg-yellow-500 border-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.5)]' :
                    asset.health === 'NO_DATA' ? 'bg-gray-600 border-gray-400' :
                    'bg-[#64FFDA] border-teal-300 shadow-[0_0_10px_rgba(100,255,218,0.4)]'
                  }`}>
                    {isCritical && <AlertTriangle size={10} className="text-white" />}
                  </div>

                  {/* Hover Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-7 w-48 bg-white rounded-xl shadow-xl p-3 z-20 pointer-events-none border border-gray-100">
                    <p className="font-bold text-gray-900 text-sm border-b pb-1 mb-2">{asset.name}</p>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Type:</span><span className="font-mono text-gray-900">{asset.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Health:</span>
                        <span className={`font-bold font-mono ${
                          isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'
                        }`}>{asset.health}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Criticality:</span><span className="font-mono text-gray-900">{asset.criticality}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Telemetry Panel */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3 overflow-y-auto max-h-[580px]">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Settings size={18} className="text-gray-400" /> Asset Registry ({assets.length})
          </h2>
          {assets.map(asset => (
            <div key={asset.asset_id} className={`p-3 rounded-xl border ${
              asset.health === 'CRITICAL' ? 'bg-red-50 border-red-200' :
              asset.health === 'WARNING'  ? 'bg-yellow-50 border-yellow-200' :
              'bg-gray-50 border-gray-100'
            }`}>
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-sm text-gray-900 truncate">{asset.name}</h4>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                  asset.health === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                  asset.health === 'WARNING'  ? 'bg-yellow-100 text-yellow-700' :
                  asset.health === 'NO_DATA'  ? 'bg-gray-100 text-gray-500' :
                  'bg-green-100 text-green-700'
                }`}>
                  {asset.health}
                </span>
              </div>
              <p className="text-xs text-gray-500">{asset.type} · {asset.terminal} · {asset.criticality}</p>
            </div>
          ))}
          {!loading && assets.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">No assets to display.</p>
          )}
        </div>
      </div>
    </div>
  );
}
