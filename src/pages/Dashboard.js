import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from 'primereact/card';

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div className="flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <Card className="w-full md:w-6 lg:w-4 text-center surface-card p-4 shadow-4 border-round-xl">
                <div className="flex justify-content-center mb-4">
                    <div className="p-3 border-round-circle" style={{ backgroundColor: 'var(--theme-primary)' }}>
                        <i className="pi pi-user text-4xl text-white"></i>
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-900 mb-2">Bienvenido, {user?.nombre || user?.username}</h1>
                <p className="text-500 text-lg m-0">Has iniciado sesión correctamente.</p>
            </Card>
        </div>
    );
};

export default Dashboard;
