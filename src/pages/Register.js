import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { SystemConfig } from '../config/SystemConfig';
import axios from 'axios';
import './login.css';

function Register() {
    const navigate = useNavigate();
    const toast = useRef(null);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        nombres: '',
        apellidos: '',
        email: '',
        telefono: '',
        tipoDocumento: 'DNI',
        docIdentidad: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Only allow numbers for DNI and phone
    const handleNumericInput = (e, field) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setFormData({ ...formData, [field]: value });
    };

    const handleInputChange = (e, field) => {
        const value = e.target.value;
        if (field === 'tipoDocumento') {
            setFormData({ ...formData, [field]: value, docIdentidad: '' });
        } else {
            setFormData({ ...formData, [field]: value });
        }
    };

    const peticionRENIEC = async () => {
        if (!formData.docIdentidad || formData.docIdentidad.trim().length !== 8) {
            toast.current.show({
                severity: 'warn',
                summary: 'DNI Inválido',
                detail: 'El DNI debe tener 8 dígitos para realizar la búsqueda.',
                life: 3000
            });
            return;
        }

        setIsSearching(true);
        try {
            const response = await axios.get("https://dniruc.apisperu.com/api/v1/dni/" + formData.docIdentidad + "?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImpnYWl0YW5yQHBqLmdvYi5wZSJ9.-nX87AiyjDvfW2SeGAhWFnx0MDCiB8meK06aAAlVfJQ");
            if (response.data) {
                const nombres = response.data.nombres;
                const apellidos = response.data.apellidoPaterno + " " + response.data.apellidoMaterno;
                setFormData((prev) => ({
                    ...prev,
                    nombres: nombres || '',
                    apellidos: apellidos || '',
                }));
                toast.current.show({ severity: 'success', summary: 'Carga Exitosa', detail: 'Datos obtenidos de RENIEC.', life: 3000 });
            }
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error de Búsqueda', detail: 'No se pudo obtener la información del DNI.', life: 5000 });
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const validateForm = () => {
        const { username, password, confirmPassword, nombres, apellidos, email, telefono, docIdentidad } = formData;

        if (!username || !password || !nombres || !apellidos || !email || !telefono || !docIdentidad) {
            toast.current.show({
                severity: 'warn',
                summary: 'Campos incompletos',
                detail: 'Por favor complete todos los campos',
                life: 3000
            });
            return false;
        }

        if (password !== confirmPassword) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Las contraseñas no coinciden',
                life: 3000
            });
            return false;
        }

        if (formData.tipoDocumento === 'DNI' && docIdentidad && docIdentidad.length !== 8) {
            toast.current.show({
                severity: 'warn',
                summary: 'DNI Inválido',
                detail: 'El DNI debe tener exactamente 8 dígitos',
                life: 3000
            });
            return false;
        }

        if (password.length < 6) {
            toast.current.show({
                severity: 'warn',
                summary: 'Contraseña débil',
                detail: 'La contraseña debe tener al menos 6 caracteres',
                life: 3000
            });
            return false;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            toast.current.show({
                severity: 'warn',
                summary: 'Email inválido',
                detail: 'Por favor ingrese un correo electrónico válido',
                life: 3000
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        try {
            await axios.post('http://localhost:8080/api/auth/register', {
                username: formData.username,
                password: formData.password,
                nombres: formData.nombres,
                apellidos: formData.apellidos,
                email: formData.email,
                telefono: formData.telefono,
                docIdentidad: formData.docIdentidad
                // No role field - backend will assign lowest hierarchy role
            });

            toast.current.show({
                severity: 'success',
                summary: '¡Registro exitoso!',
                detail: 'Tu cuenta ha sido creada. Redirigiendo al login...',
                life: 2500
            });

            setTimeout(() => {
                navigate('/login');
            }, 2500);
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.response?.data || 'Error al registrar. Intente nuevamente.';
            toast.current.show({
                severity: 'error',
                summary: 'Error de registro',
                detail: errorMsg,
                life: 4000
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page login-container">
            <Toast ref={toast} />
            <div className="login-content" style={{ maxWidth: '450px' }}>
                <div className="login-header">
                    <img src={SystemConfig.logoPath} alt="Logo" style={{ height: '70px', marginBottom: '0.5rem' }} />
                    <h1 className="login-title" style={{ fontSize: '1.8rem' }}>Crear Cuenta</h1>
                    <p className="login-subtitle">Completa el formulario para registrarte</p>
                </div>

                <Card className="login-card">
                    <form onSubmit={handleSubmit} className="p-fluid">
                        {/* Nombres y Apellidos */}
                        <div className="grid">
                            <div className="col-6">
                                <div className="p-field">
                                    <label htmlFor="nombres" className="login-label">
                                        <i className="pi pi-user" style={{ marginRight: '0.5rem' }}></i>
                                        Nombres
                                    </label>
                                    <InputText
                                        id="nombres"
                                        value={formData.nombres}
                                        onChange={(e) => handleInputChange(e, 'nombres')}
                                        placeholder="Tus nombres"
                                        className="login-input"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="p-field">
                                    <label htmlFor="apellidos" className="login-label">Apellidos</label>
                                    <InputText
                                        id="apellidos"
                                        value={formData.apellidos}
                                        onChange={(e) => handleInputChange(e, 'apellidos')}
                                        placeholder="Tus apellidos"
                                        className="login-input"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tipo de Documento y ID */}
                        <div className="grid" style={{ marginTop: '1rem' }}>
                            <div className="col-4">
                                <div className="p-field">
                                    <label htmlFor="tipoDocumento" className="login-label">Tipo</label>
                                    <Dropdown
                                        id="tipoDocumento"
                                        value={formData.tipoDocumento}
                                        options={[
                                            { label: 'DNI', value: 'DNI' },
                                            { label: 'C.E.', value: 'CE' }
                                        ]}
                                        onChange={(e) => handleInputChange(e, 'tipoDocumento')}
                                        className="login-input"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div className="col-8">
                                <div className="p-field">
                                    <label htmlFor="docIdentidad" className="login-label">
                                        <i className="pi pi-id-card" style={{ marginRight: '0.5rem' }}></i>
                                        {formData.tipoDocumento === 'DNI' ? 'DNI' : 'C.E.'}
                                    </label>
                                    <div className="p-inputgroup">
                                        <InputText
                                            id="docIdentidad"
                                            value={formData.docIdentidad}
                                            onChange={(e) => handleNumericInput(e, 'docIdentidad')}
                                            placeholder={formData.tipoDocumento === 'DNI' ? "8 dígitos" : "Solo números"}
                                            className="login-input"
                                            disabled={isLoading}
                                            maxLength={formData.tipoDocumento === 'DNI' ? 8 : 15}
                                        />
                                        {formData.tipoDocumento === 'DNI' && (
                                            <Button
                                                type="button"
                                                icon={isSearching ? "pi pi-spin pi-spinner" : "pi pi-search"}
                                                className="login-search-button"
                                                onClick={peticionRENIEC}
                                                disabled={isLoading || isSearching}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Teléfono */}
                        <div className="p-field" style={{ marginTop: '1rem' }}>
                            <label htmlFor="telefono" className="login-label">
                                <i className="pi pi-phone" style={{ marginRight: '0.5rem' }}></i>
                                Teléfono
                            </label>
                            <InputText
                                id="telefono"
                                value={formData.telefono}
                                onChange={(e) => handleNumericInput(e, 'telefono')}
                                placeholder="Solo números"
                                className="login-input"
                                disabled={isLoading}
                                maxLength={15}
                            />
                        </div>

                        {/* Email */}
                        <div className="p-field" style={{ marginTop: '1rem' }}>
                            <label htmlFor="email" className="login-label">
                                <i className="pi pi-envelope" style={{ marginRight: '0.5rem' }}></i>
                                Correo Electrónico
                            </label>
                            <InputText
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange(e, 'email')}
                                placeholder="tucorreo@ejemplo.com"
                                className="login-input"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Username */}
                        <div className="p-field" style={{ marginTop: '1rem' }}>
                            <label htmlFor="username" className="login-label">
                                <i className="pi pi-at" style={{ marginRight: '0.5rem' }}></i>
                                Nombre de Usuario
                            </label>
                            <InputText
                                id="username"
                                value={formData.username}
                                onChange={(e) => handleInputChange(e, 'username')}
                                placeholder="Elige un nombre de usuario"
                                className="login-input"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password */}
                        <div className="grid" style={{ marginTop: '1rem' }}>
                            <div className="col-6">
                                <div className="p-field">
                                    <label htmlFor="password" className="login-label">
                                        <i className="pi pi-lock" style={{ marginRight: '0.5rem' }}></i>
                                        Contraseña
                                    </label>
                                    <Password
                                        id="password"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange(e, 'password')}
                                        toggleMask
                                        feedback={true}
                                        promptLabel="Ingresa tu contraseña"
                                        weakLabel="Débil"
                                        mediumLabel="Media"
                                        strongLabel="Fuerte"
                                        placeholder="Mínimo 6 caracteres"
                                        className="login-input"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="p-field">
                                    <label htmlFor="confirmPassword" className="login-label">Confirmar</label>
                                    <Password
                                        id="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleInputChange(e, 'confirmPassword')}
                                        toggleMask
                                        feedback={false}
                                        placeholder="Repite tu contraseña"
                                        className="login-input"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            label={isLoading ? "Registrando..." : "Crear Cuenta"}
                            icon={isLoading ? "pi pi-spin pi-spinner" : "pi pi-user-plus"}
                            type="submit"
                            className="login-button"
                            style={{ marginTop: '2rem' }}
                            disabled={isLoading}
                        />

                        <div className="login-footer" style={{ marginTop: '1.5rem' }}>
                            <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>¿Ya tienes una cuenta? </span>
                            <Link to="/login" className="login-link-button" style={{ fontWeight: '500' }}>
                                Inicia sesión aquí
                            </Link>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}

export default Register;
