import React from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import PageHeader from '../components/ui/PageHeader';
import './Usuario.css';
import './Empresas.css';

// Módulo de Configuración de Empresa (solo UI por ahora)
const Empresas = () => {
    const departamentos = [
        { label: 'Seleccione un departamento', value: null },
        { label: 'Lima', value: 'LIMA' },
        { label: 'Arequipa', value: 'AREQUIPA' }
    ];

    const provincias = [
        { label: 'Seleccione una provincia', value: null }
    ];

    const distritos = [
        { label: 'Seleccione un distrito', value: null }
    ];

    return (
        <div className="usuario-page empresa-page">
            <div className="container">
                <PageHeader
                    title="Configuración de la Empresa"
                    description="Administra la configuración general y opciones de tu sistema."
                    icon="pi pi-building"
                />

                <div className="main-content">
                    <TabView className="empresa-tabview">
                        <TabPanel header="Datos Generales" leftIcon="pi pi-list mr-2">
                            <div className="empresa-grid">
                                <div className="content-card empresa-card-left">
                                    <h2 className="empresa-section-title">Información Principal</h2>

                                    <div className="formgrid grid">
                                        <div className="field col-12 md:col-6">
                                            <label className="empresa-label" htmlFor="ruc">RUC *</label>
                                            <div className="p-inputgroup">
                                                <InputText id="ruc" placeholder="Ingrese RUC de 11 dígitos" />
                                                <Button icon="pi pi-search" className="p-button-outlined" tooltip="Buscar RUC" />
                                            </div>
                                            <small className="empresa-hint">Busque el comprobante de 11 dígitos</small>
                                        </div>

                                        <div className="field col-12 md:col-6">
                                            <label className="empresa-label" htmlFor="razonSocial">Razón Social *</label>
                                            <InputText id="razonSocial" placeholder="Razón social registrada" />
                                        </div>

                                        <div className="field col-12 md:col-6">
                                            <label className="empresa-label" htmlFor="nombreComercial">Nombre Comercial</label>
                                            <InputText id="nombreComercial" placeholder="Nombre comercial" />
                                        </div>

                                        <div className="field col-12 md:col-6">
                                            <label className="empresa-label" htmlFor="ubigeo">Ubigeo</label>
                                            <div className="p-inputgroup">
                                                <InputText id="ubigeo" placeholder="Código de ubigeo" />
                                                <Button icon="pi pi-search" className="p-button-outlined" tooltip="Buscar Ubigeo" />
                                            </div>
                                        </div>

                                        <div className="field col-12 md:col-4">
                                            <label className="empresa-label" htmlFor="departamento">Departamento</label>
                                            <Dropdown id="departamento" options={departamentos} placeholder="Seleccione un departamento" className="w-full" />
                                        </div>

                                        <div className="field col-12 md:col-4">
                                            <label className="empresa-label" htmlFor="provincia">Provincia</label>
                                            <Dropdown id="provincia" options={provincias} placeholder="Seleccione una provincia" className="w-full" />
                                        </div>

                                        <div className="field col-12 md:col-4">
                                            <label className="empresa-label" htmlFor="distrito">Distrito</label>
                                            <Dropdown id="distrito" options={distritos} placeholder="Seleccione un distrito" className="w-full" />
                                        </div>

                                        <div className="field col-12">
                                            <label className="empresa-label" htmlFor="direccionFiscal">Dirección Fiscal</label>
                                            <InputText id="direccionFiscal" placeholder="Dirección fiscal de la empresa" />
                                        </div>
                                    </div>
                                </div>

                                <div className="content-card empresa-card-right">
                                    <div className="empresa-logo-header">Logotipo Institucional</div>
                                    <div className="empresa-logo-body">
                                        <div className="empresa-logo-circle">
                                            <i className="pi pi-image"></i>
                                            <span>Sin logotipo</span>
                                        </div>
                                        <Button
                                            label="Subir logotipo"
                                            icon="pi pi-upload"
                                            className="btn-primary-custom mt-3"
                                            type="button"
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>

                        <TabPanel header="Configuración de la Empresa" leftIcon="pi pi-cog mr-2">
                            <div className="content-card empresa-config-card">
                                <h2 className="empresa-section-title">Configuración de la Empresa</h2>
                                <p className="empresa-config-text">
                                    Aquí podrás definir parámetros generales de la empresa como formatos de documentos, numeraciones,
                                    preferencias de notificación y otras opciones administrativas. Esta sección está lista para conectar
                                    con el backend cuando definas los requerimientos.
                                </p>
                            </div>
                        </TabPanel>
                    </TabView>
                </div>
            </div>
        </div>
    );
};

export default Empresas;
