// React import not needed with jsx: react-jsx transform
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ReportIssue from './pages/ReportIssue';
import ChatBot from './pages/ChatBot';
import TrackIncident from './pages/TrackIncident';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ReportIssue />} />
        <Route path="/chat" element={<ChatBot />} />
        <Route path="/track" element={<TrackIncident />} />
      </Routes>
    </BrowserRouter>
  );
}
