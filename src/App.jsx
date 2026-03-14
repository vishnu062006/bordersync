import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NewEntryPage from './pages/NewEntryPage';
import AlertsPage from './pages/AlertsPage';
import RiskAnalysisPage from './pages/RiskAnalysisPage';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { TravelerFlowProvider } from './context/TravelerFlowContext';

function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <main className="flex-1 p-8" style={{ marginLeft: '220px' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TravelerFlowProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/new-entry" element={<NewEntryPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/risk-analysis" element={<RiskAnalysisPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TravelerFlowProvider>
    </AuthProvider>
  );
}
