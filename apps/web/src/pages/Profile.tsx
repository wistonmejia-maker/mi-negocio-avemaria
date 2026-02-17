import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import './shared.css';

export default function Profile() {
    const { user, updateProfile, isLoading, error } = useAuthStore();
    const [name, setName] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setBusinessName(user.businessName);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess(false);
        try {
            await updateProfile({ name, businessName });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            // Error managed by store
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Mi Perfil</h1>
                <p className="page-subtitle">Personaliza tu información y el nombre de tu negocio</p>
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group full-width">
                        <label className="form-label">Tu Nombre</label>
                        <input
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <p className="form-help">Tu nombre tal como aparecerá en el encabezado.</p>
                    </div>

                    <div className="form-group full-width">
                        <label className="form-label">Nombre del Negocio</label>
                        <input
                            type="text"
                            className="form-input"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            required
                        />
                        <p className="form-help">El nombre comercial de tu distribuidora.</p>
                    </div>

                    <div className="form-group full-width">
                        <label className="form-label">Email (No se puede cambiar)</label>
                        <input
                            type="email"
                            className="form-input"
                            value={user?.email || ''}
                            disabled
                            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message" style={{ color: '#2ecc71', marginBottom: '1rem' }}>✓ Perfil actualizado exitosamente</div>}

                    <div className="form-actions full-width">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
