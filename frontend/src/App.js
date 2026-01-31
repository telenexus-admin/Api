import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import InstancesPage from "./pages/InstancesPage";
import InstanceDetailPage from "./pages/InstanceDetailPage";
import ApiKeysPage from "./pages/ApiKeysPage";
import WebhooksPage from "./pages/WebhooksPage";
import LogsPage from "./pages/LogsPage";
import PlaygroundPage from "./pages/PlaygroundPage";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="instances" element={<InstancesPage />} />
            <Route path="instances/:id" element={<InstanceDetailPage />} />
            <Route path="api-keys" element={<ApiKeysPage />} />
            <Route path="webhooks" element={<WebhooksPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="playground" element={<PlaygroundPage />} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-right" 
        theme="dark"
        toastOptions={{
          style: {
            background: '#121212',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#FAFAFA',
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
