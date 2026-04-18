import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { confirmDialog } from 'primereact/confirmdialog';
import PageHeader from '../../components/ui/PageHeader';
import DialogHeader from '../../components/ui/DialogHeader';
import { useAuth } from '../../context/AuthContext';
import { UrbanizacionEntity } from '../../entity/UrbanizacionEntity';
import { EtapaEntity } from '../../entity/EtapaEntity';
import { ManzanaEntity } from '../../entity/ManzanaEntity';
import { LoteEntity } from '../../entity/LoteEntity';
import { EstadoLoteOptions } from '../../entity/EstadoLote';
import { UrbanizacionService } from '../../service/UrbanizacionService';
import { EtapaService } from '../../service/EtapaService';
import { ManzanaService } from '../../service/ManzanaService';
import { LoteService } from '../../service/LoteService';
import '../Usuario.css';
import './Lotizacion.css';

const Lotizacion = () => {
    const { axiosInstance } = useAuth();
    const toast = useRef(null);

    const emptyUrbanizacion = { ...UrbanizacionEntity };
    const emptyEtapa = { ...EtapaEntity, urbanizacion: null };
    const emptyManzana = { ...ManzanaEntity, etapa: null };
    const emptyLote = { ...LoteEntity, manzana: null };

    const [urbanizaciones, setUrbanizaciones] = useState([]);
    const [urbanizacion, setUrbanizacion] = useState(emptyUrbanizacion);
    const [urbanizacionDialog, setUrbanizacionDialog] = useState(false);
    const [urbanizacionSubmitted, setUrbanizacionSubmitted] = useState(false);
    const [urbanizacionEdit, setUrbanizacionEdit] = useState(emptyUrbanizacion);

    const [etapas, setEtapas] = useState([]);
    const [etapa, setEtapa] = useState(emptyEtapa);
    const [etapaDialog, setEtapaDialog] = useState(false);
    const [etapaSubmitted, setEtapaSubmitted] = useState(false);
    const [etapaEdit, setEtapaEdit] = useState(emptyEtapa);

    const [manzanas, setManzanas] = useState([]);
    const [manzana, setManzana] = useState(emptyManzana);
    const [manzanaDialog, setManzanaDialog] = useState(false);
    const [manzanaSubmitted, setManzanaSubmitted] = useState(false);
    const [manzanaEdit, setManzanaEdit] = useState(emptyManzana);

    const [lotes, setLotes] = useState([]);
    const [lote, setLote] = useState(emptyLote);
    const [loteDialog, setLoteDialog] = useState(false);
    const [loteSubmitted, setLoteSubmitted] = useState(false);
    const [loteEdit, setLoteEdit] = useState(emptyLote);

    const urbanizacionOptions = urbanizaciones.map((item) => ({ label: item.nombre, value: item }));
    const etapaOptions = etapas.map((item) => ({ label: item.nombre, value: item }));
    const manzanaOptions = manzanas.map((item) => ({ label: item.nombre, value: item }));

    const hideUrbanizacionDialog = () => {
        setUrbanizacionDialog(false);
        setUrbanizacionSubmitted(false);
        setUrbanizacionEdit(emptyUrbanizacion);
    };

    const hideEtapaDialog = () => {
        setEtapaDialog(false);
        setEtapaSubmitted(false);
        setEtapaEdit(emptyEtapa);
    };

    const hideManzanaDialog = () => {
        setManzanaDialog(false);
        setManzanaSubmitted(false);
        setManzanaEdit(emptyManzana);
    };

    const hideLoteDialog = () => {
        setLoteDialog(false);
        setLoteSubmitted(false);
        setLoteEdit(emptyLote);
    };

    const cargarUrbanizaciones = useCallback(async () => {
        try {
            const response = await UrbanizacionService.listar(axiosInstance);
            setUrbanizaciones(response || []);
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar urbanizaciones.', life: 3500 });
        }
    }, [axiosInstance]);

    const cargarEtapas = useCallback(async () => {
        try {
            const response = await EtapaService.listar(axiosInstance);
            setEtapas(response || []);
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar etapas.', life: 3500 });
        }
    }, [axiosInstance]);

    const cargarManzanas = useCallback(async () => {
        try {
            const response = await ManzanaService.listar(axiosInstance);
            setManzanas(response || []);
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar manzanas.', life: 3500 });
        }
    }, [axiosInstance]);

    const cargarLotes = useCallback(async () => {
        try {
            const response = await LoteService.listar(axiosInstance);
            setLotes(response || []);
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar lotes.', life: 3500 });
        }
    }, [axiosInstance]);

    useEffect(() => {
        cargarUrbanizaciones();
        cargarEtapas();
        cargarManzanas();
        cargarLotes();
    }, [cargarUrbanizaciones, cargarEtapas, cargarManzanas, cargarLotes]);

    const saveUrbanizacionForm = async () => {
        setUrbanizacionSubmitted(true);
        if (!urbanizacion.nombre) {
            return;
        }

        try {
            if (urbanizacion.id) {
                await UrbanizacionService.actualizar(urbanizacion.id, urbanizacion, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Urbanizacion actualizada.', life: 3000 });
            } else {
                await UrbanizacionService.crear(urbanizacion, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Urbanizacion creada.', life: 3000 });
            }

            await cargarUrbanizaciones();
            setUrbanizacion(emptyUrbanizacion);
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo guardar la urbanizacion.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        }
    };

    const saveUrbanizacion = async () => {
        setUrbanizacionSubmitted(true);
        if (!urbanizacionEdit.nombre) {
            return;
        }

        try {
            if (urbanizacionEdit.id) {
                await UrbanizacionService.actualizar(urbanizacionEdit.id, urbanizacionEdit, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Urbanizacion actualizada.', life: 3000 });
            } else {
                await UrbanizacionService.crear(urbanizacionEdit, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Urbanizacion creada.', life: 3000 });
            }

            await cargarUrbanizaciones();
            setUrbanizacionDialog(false);
            setUrbanizacionEdit(emptyUrbanizacion);
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo guardar la urbanizacion.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        }
    };

    const saveEtapaForm = async () => {
        setEtapaSubmitted(true);
        if (!etapa.nombre || !etapa.urbanizacion) {
            return;
        }

        try {
            if (etapa.id) {
                await EtapaService.actualizar(etapa.id, etapa, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Etapa actualizada.', life: 3000 });
            } else {
                await EtapaService.crear(etapa, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Etapa creada.', life: 3000 });
            }
            await cargarEtapas();
            setEtapa(emptyEtapa);
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo guardar la etapa.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        }
    };

    const saveEtapa = async () => {
        setEtapaSubmitted(true);
        if (!etapaEdit.nombre || !etapaEdit.urbanizacion) {
            return;
        }

        try {
            if (etapaEdit.id) {
                await EtapaService.actualizar(etapaEdit.id, etapaEdit, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Etapa actualizada.', life: 3000 });
            } else {
                await EtapaService.crear(etapaEdit, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Etapa creada.', life: 3000 });
            }
            await cargarEtapas();
            setEtapaDialog(false);
            setEtapaEdit(emptyEtapa);
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo guardar la etapa.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        }
    };

    const saveManzanaForm = async () => {
        setManzanaSubmitted(true);
        if (!manzana.nombre || !manzana.etapa) {
            return;
        }

        try {
            if (manzana.id) {
                await ManzanaService.actualizar(manzana.id, manzana, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Manzana actualizada.', life: 3000 });
            } else {
                await ManzanaService.crear(manzana, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Manzana creada.', life: 3000 });
            }
            await cargarManzanas();
            setManzana(emptyManzana);
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo guardar la manzana.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        }
    };

    const saveManzana = async () => {
        setManzanaSubmitted(true);
        if (!manzanaEdit.nombre || !manzanaEdit.etapa) {
            return;
        }

        try {
            if (manzanaEdit.id) {
                await ManzanaService.actualizar(manzanaEdit.id, manzanaEdit, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Manzana actualizada.', life: 3000 });
            } else {
                await ManzanaService.crear(manzanaEdit, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Manzana creada.', life: 3000 });
            }
            await cargarManzanas();
            setManzanaDialog(false);
            setManzanaEdit(emptyManzana);
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo guardar la manzana.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        }
    };

    const saveLoteForm = async () => {
        setLoteSubmitted(true);
        if (!lote.numero || !lote.manzana) {
            return;
        }

        try {
            if (lote.id) {
                await LoteService.actualizar(lote.id, lote, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Lote actualizado.', life: 3000 });
            } else {
                await LoteService.crear(lote, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Lote creado.', life: 3000 });
            }
            await cargarLotes();
            setLote(emptyLote);
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo guardar el lote.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        }
    };

    const saveLote = async () => {
        setLoteSubmitted(true);
        if (!loteEdit.numero || !loteEdit.manzana) {
            return;
        }

        try {
            if (loteEdit.id) {
                await LoteService.actualizar(loteEdit.id, loteEdit, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Lote actualizado.', life: 3000 });
            } else {
                await LoteService.crear(loteEdit, axiosInstance);
                toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Lote creado.', life: 3000 });
            }
            await cargarLotes();
            setLoteDialog(false);
            setLoteEdit(emptyLote);
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo guardar el lote.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        }
    };

    const editUrbanizacion = (rowData) => {
        setUrbanizacionEdit({ ...rowData });
        setUrbanizacionSubmitted(false);
        setUrbanizacionDialog(true);
    };

    const editEtapa = (rowData) => {
        setEtapaEdit({ ...rowData });
        setEtapaSubmitted(false);
        setEtapaDialog(true);
    };

    const editManzana = (rowData) => {
        setManzanaEdit({ ...rowData });
        setManzanaSubmitted(false);
        setManzanaDialog(true);
    };

    const editLote = (rowData) => {
        setLoteEdit({ ...rowData });
        setLoteSubmitted(false);
        setLoteDialog(true);
    };

    const confirmDelete = (message, onAccept) => {
        confirmDialog({
            message,
            header: 'Confirmar Eliminacion',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Si, eliminar',
            rejectLabel: 'No',
            accept: onAccept
        });
    };

    const deleteUrbanizacion = async (rowData) => {
        try {
            await UrbanizacionService.eliminar(rowData.id, axiosInstance);
            await cargarUrbanizaciones();
            toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Urbanizacion eliminada.', life: 3000 });
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo eliminar la urbanizacion.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        }
    };

    const deleteEtapa = async (rowData) => {
        try {
            await EtapaService.eliminar(rowData.id, axiosInstance);
            await cargarEtapas();
            toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Etapa eliminada.', life: 3000 });
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo eliminar la etapa.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        }
    };

    const deleteManzana = async (rowData) => {
        try {
            await ManzanaService.eliminar(rowData.id, axiosInstance);
            await cargarManzanas();
            toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Manzana eliminada.', life: 3000 });
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo eliminar la manzana.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        }
    };

    const deleteLote = async (rowData) => {
        try {
            await LoteService.eliminar(rowData.id, axiosInstance);
            await cargarLotes();
            toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Lote eliminado.', life: 3000 });
        } catch (error) {
            console.error(error);
            const detail = error?.response?.data?.message || 'No se pudo eliminar el lote.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4500 });
        }
    };

    const actionBodyTemplate = (rowData, onEdit, onDelete) => (
        <div className="action-buttons">
            <Button icon="pi pi-pencil" className="btn-edit" onClick={() => onEdit(rowData)} tooltip="Editar" />
            <Button icon="pi pi-trash" className="btn-delete" onClick={() => onDelete(rowData)} tooltip="Eliminar" />
        </div>
    );

    const formatNumber = (value) => {
        if (value === null || value === undefined || value === '') {
            return '';
        }
        const numericValue = Number(value);
        if (Number.isNaN(numericValue)) {
            return value;
        }
        return new Intl.NumberFormat('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(numericValue);
    };

    const formatArea = (rowData) => {
        const formatted = formatNumber(rowData?.area);
        return formatted ? `${formatted} m2` : '';
    };

    const formatPrecio = (rowData) => {
        const formatted = formatNumber(rowData?.precio);
        return formatted ? `S/. ${formatted}` : '';
    };

    const formActions = (onSave, onReset) => (
        <div className="lotizacion-actions">
            <Button label="Limpiar" icon="pi pi-refresh" className="p-button-outlined" onClick={onReset} />
            <Button label="Guardar" icon="pi pi-check" onClick={onSave} />
        </div>
    );

    return (
        <div className="usuario-page lotizacion-page">
            <Toast ref={toast} />
            <div className="container">
                <PageHeader
                    title="Lotizacion"
                    description="Administra urbanizacion, etapa, manzana y lote."
                    icon="pi pi-sitemap"
                />

                <div className="main-content">
                    <TabView className="lotizacion-entity-tabs">
                        <TabPanel header="Urbanizacion" leftIcon="pi pi-home mr-2">
                            <div className="lotizacion-form-layout">
                                <div className="content-card lotizacion-form-card">
                                    <div className="field">
                                        <label htmlFor="urbanizacionNombre">Nombre</label>
                                        <InputText
                                            id="urbanizacionNombre"
                                            value={urbanizacion.nombre}
                                            onChange={(e) => setUrbanizacion((prev) => ({ ...prev, nombre: e.target.value }))}
                                            placeholder="Nombre de urbanizacion"
                                        />
                                        {urbanizacionSubmitted && !urbanizacion.nombre && <small className="p-error">Nombre requerido.</small>}
                                    </div>
                                    <div className="field">
                                        <label htmlFor="urbanizacionUbicacion">Ubicacion</label>
                                        <InputText
                                            id="urbanizacionUbicacion"
                                            value={urbanizacion.ubicacion}
                                            onChange={(e) => setUrbanizacion((prev) => ({ ...prev, ubicacion: e.target.value }))}
                                            placeholder="Ubicacion"
                                        />
                                    </div>
                                    {formActions(saveUrbanizacionForm, () => setUrbanizacion(emptyUrbanizacion))}
                                </div>
                                <div className="content-card lotizacion-list-card">
                                    <DataTable value={urbanizaciones} dataKey="id" rows={6} paginator>
                                        <Column field="nombre" header="Nombre" style={{ minWidth: '200px' }} />
                                        <Column field="ubicacion" header="Ubicacion" style={{ minWidth: '200px' }} />
                                        <Column header="Acciones" body={(rowData) => actionBodyTemplate(rowData, editUrbanizacion, (data) => confirmDelete('Eliminar urbanizacion?', () => deleteUrbanizacion(data)))} style={{ minWidth: '140px', textAlign: 'center' }} />
                                    </DataTable>
                                </div>
                            </div>
                        </TabPanel>

                        <TabPanel header="Etapa" leftIcon="pi pi-clone mr-2">
                            <div className="lotizacion-form-layout">
                                <div className="content-card lotizacion-form-card">
                                    <div className="field">
                                        <label htmlFor="etapaNombre">Nombre</label>
                                        <InputText
                                            id="etapaNombre"
                                            value={etapa.nombre}
                                            onChange={(e) => setEtapa((prev) => ({ ...prev, nombre: e.target.value }))}
                                            placeholder="Nombre de etapa"
                                        />
                                        {etapaSubmitted && !etapa.nombre && <small className="p-error">Nombre requerido.</small>}
                                    </div>
                                    <div className="field">
                                        <label htmlFor="etapaUrbanizacion">Urbanizacion</label>
                                        <Dropdown
                                            id="etapaUrbanizacion"
                                            value={etapa.urbanizacion}
                                            options={urbanizacionOptions}
                                            onChange={(e) => setEtapa((prev) => ({ ...prev, urbanizacion: e.value }))}
                                            placeholder="Seleccione urbanizacion"
                                            className="w-full"
                                            showClear
                                        />
                                        {etapaSubmitted && !etapa.urbanizacion && <small className="p-error">Urbanizacion requerida.</small>}
                                    </div>
                                    {formActions(saveEtapaForm, () => setEtapa(emptyEtapa))}
                                </div>
                                <div className="content-card lotizacion-list-card">
                                    <DataTable value={etapas} dataKey="id" rows={6} paginator>
                                        <Column field="nombre" header="Nombre" style={{ minWidth: '200px' }} />
                                        <Column field="urbanizacion.nombre" header="Urbanizacion" style={{ minWidth: '200px' }} />
                                        <Column header="Acciones" body={(rowData) => actionBodyTemplate(rowData, editEtapa, (data) => confirmDelete('Eliminar etapa?', () => deleteEtapa(data)))} style={{ minWidth: '140px', textAlign: 'center' }} />
                                    </DataTable>
                                </div>
                            </div>
                        </TabPanel>

                        <TabPanel header="Manzana" leftIcon="pi pi-th-large mr-2">
                            <div className="lotizacion-form-layout">
                                <div className="content-card lotizacion-form-card">
                                    <div className="field">
                                        <label htmlFor="manzanaNombre">Nombre</label>
                                        <InputText
                                            id="manzanaNombre"
                                            value={manzana.nombre}
                                            onChange={(e) => setManzana((prev) => ({ ...prev, nombre: e.target.value }))}
                                            placeholder="Nombre de manzana"
                                        />
                                        {manzanaSubmitted && !manzana.nombre && <small className="p-error">Nombre requerido.</small>}
                                    </div>
                                    <div className="field">
                                        <label htmlFor="manzanaEtapa">Etapa</label>
                                        <Dropdown
                                            id="manzanaEtapa"
                                            value={manzana.etapa}
                                            options={etapaOptions}
                                            onChange={(e) => setManzana((prev) => ({ ...prev, etapa: e.value }))}
                                            placeholder="Seleccione etapa"
                                            className="w-full"
                                            showClear
                                        />
                                        {manzanaSubmitted && !manzana.etapa && <small className="p-error">Etapa requerida.</small>}
                                    </div>
                                    {formActions(saveManzanaForm, () => setManzana(emptyManzana))}
                                </div>
                                <div className="content-card lotizacion-list-card">
                                    <DataTable value={manzanas} dataKey="id" rows={6} paginator>
                                        <Column field="nombre" header="Nombre" style={{ minWidth: '200px' }} />
                                        <Column field="etapa.nombre" header="Etapa" style={{ minWidth: '200px' }} />
                                        <Column header="Acciones" body={(rowData) => actionBodyTemplate(rowData, editManzana, (data) => confirmDelete('Eliminar manzana?', () => deleteManzana(data)))} style={{ minWidth: '140px', textAlign: 'center' }} />
                                    </DataTable>
                                </div>
                            </div>
                        </TabPanel>

                        <TabPanel header="Lote" leftIcon="pi pi-map mr-2">
                            <div className="lotizacion-form-layout lotizacion-form-layout--stack">
                                <div className="content-card lotizacion-form-card lotizacion-form-card--grid">
                                    <div className="field">
                                        <label htmlFor="loteNumero">Numero</label>
                                        <InputText
                                            id="loteNumero"
                                            value={lote.numero}
                                            onChange={(e) => setLote((prev) => ({ ...prev, numero: e.target.value }))}
                                            placeholder="Numero de lote"
                                        />
                                        {loteSubmitted && !lote.numero && <small className="p-error">Numero requerido.</small>}
                                    </div>
                                    <div className="field">
                                        <label htmlFor="loteManzana">Manzana</label>
                                        <Dropdown
                                            id="loteManzana"
                                            value={lote.manzana}
                                            options={manzanaOptions}
                                            onChange={(e) => setLote((prev) => ({ ...prev, manzana: e.value }))}
                                            placeholder="Seleccione manzana"
                                            className="w-full"
                                            showClear
                                        />
                                        {loteSubmitted && !lote.manzana && <small className="p-error">Manzana requerida.</small>}
                                    </div>
                                    <div className="field">
                                        <label htmlFor="loteArea">Area</label>
                                        <InputText
                                            id="loteArea"
                                            value={lote.area || ''}
                                            onChange={(e) => setLote((prev) => ({ ...prev, area: e.target.value }))}
                                            placeholder="Area"
                                        />
                                    </div>
                                    <div className="field">
                                        <label htmlFor="lotePrecio">Precio</label>
                                        <InputText
                                            id="lotePrecio"
                                            value={lote.precio || ''}
                                            onChange={(e) => setLote((prev) => ({ ...prev, precio: e.target.value }))}
                                            placeholder="Precio"
                                        />
                                    </div>
                                    <div className="field">
                                        <label htmlFor="loteEstado">Estado</label>
                                        <Dropdown
                                            id="loteEstado"
                                            value={lote.estadoVenta}
                                            options={EstadoLoteOptions}
                                            onChange={(e) => setLote((prev) => ({ ...prev, estadoVenta: e.value }))}
                                            placeholder="Seleccione estado"
                                            className="w-full"
                                        />
                                    </div>
                                    {formActions(saveLoteForm, () => setLote(emptyLote))}
                                </div>
                                <div className="content-card lotizacion-list-card">
                                    <DataTable value={lotes} dataKey="id" rows={6} paginator>
                                        <Column field="numero" header="Numero" style={{ minWidth: '120px' }} />
                                        <Column field="manzana.etapa.urbanizacion.nombre" header="Urbanizacion" style={{ minWidth: '200px' }} />
                                        <Column field="manzana.etapa.nombre" header="Etapa" style={{ minWidth: '160px' }} />
                                        <Column field="manzana.nombre" header="Manzana" style={{ minWidth: '160px' }} />
                                        <Column header="Area" body={formatArea} style={{ minWidth: '120px' }} />
                                        <Column header="Precio" body={formatPrecio} style={{ minWidth: '140px' }} />
                                        <Column field="estadoVenta" header="Estado" style={{ minWidth: '140px' }} />
                                        <Column header="Acciones" body={(rowData) => actionBodyTemplate(rowData, editLote, (data) => confirmDelete('Eliminar lote?', () => deleteLote(data)))} style={{ minWidth: '140px', textAlign: 'center' }} />
                                    </DataTable>
                                </div>
                            </div>
                        </TabPanel>
                    </TabView>
                </div>
            </div>

            <Dialog
                visible={urbanizacionDialog}
                style={{ width: '700px', maxWidth: '95vw' }}
                header={<DialogHeader title={urbanizacionEdit.id ? 'Editar Urbanizacion' : 'Nueva Urbanizacion'} subtitle="Gestion de urbanizaciones" icon="pi pi-home" />}
                modal
                className="p-fluid custom-profile-dialog"
                onHide={hideUrbanizacionDialog}
                footer={
                    <div className="dialog-footer-buttons">
                        <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={hideUrbanizacionDialog} />
                        <Button label="Guardar" icon="pi pi-check" onClick={saveUrbanizacion} />
                    </div>
                }
            >
                <div className="formgrid grid mt-4 dialog-content-specific">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="urbanizacionNombreDialog">Nombre</label>
                        <InputText
                            id="urbanizacionNombreDialog"
                            value={urbanizacionEdit.nombre}
                            onChange={(e) => setUrbanizacionEdit((prev) => ({ ...prev, nombre: e.target.value }))}
                            required
                            placeholder="Nombre de urbanizacion"
                            className={urbanizacionSubmitted && !urbanizacionEdit.nombre ? 'p-invalid' : ''}
                        />
                        {urbanizacionSubmitted && !urbanizacionEdit.nombre && <small className="p-error">Nombre requerido.</small>}
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="urbanizacionUbicacionDialog">Ubicacion</label>
                        <InputText
                            id="urbanizacionUbicacionDialog"
                            value={urbanizacionEdit.ubicacion}
                            onChange={(e) => setUrbanizacionEdit((prev) => ({ ...prev, ubicacion: e.target.value }))}
                            placeholder="Ubicacion"
                        />
                    </div>
                </div>
            </Dialog>

            <Dialog
                visible={etapaDialog}
                style={{ width: '700px', maxWidth: '95vw' }}
                header={<DialogHeader title={etapaEdit.id ? 'Editar Etapa' : 'Nueva Etapa'} subtitle="Gestion de etapas" icon="pi pi-clone" />}
                modal
                className="p-fluid custom-profile-dialog"
                onHide={hideEtapaDialog}
                footer={
                    <div className="dialog-footer-buttons">
                        <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={hideEtapaDialog} />
                        <Button label="Guardar" icon="pi pi-check" onClick={saveEtapa} />
                    </div>
                }
            >
                <div className="formgrid grid mt-4 dialog-content-specific">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="etapaNombreDialog">Nombre</label>
                        <InputText
                            id="etapaNombreDialog"
                            value={etapaEdit.nombre}
                            onChange={(e) => setEtapaEdit((prev) => ({ ...prev, nombre: e.target.value }))}
                            required
                            placeholder="Nombre de etapa"
                            className={etapaSubmitted && !etapaEdit.nombre ? 'p-invalid' : ''}
                        />
                        {etapaSubmitted && !etapaEdit.nombre && <small className="p-error">Nombre requerido.</small>}
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="etapaUrbanizacionDialog">Urbanizacion</label>
                        <Dropdown
                            id="etapaUrbanizacionDialog"
                            value={etapaEdit.urbanizacion}
                            options={urbanizacionOptions}
                            onChange={(e) => setEtapaEdit((prev) => ({ ...prev, urbanizacion: e.value }))}
                            placeholder="Seleccione urbanizacion"
                            className="w-full"
                            showClear
                        />
                        {etapaSubmitted && !etapaEdit.urbanizacion && <small className="p-error">Urbanizacion requerida.</small>}
                    </div>
                </div>
            </Dialog>

            <Dialog
                visible={manzanaDialog}
                style={{ width: '700px', maxWidth: '95vw' }}
                header={<DialogHeader title={manzanaEdit.id ? 'Editar Manzana' : 'Nueva Manzana'} subtitle="Gestion de manzanas" icon="pi pi-th-large" />}
                modal
                className="p-fluid custom-profile-dialog"
                onHide={hideManzanaDialog}
                footer={
                    <div className="dialog-footer-buttons">
                        <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={hideManzanaDialog} />
                        <Button label="Guardar" icon="pi pi-check" onClick={saveManzana} />
                    </div>
                }
            >
                <div className="formgrid grid mt-4 dialog-content-specific">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="manzanaNombreDialog">Nombre</label>
                        <InputText
                            id="manzanaNombreDialog"
                            value={manzanaEdit.nombre}
                            onChange={(e) => setManzanaEdit((prev) => ({ ...prev, nombre: e.target.value }))}
                            required
                            placeholder="Nombre de manzana"
                            className={manzanaSubmitted && !manzanaEdit.nombre ? 'p-invalid' : ''}
                        />
                        {manzanaSubmitted && !manzanaEdit.nombre && <small className="p-error">Nombre requerido.</small>}
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="manzanaEtapaDialog">Etapa</label>
                        <Dropdown
                            id="manzanaEtapaDialog"
                            value={manzanaEdit.etapa}
                            options={etapaOptions}
                            onChange={(e) => setManzanaEdit((prev) => ({ ...prev, etapa: e.value }))}
                            placeholder="Seleccione etapa"
                            className="w-full"
                            showClear
                        />
                        {manzanaSubmitted && !manzanaEdit.etapa && <small className="p-error">Etapa requerida.</small>}
                    </div>
                </div>
            </Dialog>

            <Dialog
                visible={loteDialog}
                style={{ width: '720px', maxWidth: '95vw' }}
                header={<DialogHeader title={loteEdit.id ? 'Editar Lote' : 'Nuevo Lote'} subtitle="Gestion de lotes" icon="pi pi-map" />}
                modal
                className="p-fluid custom-profile-dialog"
                onHide={hideLoteDialog}
                footer={
                    <div className="dialog-footer-buttons">
                        <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={hideLoteDialog} />
                        <Button label="Guardar" icon="pi pi-check" onClick={saveLote} />
                    </div>
                }
            >
                <div className="formgrid grid mt-4 dialog-content-specific">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="loteNumeroDialog">Numero</label>
                        <InputText
                            id="loteNumeroDialog"
                            value={loteEdit.numero}
                            onChange={(e) => setLoteEdit((prev) => ({ ...prev, numero: e.target.value }))}
                            required
                            placeholder="Numero de lote"
                            className={loteSubmitted && !loteEdit.numero ? 'p-invalid' : ''}
                        />
                        {loteSubmitted && !loteEdit.numero && <small className="p-error">Numero requerido.</small>}
                    </div>
                    <div className="field col-12 md:col-6">
                        <label htmlFor="loteManzanaDialog">Manzana</label>
                        <Dropdown
                            id="loteManzanaDialog"
                            value={loteEdit.manzana}
                            options={manzanaOptions}
                            onChange={(e) => setLoteEdit((prev) => ({ ...prev, manzana: e.value }))}
                            placeholder="Seleccione manzana"
                            className="w-full"
                            showClear
                        />
                        {loteSubmitted && !loteEdit.manzana && <small className="p-error">Manzana requerida.</small>}
                    </div>
                    <div className="field col-12 md:col-4">
                        <label htmlFor="loteAreaDialog">Area</label>
                        <InputText
                            id="loteAreaDialog"
                            value={loteEdit.area || ''}
                            onChange={(e) => setLoteEdit((prev) => ({ ...prev, area: e.target.value }))}
                            placeholder="Area"
                        />
                    </div>
                    <div className="field col-12 md:col-4">
                        <label htmlFor="lotePrecioDialog">Precio</label>
                        <InputText
                            id="lotePrecioDialog"
                            value={loteEdit.precio || ''}
                            onChange={(e) => setLoteEdit((prev) => ({ ...prev, precio: e.target.value }))}
                            placeholder="Precio"
                        />
                    </div>
                    <div className="field col-12 md:col-4">
                        <label htmlFor="loteEstadoDialog">Estado</label>
                        <Dropdown
                            id="loteEstadoDialog"
                            value={loteEdit.estadoVenta}
                            options={EstadoLoteOptions}
                            onChange={(e) => setLoteEdit((prev) => ({ ...prev, estadoVenta: e.value }))}
                            placeholder="Seleccione estado"
                            className="w-full"
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default Lotizacion;
