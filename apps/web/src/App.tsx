// Mi Negocio AVEMARÍA — App Router

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import InventoryPage from './pages/Inventory';
import PurchasesPage from './pages/Purchases';
import SaleFormPage from './pages/SaleForm';
import SaleHistoryPage from './pages/SaleHistory';
import AccountingPage from './pages/Accounting';
import ProfitsPage from './pages/Profits';
import CustomersPage from './pages/Customers';
import ProfilePage from './pages/Profile';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<DashboardPage />} />
                    <Route path="inventario" element={<InventoryPage />} />
                    <Route path="compras" element={<PurchasesPage />} />
                    <Route path="ventas" element={<SaleFormPage />} />
                    <Route path="historial" element={<SaleHistoryPage />} />
                    <Route path="contabilidad" element={<AccountingPage />} />
                    <Route path="ganancias" element={<ProfitsPage />} />
                    <Route path="clientas" element={<CustomersPage />} />
                    <Route path="perfil" element={<ProfilePage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
