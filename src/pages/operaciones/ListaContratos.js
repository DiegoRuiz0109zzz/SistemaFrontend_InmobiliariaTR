import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import '../Usuario.css';
import './Contrato.css';

const ListaContratos = () => {
    return (
        <div className="usuario-page contrato-page">
            <div className="container">
                <PageHeader
                    title="Lista de Contratos"
                    description="Seguimiento y estado de los contratos registrados."
                    icon="pi pi-list"
                />

                <div className="main-content">
                    <div className="content-card contrato-card">
                        <div className="card-header">
                            <h3>Contratos</h3>
                            <p>Listado general de contratos.</p>
                        </div>
                        <div className="empty-state">
                            <i className="pi pi-inbox"></i>
                            <p>No hay contratos registrados aun.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListaContratos;
