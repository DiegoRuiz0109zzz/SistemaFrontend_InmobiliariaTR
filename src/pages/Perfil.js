import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { UsuarioEntity } from '../entity/UsuarioEntity';
import DialogHeader from '../components/ui/DialogHeader';
import './Perfil.css';

const Perfil = () => {
    const { axiosInstance, user, updateUserProfile } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('personal');
    const [data, setData] = useState(UsuarioEntity);
    const [submitted, setSubmitted] = useState(false);
    const [EntidadNewDialog, setEntidadNewDialog] = useState(false);
    const [EntidadDialog, setEntidadDialog] = useState(false);
    const [product, setProduct] = useState(UsuarioEntity);
    const [passw, setPassw] = useState({ id: null, oldPassword: '', newPassword: '' });
    const [confirmPassword, setConfirmPassword] = useState('');
    const toast = useRef(null);
    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);

    const peticionGet = useCallback(async () => {
        const userId = user?.id;
        if (!userId) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'ID de usuario no encontrado.', life: 5000 });
            return;
        }

        try {
            const response = await axiosInstance.get(`/usuario/${userId}`);
            setData(response.data);
            setProduct(response.data);
        } catch (error) {
            console.error("Error al cargar datos de usuario:", error);
            if (error.response?.status === 403) {
                toast.current.show({ severity: 'error', summary: 'Error de permisos', detail: 'No tienes permisos para ver este perfil.', life: 5000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos del usuario.', life: 5000 });
            }
        }
    }, [axiosInstance, user]);

    const peticionRENIEC = useCallback(async () => {
        if (!product.docIdentidad) {
            toast.current.show({ severity: 'warn', summary: 'Advertencia', detail: 'Ingrese un DNI para buscar.', life: 3000 });
            return;
        }

        try {
            const response = await axios.get("https://dniruc.apisperu.com/api/v1/dni/" + product.docIdentidad + "?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImpnYWl0YW5yQHBqLmdvYi5wZSJ9.-nX87AiyjDvfW2SeGAhWFnx0MDCiB8meK06aAAlVfJQ");
            const { nombres, apellidoPaterno, apellidoMaterno } = response.data;
            setProduct((prevProduct) => ({
                ...prevProduct,
                nombres: nombres,
                apellidos: `${apellidoPaterno} ${apellidoMaterno}`,
            }));
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Datos obtenidos de RENIEC.', life: 3000 });
        } catch (error) {
            console.error("Error al consultar RENIEC:", error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron obtener datos de RENIEC.', life: 5000 });
        }
    }, [product.docIdentidad]);

    const peticionPut = async () => {
        try {
            await axiosInstance.post('/usuario/changepassword', {
                id: user.id,
                oldPassword: passw.oldPassword,
                newPassword: passw.newPassword
            });
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Contraseña cambiada correctamente.', life: 3000 });
            setEntidadNewDialog(false);
            setPassw({ id: null, oldPassword: '', newPassword: '' });
            setConfirmPassword('');
        } catch (error) {
            console.error("Error al cambiar contraseña:", error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Datos incorrectos o error al cambiar la contraseña.', life: 5000 });
        }
    };

    const peticionPutMod = async () => {
        try {
            await axiosInstance.put(`/usuario/`, product);
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Datos actualizados correctamente.', life: 3000 });
            setEntidadDialog(false);
            peticionGet();
            //setTimeout(() => navigate('/'), 3000);
        } catch (error) {
            console.error("Error al actualizar datos:", error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Datos incorrectos o error al actualizar.', life: 5000 });
        }
    };

    const hideDialogNew = () => {
        setSubmitted(false);
        setEntidadNewDialog(false);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setEntidadDialog(false);
    };

    const openNew = () => {
        setPassw({ id: user?.id, oldPassword: '', newPassword: '' });
        setEntidadNewDialog(true);
    };

    const open = () => {
        setSubmitted(false);
        setEntidadDialog(true);
    };

    const saveProduct = () => {
        setSubmitted(true);
        if (EntidadNewDialog) {
            if (passw.oldPassword.trim() && passw.newPassword.trim() && confirmPassword.trim()) {
                if (passw.newPassword === confirmPassword) {
                    peticionPut();
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error de validación', detail: 'Las contraseñas no coinciden.', life: 3000 });
                }
            }
        } else if (EntidadDialog) {
            if (product.email && product.telefono) {
                peticionPutMod();
            }
        }
    };

    const BuscarDNI = () => {
        setSubmitted(true);
        if (product.docIdentidad.trim()) {
            peticionRENIEC();
        }
    };

    // Funciones para manejar imagen de perfil
    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar tipo de archivo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Solo se permiten imágenes (JPG, PNG, GIF, WEBP)',
                life: 5000
            });
            return;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'La imagen no debe superar los 5MB',
                life: 5000
            });
            return;
        }

        // Crear preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Subir imagen
        uploadImage(file);
    };

    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axiosInstance.post('/usuario/upload-profile-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.current.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Imagen de perfil actualizada correctamente',
                life: 3000
            });

            // Actualizar el estado con la nueva URL de imagen
            setData(prev => ({ ...prev, profileImage: response.data.imageUrl }));

            // Actualizar el contexto para que el topbar también muestre la imagen
            updateUserProfile({ profileImage: response.data.imageUrl });

            setImagePreview(null);
        } catch (error) {
            console.error("Error al subir imagen:", error);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.message || 'Error al subir la imagen',
                life: 5000
            });
            setImagePreview(null);
        } finally {
            // Limpiar input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const getProfileImageUrl = () => {
        if (imagePreview) return imagePreview;
        if (data.profileImage) {
            // Si es una URL relativa, construir la URL completa
            if (data.profileImage.startsWith('/')) {
                return `http://localhost:8080${data.profileImage}`;
            }
            return data.profileImage;
        }
        return null;
    };

    const onInputChangePass = (e, name) => {
        const val = e.target.value || '';
        if (name === 'confirmPassword') {
            setConfirmPassword(val); // Actualiza el string directamente
        } else {
            setPassw(prev => ({ ...prev, [name]: val })); // Actualiza el objeto passw
        }
    };

    const onInputChange = (e, name) => {
        const val = e.target.value || '';
        setProduct(prev => ({ ...prev, [name]: val }));
    };

    const productDialogFooterNew = (
        <>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={hideDialogNew} />
            <Button label="Aceptar" icon="pi pi-check" onClick={saveProduct} />
        </>
    );

    const productDialogFooter = (
        <>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-text p-button-secondary" onClick={hideDialog} />
            <Button label="Aceptar" icon="pi pi-check" onClick={saveProduct} />
        </>
    );

    useEffect(() => {
        peticionGet();
    }, [peticionGet]);

    return (
        <div className="perfil-page">
            <Toast ref={toast} />
            <div className="perfil-container">
                <div className="perfil-header">
                    <div
                        className="profile-image-container"
                        onClick={handleImageClick}
                        title="Haz clic para cambiar tu foto de perfil"
                    >
                        {getProfileImageUrl() ? (
                            <img
                                src={getProfileImageUrl()}
                                alt="Foto de perfil"
                                className="profile-image"
                            />
                        ) : (
                            <div className="profile-image-placeholder">
                                <i className="pi pi-user"></i>
                            </div>
                        )}
                        <div className="profile-image-overlay">
                            <i className="pi pi-camera"></i>
                            <span>Cambiar foto</span>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            style={{ display: 'none' }}
                        />
                    </div>
                    <h1 className="perfil-title">Mi Perfil</h1>
                    <p className="perfil-subtitle">Gestiona tu información personal y configuración</p>
                </div>

                <div className="perfil-card">
                    <div className="section-tabs">
                        <button
                            className={`section-tab ${activeTab === 'personal' ? 'active' : ''}`}
                            onClick={() => setActiveTab('personal')}
                        >
                            <i className="pi pi-id-card" style={{ marginRight: '0.5rem' }}></i>
                            Datos Personales
                        </button>
                        <button
                            className={`section-tab ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <i className="pi pi-shield" style={{ marginRight: '0.5rem' }}></i>
                            Seguridad
                        </button>
                        {/* Espacio para futuras pestañas según el rol */}
                    </div>

                    <div className="section-content">
                        {activeTab === 'personal' && (
                            <>
                                <div className="data-section">
                                    <div className="section-title">
                                        <i className="pi pi-user"></i>
                                        Información Personal
                                    </div>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <div className="info-label">
                                                <i className="pi pi-id-card"></i>
                                                Nombres
                                            </div>
                                            <div className="info-value">{data.nombres}</div>
                                        </div>
                                        <div className="info-item">
                                            <div className="info-label">
                                                <i className="pi pi-user"></i>
                                                Apellidos
                                            </div>
                                            <div className="info-value">{data.apellidos}</div>
                                        </div>
                                        <div className="info-item">
                                            <div className="info-label">
                                                <i className="pi pi-file"></i>
                                                N° Documento
                                            </div>
                                            <div className="info-value">{data.docIdentidad}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="data-section">
                                    <div className="section-title">
                                        <i className="pi pi-envelope"></i>
                                        Información de Contacto
                                    </div>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <div className="info-label">
                                                <i className="pi pi-at"></i>
                                                Correo Electrónico
                                            </div>
                                            <div className="info-value">{data.email}</div>
                                        </div>
                                        <div className="info-item">
                                            <div className="info-label">
                                                <i className="pi pi-phone"></i>
                                                Teléfono
                                            </div>
                                            <div className="info-value">{data.telefono}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="data-section">
                                    <div className="section-title">
                                        <i className="pi pi-briefcase"></i>
                                        Información del Sistema
                                    </div>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <div className="info-label">
                                                <i className="pi pi-shield"></i>
                                                Rol/Permisos
                                            </div>
                                            <div className="info-value">
                                                <span className="perfil-badge">{data.profile?.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="perfil-actions">
                                    <Button
                                        label="Actualizar Datos"
                                        icon="pi pi-pencil"
                                        className="p-button-outlined p-button-success"
                                        onClick={open}
                                    />
                                </div>
                            </>
                        )}

                        {activeTab === 'security' && (
                            <>
                                <div className="data-section">
                                    <div className="section-title">
                                        <i className="pi pi-lock"></i>
                                        Contraseña y Seguridad
                                    </div>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <div className="info-label">
                                                <i className="pi pi-key"></i>
                                                Contraseña
                                            </div>
                                            <div className="info-value">••••••••</div>
                                        </div>
                                        <div className="info-item">
                                            <div className="info-label">
                                                <i className="pi pi-calendar"></i>
                                                Última actualización
                                            </div>
                                            <div className="info-value">No disponible</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="perfil-actions">
                                    <Button
                                        label="Cambiar Contraseña"
                                        icon="pi pi-lock"
                                        className="p-button-outlined p-button-success"
                                        onClick={openNew}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <Dialog
                    visible={EntidadNewDialog}
                    style={{ width: '450px' }}
                    header={
                        <DialogHeader
                            title="Cambiar Contraseña"
                            subtitle="Actualiza tus credenciales de acceso"
                            icon="pi pi-lock"
                        />
                    }
                    modal
                    className="p-fluid custom-profile-dialog"
                    footer={productDialogFooterNew}
                    onHide={hideDialogNew}
                >
                    <div className="field">
                        <label htmlFor="oldPassword" className="password-field-label">Contraseña Actual</label>
                        <Password
                            id="oldPassword"
                            name="oldPassword"
                            value={passw.oldPassword}
                            onChange={(e) => onInputChangePass(e, 'oldPassword')}
                            toggleMask
                            feedback={false}
                            placeholder="Ingrese su contraseña actual"
                            required
                            autoFocus
                            className={classNames('password-input-field', { 'p-invalid': submitted && !passw.oldPassword })}
                        />
                        {submitted && !passw.oldPassword && <small className="p-invalid block mt-1">La contraseña actual es requerida.</small>}
                    </div>
                    <div className="field">
                        <label htmlFor="newPassword" className="password-field-label">Nueva Contraseña</label>
                        <Password
                            id="newPassword"
                            name="newPassword"
                            value={passw.newPassword}
                            onChange={(e) => onInputChangePass(e, 'newPassword')}
                            toggleMask
                            feedback={false}
                            placeholder="Ingrese su nueva contraseña"
                            required
                            className={classNames('password-input-field', { 'p-invalid': submitted && !passw.newPassword })}
                        />
                        {submitted && !passw.newPassword && <small className="p-invalid block mt-1">La nueva contraseña es requerida.</small>}
                    </div>
                    <div className="field">
                        <label htmlFor="confirmPassword" className="password-field-label">Confirmar Contraseña</label>
                        <Password
                            id="confirmPassword"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => onInputChangePass(e, 'confirmPassword')}
                            toggleMask
                            feedback={false}
                            placeholder="Confirme su nueva contraseña"
                            required
                            className={classNames('password-input-field', { 'p-invalid': submitted && !confirmPassword })}
                        />
                        {submitted && !confirmPassword && <small className="p-invalid block mt-1">La confirmación de contraseña es requerida.</small>}
                        {submitted && passw.newPassword !== confirmPassword && <small className="p-invalid block mt-1">Las contraseñas no coinciden.</small>}
                    </div>
                </Dialog>
                <Dialog
                    visible={EntidadDialog}
                    style={{ width: '500px' }}
                    header={
                        <DialogHeader
                            title="Datos de Usuario"
                            subtitle="Modifica tu información de contacto"
                            icon="pi pi-user-edit"
                        />
                    }
                    modal
                    className="p-fluid custom-profile-dialog"
                    footer={productDialogFooter}
                    onHide={hideDialog}
                >
                    <div className="formgrid grid">
                        <div className="field col-12 md:col-12">
                            <label htmlFor="docIdentidad">Doc. de Identidad</label>
                            <div className="p-inputgroup">
                                <Button icon="pi pi-search" onClick={BuscarDNI} style={{ color: '#ffffff' }} />
                                <InputText id="docIdentidad" name="docIdentidad" value={product.docIdentidad} onChange={(e) => onInputChange(e, 'docIdentidad')} required disabled className={classNames({ 'p-invalid': submitted && !product.docIdentidad })} />
                            </div>
                            {submitted && !product.docIdentidad && <small className="p-invalid">El documento de identidad es requerido.</small>}
                        </div>
                    </div>
                    <div className="formgrid grid">
                        <div className="field col-12 md:col-12">
                            <label htmlFor="nombre">Nombres</label>
                            <InputText id="nombres" name="nombres" value={product.nombres} onChange={(e) => onInputChange(e, 'nombres')} required disabled className={classNames({ 'p-invalid': submitted && !product.nombres })} />
                            {submitted && !product.nombres && <small className="p-invalid">El nombre es requerido.</small>}
                        </div>
                    </div>
                    <div className="formgrid grid">
                        <div className="field col-12 md:col-12">
                            <label htmlFor="apellidos">Apellidos</label>
                            <InputText id="apellidos" name="apellidos" value={product.apellidos} onChange={(e) => onInputChange(e, 'apellidos')} required disabled className={classNames({ 'p-invalid': submitted && !product.apellidos })} />
                            {submitted && !product.apellidos && <small className="p-invalid">El apellido es requerido.</small>}
                        </div>
                    </div>
                    <div className="formgrid grid">
                        <div className="field col-6">
                            <label htmlFor="email">Correo</label>
                            <InputText id="email" name="email" value={product.email} onChange={(e) => onInputChange(e, 'email')} required className={classNames({ 'p-invalid': submitted && !product.email })} />
                            {submitted && !product.email && <small className="p-invalid">El correo es requerido.</small>}
                        </div>
                        <div className="field col-12 md:col-6">
                            <label htmlFor="telefono">Teléfono</label>
                            <InputText id="telefono" name="telefono" value={product.telefono} onChange={(e) => onInputChange(e, 'telefono')} required className={classNames({ 'p-invalid': submitted && !product.telefono })} />
                            {submitted && !product.telefono && <small className="p-invalid">El teléfono es requerido.</small>}
                        </div>
                    </div>
                </Dialog>
            </div>
        </div>
    );
};

export default Perfil;