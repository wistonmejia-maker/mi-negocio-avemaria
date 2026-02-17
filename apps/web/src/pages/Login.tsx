// Mi Negocio AVEMARÍA — Login Page

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import './Login.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error, clearError } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/');
        } catch {
            // Error is already set in store
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-logo">
                    <h1>AVEMARÍA</h1>
                    <p>Mi Negocio</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Correo electrónico</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => { clearError(); setEmail(e.target.value); }}
                            placeholder="yo@minegocio.com"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => { clearError(); setPassword(e.target.value); }}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>

                <div className="login-footer">
                    AVEMARÍA © 2026
                </div>
            </div>
        </div>
    );
}
