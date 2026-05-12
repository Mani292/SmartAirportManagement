import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { Shield, Activity, Clock, Server } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "https://smart-airport.vercel.app/api/v1";

const COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#0088FE'];

export default function PublicDashboard() {
  const [stats, setStats] = useState({ total: 0, open: 0, critical: 0, resolved: 0 });
  
  // Dummy data for visual enterprise feel
  const trendData = [
    { name: 'Mon', incidents: 4, ai_detected: 2 },
    { name: 'Tue', incidents: 3, ai_detected: 1 },
    { name: 'Wed', incidents: 7, ai_detected: 5 },
    { name: 'Thu', incidents: 2, ai_detected: 1 },
    { name: 'Fri', incidents: 6, ai_detected: 4 },
  ];

  const pieData = [
    { name: 'HVAC', value: 400 },
    { name: 'Baggage', value: 300 },
    { name: 'Security', value: 300 },
    { name: 'Runway', value: 200 },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/incidents/`);
        const incidents = res.data?.result || [];
        setStats({
          total: incidents.length,
          open: incidents.filter((i: any) => ["1", "2"].includes(i.state)).length,
          resolved: incidents.filter((i: any) => i.state === "6").length,
          critical: incidents.filter((i: any) => i.priority === "1").length,
        });
      } catch (e) {
        console.log("Failed to fetch incidents", e);
      }
    };
    fetchStats();
    
    // Simulate real-time updates
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Enterprise Operations Command</h1>
        <p className="text-gray-500 mt-2">Real-time infrastructure health and predictive analytics</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Activity size={24} /></div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Active Incidents</p>
            <p className="text-3xl font-black text-gray-900">{stats.open}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg"><Shield size={24} /></div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Critical Failures</p>
            <p className="text-3xl font-black text-red-600">{stats.critical}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Server size={24} /></div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Resolved</p>
            <p className="text-3xl font-black text-green-600">{stats.resolved}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Clock size={24} /></div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Avg MTTR</p>
            <p className="text-3xl font-black text-purple-600">2.4h</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Incident & Anomaly Trends (7 Days)</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="incidents" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="ai_detected" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Asset Failure Distribution</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
