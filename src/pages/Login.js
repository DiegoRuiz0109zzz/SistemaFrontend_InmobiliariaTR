import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { SystemConfig } from '../config/SystemConfig';
import axios from 'axios';
import './login.css';

function Login() {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const toast = useRef(null);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Help Dialog
    const [showHelpDialog, setShowHelpDialog] = useState(false);

    // Password Recovery Dialog
    const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
    const [recoveryStep, setRecoveryStep] = useState(1); // 1 = username, 2 = verify
    const [recoveryUsername, setRecoveryUsername] = useState('');
    const [recoveryDni, setRecoveryDni] = useState('');
    const [recoveryPhone, setRecoveryPhone] = useState('');
    const [isRecovering, setIsRecovering] = useState(false);

    useEffect(() => {
        if (user) {
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!username || !password) {
            toast.current.show({
                severity: 'warn',
                summary: 'Campos incompletos',
                detail: 'Ingrese usuario y contraseña',
                life: 3000
            });
            setIsLoading(false);
            return;
        }

        try {
            await login(username, password);
            toast.current.show({
                severity: 'success',
                summary: 'Autenticado',
                detail: `Bienvenido ${username}`,
                life: 1500
            });
        } catch (error) {
            console.error(error);
            if (error.response && error.response.status === 403) {
                toast.current.show({
                    severity: 'error',
                    summary: 'Credenciales inválidas',
                    detail: 'Usuario o contraseña incorrectos',
                    life: 3000
                });
            } else {
                toast.current.show({
                    severity: 'error',
                    summary: 'Error de Conexión',
                    detail: 'No se pudo conectar al servidor.',
                    life: 5000
                });
            }
        } finally {
            setTimeout(() => {
                setIsLoading(false);
            }, 900);
        }
    };

    // Open recovery dialog
    const openRecoveryDialog = () => {
        setRecoveryStep(1);
        setRecoveryUsername('');
        setRecoveryDni('');
        setRecoveryPhone('');
        setShowRecoveryDialog(true);
    };

    // Handle recovery step 1 -> 2
    const handleRecoveryStep1 = () => {
        if (!recoveryUsername.trim()) {
            toast.current.show({
                severity: 'warn',
                summary: 'Campo requerido',
                detail: 'Ingrese su nombre de usuario',
                life: 3000
            });
            return;
        }
        setRecoveryStep(2);
    };

    // Handle recovery submission
    const handleRecoverySubmit = async () => {
        if (!recoveryDni.trim() || !recoveryPhone.trim()) {
            toast.current.show({
                severity: 'warn',
                summary: 'Campos requeridos',
                detail: 'Ingrese su DNI y teléfono',
                life: 3000
            });
            return;
        }

        setIsRecovering(true);
        try {
            const response = await axios.post('http://localhost:8080/api/auth/recover-password', {
                username: recoveryUsername,
                docIdentidad: recoveryDni,
                telefono: recoveryPhone
            });

            toast.current.show({
                severity: 'success',
                summary: 'Contraseña Restablecida',
                detail: response.data,
                life: 5000
            });
            setShowRecoveryDialog(false);
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data || 'No se pudo restablecer la contraseña',
                life: 4000
            });
        } finally {
            setIsRecovering(false);
        }
    };

    // Recovery dialog footer
    const recoveryFooter = (
        <div className="flex justify-content-end gap-2">
            <Button
                label="Cancelar"
                icon="pi pi-times"
                className="p-button-outlined"
                style={{ color: '#495057', borderColor: '#6c757d' }}
                onClick={() => setShowRecoveryDialog(false)}
            />
            {recoveryStep === 1 ? (
                <Button
                    label="Siguiente"
                    icon="pi pi-arrow-right"
                    onClick={handleRecoveryStep1}
                />
            ) : (
                <Button
                    label={isRecovering ? "Procesando..." : "Restablecer"}
                    icon={isRecovering ? "pi pi-spin pi-spinner" : "pi pi-check"}
                    onClick={handleRecoverySubmit}
                    disabled={isRecovering}
                />
            )}
        </div>
    );

    // Help dialog footer
    const helpFooter = (
        <Button label="Entendido" icon="pi pi-check" onClick={() => setShowHelpDialog(false)} />
    );

    return (
        <div className="login-page login-container">
            <Toast ref={toast} />
            <div className="login-content">
                <div className="login-header">
                    <img src={SystemConfig.logoPath} alt="Logo" className="login-brand-logo" />
                    <h1 className="login-title" style={{ marginBottom: '0rem', marginTop: '3rem' }}>
                        {SystemConfig.appName}
                    </h1>
                    {/* <p className="login-subtitle">{SystemConfig.appDescription}</p> */}
                </div>

                <Card className="login-card">
                    <form onSubmit={handleSubmit} className="p-fluid">
                        <div className="p-field">
                            <label htmlFor="username" className="login-label">
                                <i className="pi pi-user" style={{ marginRight: '0.5rem' }}></i>
                                Usuario
                            </label>
                            <InputText
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Ingrese su usuario"
                                className="login-input"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="p-field" style={{ marginTop: '1.5rem' }}>
                            <label htmlFor="password" className="login-label">
                                <i className="pi pi-lock" style={{ marginRight: '0.5rem' }}></i>
                                Contraseña
                            </label>
                            <Password
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                toggleMask
                                feedback={false}
                                placeholder="Ingrese su contraseña"
                                className="login-input"
                                disabled={isLoading}
                            />
                        </div>

                        <Button
                            label={isLoading ? "Cargando..." : "Iniciar Sesión"}
                            icon={isLoading ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
                            type="submit"
                            className="login-button"
                            style={{ marginTop: '2rem' }}
                            disabled={isLoading}
                        />

                        <div className="login-footer">

                            <div style={{ marginTop: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={openRecoveryDialog}
                                    className="login-link-button"
                                >
                                    <i className="pi pi-key" style={{ marginRight: '0.3rem' }}></i>
                                    Olvidé mi contraseña
                                </button> </div>

                            <div style={{ marginTop: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowHelpDialog(true)}
                                    className="login-link-button"
                                    style={{ marginTop: '0.5rem' }}
                                >
                                    <i className="pi pi-question-circle" style={{ marginRight: '0.3rem' }}></i>
                                    ¿Necesitas ayuda?
                                </button>
                            </div>

                            <div style={{ marginTop: '0.75rem' }}>
                                <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>¿No tienes una cuenta? </span>
                                <Link
                                    to="/register"
                                    className="login-link-button"
                                    style={{ fontWeight: '500' }}
                                >
                                    Regístrate aquí
                                </Link>
                            </div>
                        </div>
                    </form>
                </Card>
            </div>

            {/* Password Recovery Dialog */}
            <Dialog
                header={recoveryStep === 1 ? "Recuperar Contraseña" : "Verificar Identidad"}
                visible={showRecoveryDialog}
                style={{ width: '400px' }}
                onHide={() => setShowRecoveryDialog(false)}
                footer={recoveryFooter}
            >
                {recoveryStep === 1 ? (
                    <div className="p-fluid">
                        <p className="text-700 mb-4">Ingresa tu nombre de usuario para continuar.</p>
                        <div className="p-field">
                            <label htmlFor="recovery-username" className="font-medium text-800">Usuario</label>
                            <InputText
                                id="recovery-username"
                                value={recoveryUsername}
                                onChange={(e) => setRecoveryUsername(e.target.value)}
                                placeholder="Tu nombre de usuario"
                                className="login-input"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="p-fluid">
                        <p className="text-700 mb-4">
                            Ingresa tu <strong>DNI</strong> y <strong>Teléfono</strong> registrados para verificar tu identidad.
                        </p>
                        <div className="p-field mb-3">
                            <label htmlFor="recovery-dni" className="font-medium text-800">Documento de Identidad</label>
                            <InputText
                                id="recovery-dni"
                                value={recoveryDni}
                                onChange={(e) => setRecoveryDni(e.target.value)}
                                placeholder="Ej: 12345678"
                                className="login-input"
                            />
                        </div>
                        <div className="p-field">
                            <label htmlFor="recovery-phone" className="font-medium text-800">Teléfono</label>
                            <InputText
                                id="recovery-phone"
                                value={recoveryPhone}
                                onChange={(e) => setRecoveryPhone(e.target.value)}
                                placeholder="Ej: 999999999"
                                className="login-input"
                            />
                        </div>
                    </div>
                )}
            </Dialog>

            {/* Help Dialog */}
            <Dialog
                header="¿Cómo iniciar sesión?"
                visible={showHelpDialog}
                style={{ width: '450px' }}
                onHide={() => setShowHelpDialog(false)}
                footer={helpFooter}
            >
                <div className="text-600 line-height-3">
                    <h4 className="text-900 mt-0 mb-3">
                        <i className="pi pi-sign-in mr-2 text-primary"></i>
                        Para iniciar sesión:
                    </h4>
                    <ol className="pl-3 m-0 mb-4">
                        <li className="mb-2">Ingresa tu <strong>nombre de usuario</strong>.</li>
                        <li className="mb-2">Ingresa tu <strong>contraseña</strong>.</li>
                        <li>Haz clic en <strong>"Iniciar Sesión"</strong>.</li>
                    </ol>

                    <h4 className="text-900 mb-3">
                        <i className="pi pi-key mr-2 text-primary"></i>
                        Si olvidaste tu contraseña:
                    </h4>
                    <p className="m-0 mb-4">
                        Haz clic en <strong>"Olvidé mi contraseña"</strong> y sigue los pasos para restablecerla usando tu DNI y teléfono registrado.
                    </p>

                    <h4 className="text-900 mb-3">
                        <i className="pi pi-user-plus mr-2 text-primary"></i>
                        Si no tienes una cuenta:
                    </h4>
                    <p className="m-0">
                        Contacta al administrador del sistema para que te cree una cuenta con los permisos necesarios.
                    </p>
                </div>
            </Dialog>
        </div>
    );
}

export default Login;
