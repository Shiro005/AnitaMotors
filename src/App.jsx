import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WorkersPage from './Pages/Worker/Worker';
import WorkerDetailsPage from './Pages/Worker/WorkerDetails';
import SparePartsManagement from './Pages/SpareParts/SpareParts';
import Dashboard from './Pages/Dashboard/Dashboard';
import Vehicles from './Pages/VehicleEntry/Vechicle';
import Layout from './Layout';
import ThirdParty from './Pages/Third-Party/ThirdParty';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="workers" element={<WorkersPage />} />
            <Route path="spare-parts" element={<SparePartsManagement />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="maintenance" element={<ThirdParty />} />
            <Route path="worker/:workerId" element={<WorkerDetailsPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
};

export default App;