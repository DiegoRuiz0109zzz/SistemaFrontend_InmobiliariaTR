import React, { useCallback, useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import { EmpresaEntity } from '../entity/EmpresaEntity';
import { EmpresaService } from '../service/EmpresaService';
import { UbigeoService } from '../service/UbigeoService';
import './Usuario.css';
import './Empresas.css';

const Empresas = () => {
    const { axiosInstance } = useAuth();
    const toast = useRef(null);

    const [empresas, setEmpresas] = useState([]);
    const [empresa, setEmpresa] = useState({ ...EmpresaEntity });
    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(true);

    const isFormDisabled = !!empresa.id && !isEditing;


    const normalizarTexto = (value) => (value || '').trim();

    const mapTextOptions = (items) => items.map((item) => ({ label: item, value: item }));

    const mapDistritoOptions = (items) => items.map((item) => {
        const distrito = item?.distrito || item?.nombreDistrito || item?.name || '';
        const ubigeo = item?.ubigeo || item?.idUbigeo || item?.codigoUbigeo || '';
        return {
            label: distrito,
            value: distrito,
            ubigeo
        };
    });

    const onInputChange = (field, value) => {
        setEmpresa((prev) => ({ ...prev, [field]: value }));
    };

    const limpiarFormulario = () => {
        setEmpresa({ ...EmpresaEntity });
        setProvincias([]);
        setDistritos([]);
        setIsEditing(true);
    };

    const cargarDepartamentos = useCallback(async () => {
        try {
            const response = await UbigeoService.listarDepartamentos(axiosInstance);
            setDepartamentos(mapTextOptions(response || []));
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar departamentos.', life: 3500 });
        }
    }, [axiosInstance]);

    const cargarEmpresas = useCallback(async () => {
        try {
            const response = await EmpresaService.listar(axiosInstance);
            if (response && response.length > 0) {
                const data = response[0];
                setEmpresas(response);
                setEmpresa({ ...EmpresaEntity, ...data });
                setIsEditing(false);
            } else {
                setEmpresas([]);
            }
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo listar empresas.', life: 3500 });
        }
    }, [axiosInstance]);

    const cargarProvincias = useCallback(async (departamento) => {
        if (!departamento) {
            setProvincias([]);
            setDistritos([]);
            return;
        }

        try {
            const response = await UbigeoService.listarProvincias(departamento, axiosInstance);
            setProvincias(mapTextOptions(response || []));
        } catch (error) {
            console.error(error);
            setProvincias([]);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar provincias.', life: 3500 });
        }
    }, [axiosInstance]);

    const cargarDistritos = useCallback(async (departamento, provincia) => {
        if (!departamento || !provincia) {
            setDistritos([]);
            return;
        }

        try {
            const response = await UbigeoService.listarDistritos(departamento, provincia, axiosInstance);
            setDistritos(mapDistritoOptions(response || []));
        } catch (error) {
            console.error(error);
            setDistritos([]);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar distritos.', life: 3500 });
        }
    }, [axiosInstance]);

    const hidratarUbigeo = useCallback(async (dataEmpresa) => {
        if (!dataEmpresa?.departamento) {
            setProvincias([]);
            setDistritos([]);
            return;
        }

        await cargarProvincias(dataEmpresa.departamento);
        if (dataEmpresa.provincia) {
            await cargarDistritos(dataEmpresa.departamento, dataEmpresa.provincia);
        }
    }, [cargarDistritos, cargarProvincias]);

    useEffect(() => {
        cargarDepartamentos();
        
        async function fetchInitialData() {
            try {
                const response = await EmpresaService.listar(axiosInstance);
                if (response && response.length > 0) {
                    const data = response[0];
                    setEmpresas(response);
                    setEmpresa({ ...EmpresaEntity, ...data });
                    setIsEditing(false);
                    await hidratarUbigeo(data);
                } else {
                    setEmpresas([]);
                }
            } catch (error) {
                console.error(error);
            }
        }
        fetchInitialData();
    }, [cargarDepartamentos, axiosInstance, hidratarUbigeo]);


    const onDepartamentoChange = async (value) => {
        setEmpresa((prev) => ({
            ...prev,
            departamento: value,
            provincia: '',
            distrito: '',
            ubigeo: ''
        }));
        await cargarProvincias(value);
        setDistritos([]);
    };

    const onProvinciaChange = async (value) => {
        setEmpresa((prev) => ({
            ...prev,
            provincia: value,
            distrito: '',
            ubigeo: ''
        }));
        await cargarDistritos(empresa.departamento, value);
    };

    const onDistritoChange = (value) => {
        const distritoSelected = distritos.find((item) => item.value === value);
        setEmpresa((prev) => ({
            ...prev,
            distrito: value,
            ubigeo: distritoSelected?.ubigeo || ''
        }));
    };

    const guardarEmpresa = async () => {
        const ruc = normalizarTexto(empresa.ruc);
        const razonSocial = normalizarTexto(empresa.razonSocial);

        if (ruc.length !== 11) {
            toast.current?.show({ severity: 'warn', summary: 'Validacion', detail: 'El RUC debe tener 11 digitos.', life: 3000 });
            return;
        }

        if (!razonSocial) {
            toast.current?.show({ severity: 'warn', summary: 'Validacion', detail: 'La razon social es obligatoria.', life: 3000 });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...empresa,
                ruc,
                razonSocial,
                nombreComercial: normalizarTexto(empresa.nombreComercial),
                direccion: normalizarTexto(empresa.direccion),
                telefono: normalizarTexto(empresa.telefono),
                email: normalizarTexto(empresa.email)
            };

            let result;
            if (empresa.id) {
                result = await EmpresaService.actualizar(empresa.id, payload, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Empresa actualizada correctamente.', life: 3000 });
            } else {
                result = await EmpresaService.crear(payload, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Empresa creada correctamente.', life: 3000 });
            }

            await cargarEmpresas();
            setEmpresa({ ...EmpresaEntity, ...result });
            await hidratarUbigeo(result);
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo guardar la empresa.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        } finally {
            setSaving(false);
        }
    };

    const eliminarEmpresa = async () => {
        if (!empresa.id) {
            toast.current?.show({ severity: 'warn', summary: 'Validacion', detail: 'Selecciona una empresa para eliminar.', life: 3000 });
            return;
        }

        try {
            await EmpresaService.eliminar(empresa.id, axiosInstance);
            toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Empresa eliminada correctamente.', life: 3000 });
            limpiarFormulario();
            await cargarEmpresas();
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo eliminar la empresa.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        }
    };

    return (
        <div className="usuario-page empresa-page">
            <Toast ref={toast} />
            <div className="container">
                <PageHeader
                    title="Configuración de la Empresa"
                    description="Administra la configuración general y opciones de tu sistema."
                    icon="pi pi-building"
                />

                <div className="main-content">
                    <TabView className="empresa-tabview">
                        <TabPanel header="Datos Generales" leftIcon="pi pi-list mr-2">
                            <div className="empresa-shell content-card">
                                <div className="empresa-grid">
                                    <div className="empresa-left-column">
                                        <div className="content-card empresa-card-left">
                                            <h2 className="empresa-section-title">
                                                <i className="pi pi-id-card"></i>
                                                Informacion Principal
                                            </h2>

                                            <div className="formgrid grid">
                                                <div className="field col-12 md:col-6">
                                                    <label className="empresa-label" htmlFor="ruc">RUC *</label>
                                                    <div className="p-inputgroup">
                                                        <InputText
                                                            id="ruc"
                                                            value={empresa.ruc}
                                                            onChange={(e) => onInputChange('ruc', e.target.value.replace(/\D/g, '').slice(0, 11))}
                                                            placeholder="Ingrese RUC de 11 digitos"
                                                            className="w-full"
                                                            disabled={isFormDisabled}
                                                        />
                                                        <Button icon="pi pi-search" className="p-button-outlined" type="button" disabled={isFormDisabled} />
                                                    </div>
                                                    <small className="empresa-hint">Busque el comprobante de 11 digitos</small>
                                                </div>

                                                <div className="field col-12 md:col-6">
                                                    <label className="empresa-label" htmlFor="razonSocial">Razon Social *</label>
                                                    <InputText id="razonSocial" value={empresa.razonSocial} onChange={(e) => onInputChange('razonSocial', e.target.value)} placeholder="Razon social registrada" className="w-full" disabled={isFormDisabled} />
                                                </div>

                                                <div className="field col-12 md:col-6">
                                                    <label className="empresa-label" htmlFor="nombreComercial">Nombre Comercial</label>
                                                    <InputText id="nombreComercial" value={empresa.nombreComercial} onChange={(e) => onInputChange('nombreComercial', e.target.value)} placeholder="Nombre comercial" className="w-full" disabled={isFormDisabled} />
                                                </div>

                                                <div className="field col-12 md:col-6">
                                                    <label className="empresa-label" htmlFor="ubigeo">Ubigeo</label>
                                                    <div className="p-inputgroup">
                                                        <InputText id="ubigeo" value={empresa.ubigeo} onChange={(e) => onInputChange('ubigeo', e.target.value)} placeholder="Codigo de ubigeo" readOnly className="w-full" disabled={isFormDisabled} />
                                                        <Button icon="pi pi-search" className="p-button-outlined" type="button" disabled={isFormDisabled} />
                                                    </div>
                                                </div>

                                                <div className="field col-12 md:col-4">
                                                    <label className="empresa-label" htmlFor="departamento">Departamento</label>
                                                    <Dropdown
                                                        id="departamento"
                                                        value={empresa.departamento}
                                                        options={departamentos}
                                                        onChange={(e) => onDepartamentoChange(e.value)}
                                                        placeholder="Seleccione un departamento"
                                                        className="w-full"
                                                        showClear
                                                        disabled={isFormDisabled}
                                                    />
                                                </div>

                                                <div className="field col-12 md:col-4">
                                                    <label className="empresa-label" htmlFor="provincia">Provincia</label>
                                                    <Dropdown
                                                        id="provincia"
                                                        value={empresa.provincia}
                                                        options={provincias}
                                                        onChange={(e) => onProvinciaChange(e.value)}
                                                        placeholder="Seleccione una provincia"
                                                        className="w-full"
                                                        showClear
                                                        disabled={isFormDisabled || !empresa.departamento}
                                                    />
                                                </div>

                                                <div className="field col-12 md:col-4">
                                                    <label className="empresa-label" htmlFor="distrito">Distrito</label>
                                                    <Dropdown
                                                        id="distrito"
                                                        value={empresa.distrito}
                                                        options={distritos}
                                                        onChange={(e) => onDistritoChange(e.value)}
                                                        placeholder="Seleccione un distrito"
                                                        className="w-full"
                                                        showClear
                                                        disabled={isFormDisabled || !empresa.provincia}
                                                    />
                                                </div>

                                                <div className="field col-12">
                                                    <label className="empresa-label" htmlFor="direccionFiscal">Direccion Fiscal</label>
                                                    <InputText id="direccionFiscal" value={empresa.direccion} onChange={(e) => onInputChange('direccion', e.target.value)} placeholder="Direccion fiscal de la empresa" className="w-full" disabled={isFormDisabled} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="content-card empresa-card-left empresa-contact-card">
                                            <h2 className="empresa-section-title">
                                                <i className="pi pi-phone"></i>
                                                Contacto
                                            </h2>

                                            <div className="formgrid grid">
                                                <div className="field col-12 md:col-6">
                                                    <label className="empresa-label" htmlFor="telefono">Telefono</label>
                                                    <InputText id="telefono" value={empresa.telefono} onChange={(e) => onInputChange('telefono', e.target.value)} placeholder="Telefono" className="w-full" disabled={isFormDisabled} />
                                                </div>

                                                <div className="field col-12 md:col-6">
                                                    <label className="empresa-label" htmlFor="email">Correo Electronico</label>
                                                    <InputText id="email" value={empresa.email} onChange={(e) => onInputChange('email', e.target.value)} placeholder="Correo corporativo" className="w-full" disabled={isFormDisabled} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div className="empresa-footer-actions">
                                    <div className="empresa-actions">
                                        <Button label="Nuevo" icon="pi pi-plus" className="p-button-outlined" onClick={limpiarFormulario} />
                                        <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger p-button-outlined" onClick={eliminarEmpresa} disabled={!empresa.id} />
                                    </div>
                                    {!isEditing && empresa.id ? (
                                        <Button
                                            label="Modificar Empresa"
                                            icon="pi pi-pencil"
                                            className="btn-primary-custom p-button-outlined"
                                            onClick={() => setIsEditing(true)}
                                            type="button"
                                        />
                                    ) : (
                                        <Button
                                            label={empresa.id ? 'Guardar Cambios' : 'Guardar Empresa'}
                                            icon="pi pi-save"
                                            className="btn-primary-custom"
                                            onClick={guardarEmpresa}
                                            loading={saving}
                                        />
                                    )}
                                </div>
                            </div>
                        </TabPanel>

                        <TabPanel header="Configuración Financiera" leftIcon="pi pi-wallet mr-2">
                            <div className="content-card empresa-config-card">
                                <h2 className="empresa-section-title">Configuracion Financiera</h2>
                                <p className="empresa-config-text">
                                    Esta pestana queda lista para integrar cuentas bancarias, tipos de moneda, impuestos y reglas financieras.
                                </p>
                            </div>
                        </TabPanel>

                        <TabPanel header="Tienda (E-commerce)" leftIcon="pi pi-shopping-bag mr-2">
                            <div className="content-card empresa-config-card">
                                <h2 className="empresa-section-title">Tienda (E-commerce)</h2>
                                <p className="empresa-config-text">
                                    Esta pestana queda disponible para conectar la configuracion de la tienda virtual y publicaciones.
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
