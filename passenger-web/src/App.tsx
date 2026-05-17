// React import not needed with jsx: react-jsx transform
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ReportIssue from './pages/ReportIssue';
import ChatBot from './pages/ChatBot';
import TrackIncident from './pages/TrackIncident';
import PublicDashboard from './pages/PublicDashboard';
import DigitalTwin from './pages/DigitalTwin';
import FlightStatus from './pages/FlightStatus';
import AdminConsole from './pages/admin/AdminConsole';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Passenger portal */}
        <Route path="/" element={<ReportIssue />} />
        <Route path="/chat" element={<ChatBot />} />
        <Route path="/track" element={<TrackIncident />} />
        <Route path="/dashboard" element={<PublicDashboard />} />
        <Route path="/twin" element={<DigitalTwin />} />
        <Route path="/flights" element={<FlightStatus />} />
        {/* Admin Console — role-gated internally */}
        <Route path="/admin" element={<AdminConsole />} />
        <Route path="/admin/*" element={<AdminConsole />} />
      </Routes>
    </BrowserRouter>
  );
}
