import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import DashboardOverview from './pages/DashboardOverview';
import UserManagement from './pages/UserManagement';
import BranchManagement from './pages/BranchManagement';
import Attendance from './pages/Attendance';

// Dummy component for Settings
const Settings = () => <div><h1>Pengaturan</h1><div className="card"><p>Fitur ini dalam pengembangan.</p></div></div>;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="branches" element={<BranchManagement />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
