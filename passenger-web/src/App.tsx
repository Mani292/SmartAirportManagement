import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ReportIssue from './pages/ReportIssue';
import ChatBot from './pages/ChatBot';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ReportIssue />} />
        <Route path="/chat" element={<ChatBot />} />
      </Routes>
    </BrowserRouter>
  );
}
