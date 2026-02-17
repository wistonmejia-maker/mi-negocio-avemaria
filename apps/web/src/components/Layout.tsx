// Mi Negocio AVEMARÍA — Layout Component

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import './Layout.css';

const navLinks = [
    { to: '/', label: 'Dashboard', icon: '📊' },
    { section: 'Gestión' },
    { to: '/inventario', label: 'Inventario', icon: '📦' },
    { to: '/compras', label: 'Compras', icon: '🛒' },
    { to: '/ventas', label: 'Registrar Venta', icon: '💰' },
    { to: '/historial', label: 'Historial de Ventas', icon: '📋' },
    { section: 'Finanzas' },
    { to: '/contabilidad', label: 'Contabilidad', icon: '📝' },
    { to: '/ganancias', label: 'Ganancias', icon: '💎' },
    { section: 'CRM' },
    { to: '/clientas', label: 'Mis Clientas', icon: '👩' },
    { section: 'Configuración' },
    { to: '/perfil', label: 'Mi Perfil', icon: '⚙️' },
];

export default function Layout() {
    const { user, fetchProfile, logout } = useAuthStore();
    const { sidebarOpen, toggleSidebar, closeSidebar } = useUIStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="app-layout">
            {/* Sidebar overlay (mobile) */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
                onClick={closeSidebar}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <h2>AVEMARÍA</h2>
                    <span>Mi Negocio</span>
                </div>

                <nav className="sidebar-nav">
                    {navLinks.map((item, i) => {
                        if ('section' in item) {
                            return (
                                <div key={i} className="sidebar-section-label">
                                    {item.section}
                                </div>
                            );
                        }
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to!}
                                end={item.to === '/'}
                                className={({ isActive }) =>
                                    `sidebar-link ${isActive ? 'active' : ''}`
                                }
                                onClick={closeSidebar}
                            >
                                <span className="icon">{item.icon}</span>
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <button className="sidebar-link" onClick={handleLogout}>
                        <span className="icon">🚪</span>
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="main-content">
                <header className="topbar">
                    <button className="menu-toggle" onClick={toggleSidebar}>
                        ☰
                    </button>
                    <div className="topbar-title">{user?.businessName || 'Mi Negocio AVEMARÍA'}</div>
                    <div className="topbar-right">
                        <span className="topbar-user">{user?.name || user?.email}</span>
                    </div>
                </header>

                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
