// React import not needed with jsx: react-jsx transform
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ReportIssue from './pages/ReportIssue';
import ChatBot from './pages/ChatBot';
import TrackIncident from './pages/TrackIncident';
import PublicDashboard from './pages/PublicDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ReportIssue />} />
        <Route path="/chat" element={<ChatBot />} />
        <Route path="/track" element={<TrackIncident />} />
        <Route path="/dashboard" element={<PublicDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
