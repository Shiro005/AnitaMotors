import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import WorkersPage from './Pages/Worker/Worker';
import WorkerDetailsPage from './Pages/Worker/WorkerDetails';
import SparePartsManagement from './Pages/SpareParts/SpareParts';
import Dashboard from './Pages/Dashboard/Dashboard';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-indigo-600 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">EV Store Manager</h1>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workers" element={<WorkersPage />} />
          <Route path="/spare-parts" element={<SparePartsManagement />} />
          <Route path="/worker/:workerId" element={<WorkerDetailsPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;