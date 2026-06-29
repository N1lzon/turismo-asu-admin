import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PlacesPage from './pages/PlacesPage'
import PlaceEditPage from './pages/PlaceEditPage'
import RoutesPage from './pages/RoutesPage'
import RouteEditPage from './pages/RouteEditPage'
import ReportsPage from './pages/ReportsPage'
import MetricsEditPage from './pages/MetricsEditPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="lugares" element={<PlacesPage />} />
            <Route path="lugares/:id" element={<PlaceEditPage />} />
            <Route path="rutas" element={<RoutesPage />} />
            <Route path="rutas/:id" element={<RouteEditPage />} />
            <Route path="reportes" element={<ReportsPage />} />
            <Route path="reportes/editar-metricas" element={<MetricsEditPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
