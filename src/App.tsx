import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { BlindBoxPage } from './pages/BlindBoxPage';
import { InventoryPage } from './pages/InventoryPage';
import { AssemblyPage } from './pages/AssemblyPage';
import { MissionsPage } from './pages/MissionsPage';
import { RepairPage } from './pages/RepairPage';
import { ComparePage } from './pages/ComparePage';
import { ConfigPage } from './pages/ConfigPage';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background-primary">
        <Navbar />
        <main className="pt-20 pb-8">
          <Routes>
            <Route path="/" element={<BlindBoxPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/assembly" element={<AssemblyPage />} />
            <Route path="/missions" element={<MissionsPage />} />
            <Route path="/repair" element={<RepairPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
