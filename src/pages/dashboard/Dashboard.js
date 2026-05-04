import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Home, DollarSign, TrendingUp, AlertCircle, Calendar } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { DashboardService } from '../../service/DashboardService';
import { UrbanizacionService } from '../../service/UrbanizacionService';
import { EtapaService } from '../../service/EtapaService';
import { ManzanaService } from '../../service/ManzanaService';

const Dashboard = () => {
    const { axiosInstance } = useAuth();
    const toast = useRef(null);

    // Estados para los selectores
    const [urbanizaciones, setUrbanizaciones] = useState([]);
    const [etapas, setEtapas] = useState([]);
    const [manzanas, setManzanas] = useState([]);
    
    // Estado de filtros actual
    const [filtros, setFiltros] = useState({
        urbanizacionId: null,
        etapaId: null,
        manzanaId: null,
        anio: new Date().getFullYear()
    });

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const añosDisponibles = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => ({ label: `${currentYear - i}`, value: currentYear - i }));
    }, []);

    // 1. Cargar Urbanizaciones al inicio
    useEffect(() => {
        const cargarUbicaciones = async () => {
            try {
                const urbs = await UrbanizacionService.listar(axiosInstance);
                setUrbanizaciones(urbs.map(u => ({ label: u.nombre, value: u.id })));
            } catch (error) {
                console.error("Error cargando urbanizaciones", error);
            }
        };
        if(axiosInstance) cargarUbicaciones();
    }, [axiosInstance]);

    // 2. Cargar Etapas cuando cambia la Urbanización
    useEffect(() => {
        const cargarEtapas = async () => {
            if (!filtros.urbanizacionId) {
                setEtapas([]);
                setManzanas([]);
                return;
            }
            try {
                const res = await EtapaService.listarPorUrbanizacion(filtros.urbanizacionId, axiosInstance);
                setEtapas(res.map(e => ({ label: e.nombre, value: e.id })));
            } catch (error) {
                console.error("Error cargando etapas", error);
            }
        };
        cargarEtapas();
    }, [filtros.urbanizacionId, axiosInstance]);

    // 3. Cargar Manzanas cuando cambia la Etapa
    useEffect(() => {
        const cargarManzanas = async () => {
            if (!filtros.etapaId) {
                setManzanas([]);
                return;
            }
            try {
                const res = await ManzanaService.listarPorEtapa(filtros.etapaId, axiosInstance);
                setManzanas(res.map(m => ({ label: `Mz. ${m.nombre}`, value: m.id })));
            } catch (error) {
                console.error("Error cargando manzanas", error);
            }
        };
        cargarManzanas();
    }, [filtros.etapaId, axiosInstance]);

    // 4. Cargar la data maestra del Dashboard
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!axiosInstance) return;
            
            setLoading(true);
            try {
                const result = await DashboardService.getDashboardData(
                    filtros.urbanizacionId, 
                    filtros.etapaId, 
                    filtros.manzanaId, 
                    filtros.anio, 
                    axiosInstance // PASAMOS EL TOKEN AQUÍ
                );
                setData(result);
            } catch (error) {
                toast.current?.show({ severity: 'error', summary: 'Acceso Denegado', detail: 'No se pudo cargar el Dashboard.' });
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [filtros, axiosInstance]);

    const formatCurrency = (value) => {
        if (value == null) return "S/ 0.00";
        return `S/ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const COLORS_PIE = ['#10b981', '#f43f5e']; 

    return (
        <div className="dashboard-container p-4 min-h-screen bg-gray-50">
            <Toast ref={toast} />
            
            {/* Cabecera y Filtros */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-100 flex flex-column md:flex-row justify-content-between align-items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 m-0 flex align-items-center"><TrendingUp className="mr-2 text-indigo-600" /> Panel de Control y KPI's</h1>
                    <p className="text-gray-500 text-sm mt-1 mb-0">Resumen general de ventas, finanzas e inventario.</p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                    <div className="flex flex-column gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Urbanización</label>
                        <Dropdown 
                            value={filtros.urbanizacionId} 
                            options={urbanizaciones} 
                            onChange={(e) => setFiltros({ ...filtros, urbanizacionId: e.value, etapaId: null, manzanaId: null })} 
                            placeholder="Todas" 
                            showClear 
                            className="w-full md:w-14rem" 
                        />
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Etapa</label>
                        <Dropdown 
                            value={filtros.etapaId} 
                            options={etapas} 
                            onChange={(e) => setFiltros({ ...filtros, etapaId: e.value, manzanaId: null })} 
                            placeholder="Todas" 
                            showClear 
                            disabled={!filtros.urbanizacionId}
                            className="w-full md:w-14rem" 
                        />
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Manzana</label>
                        <Dropdown 
                            value={filtros.manzanaId} 
                            options={manzanas} 
                            onChange={(e) => setFiltros({ ...filtros, manzanaId: e.value })} 
                            placeholder="Todas" 
                            showClear 
                            disabled={!filtros.etapaId}
                            className="w-full md:w-10rem" 
                        />
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Año</label>
                        <Dropdown 
                            value={filtros.anio} 
                            options={añosDisponibles} 
                            onChange={(e) => setFiltros({ ...filtros, anio: e.value })} 
                            className="w-full md:w-8rem" 
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-content-center align-items-center h-20rem">
                    <i className="pi pi-spin pi-spinner text-4xl text-indigo-500"></i>
                </div>
            ) : data && data.kpis && (
                <>
                    {/* Hero Card: Valor Total Proyectado */}
                    <div className="p-5 border-round-2xl shadow-4 mb-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)' }}>
                        <div className="absolute top-0 right-0 p-4" style={{ opacity: 0.1 }}>
                            <TrendingUp size={180} />
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-sm uppercase font-bold mb-1" style={{ color: '#a5b4fc', letterSpacing: '1px' }}>Proyección de Ingresos Brutos (Valor del Proyecto)</h2>
                            <p className="text-6xl font-black mb-4 mt-0">{formatCurrency(data.kpis.valorTotal)}</p>
                            
                            <div className="flex flex-wrap gap-4 mb-4">
                                <div className="px-4 py-3 border-round-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    <p className="text-xs mb-1 font-bold uppercase" style={{ color: '#a5b4fc' }}>Ingresos Asegurados (Vendido)</p>
                                    <p className="text-2xl font-bold m-0" style={{ color: '#6ee7b7' }}>{formatCurrency(data.kpis.valorVendido)} <span className="text-sm font-normal text-white ml-1">({data.kpis.porcentajeVentasMonto}%)</span></p>
                                </div>
                                <div className="px-4 py-3 border-round-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    <p className="text-xs mb-1 font-bold uppercase" style={{ color: '#a5b4fc' }}>Ingresos Potenciales (Por Vender)</p>
                                    <p className="text-2xl font-bold m-0" style={{ color: '#fbbf24' }}>{formatCurrency(data.kpis.valorPotencial)} <span className="text-sm font-normal text-white ml-1">({(100 - (data.kpis.porcentajeVentasMonto || 0)).toFixed(2)}%)</span></p>
                                </div>
                            </div>

                            {/* Stacked Bar Chart para Proyección */}
                            <div className="w-full mt-3 border-round-xl overflow-hidden" style={{ height: '30px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart 
                                        layout="vertical" 
                                        data={[{ name: 'Proyección', Asegurado: data.kpis.valorVendido, Potencial: data.kpis.valorPotencial }]} 
                                        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                                    >
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" hide />
                                        <RechartsTooltip 
                                            cursor={{fill: 'transparent'}}
                                            formatter={(value) => formatCurrency(value)}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ color: '#1f2937' }}
                                        />
                                        <Bar dataKey="Asegurado" stackId="a" fill="#34d399" />
                                        <Bar dataKey="Potencial" stackId="a" fill="#fbbf24" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid mb-6">
                        {/* Inventario de Lotes */}
                        <div className="col-12 lg:col-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full flex flex-column justify-content-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Home size={80} />
                                </div>
                                <div className="flex align-items-center mb-3">
                                    <div className="w-3rem h-3rem flex align-items-center justify-content-center bg-blue-100 rounded-full mr-3 text-blue-600">
                                        <Home size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 m-0">Inventario de Lotes</h3>
                                </div>
                                <div className="flex justify-content-between align-items-end mt-2 relative z-10">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Vendidos / Totales</p>
                                        <p className="text-3xl font-black text-gray-800 m-0">{data.kpis.lotesVendidos} <span className="text-lg text-gray-400 font-medium">/ {data.kpis.totalLotes}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-flex align-items-center px-2 py-1 rounded-md text-sm font-bold bg-green-100 text-green-700">
                                            {data.kpis.porcentajeVentasCantidad}% VENDIDO
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Valor de Lotes */}
                        <div className="col-12 lg:col-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full flex flex-column justify-content-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <DollarSign size={80} />
                                </div>
                                <div className="flex align-items-center mb-3">
                                    <div className="w-3rem h-3rem flex align-items-center justify-content-center bg-emerald-100 rounded-full mr-3 text-emerald-600">
                                        <DollarSign size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 m-0">Valorización de Ventas</h3>
                                </div>
                                <div className="flex justify-content-between align-items-end mt-2 relative z-10">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Dinero Vendido</p>
                                        <p className="text-3xl font-black text-gray-800 m-0">{formatCurrency(data.kpis.valorVendido)}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-flex align-items-center px-2 py-1 rounded-md text-sm font-bold bg-emerald-100 text-emerald-700">
                                            {data.kpis.porcentajeVentasMonto}% DEL TOTAL
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Finanzas: Cobrado vs Por Cobrar */}
                        <div className="col-12 lg:col-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-500 h-full flex flex-column justify-content-center relative overflow-hidden group">
                                <div className="flex align-items-center justify-content-between mb-3 relative z-10">
                                    <div className="flex align-items-center">
                                        <div className="w-3rem h-3rem flex align-items-center justify-content-center bg-orange-100 rounded-full mr-3 text-orange-600">
                                            <AlertCircle size={24} />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800 m-0">Estado Recaudación</h3>
                                    </div>
                                    <span className="text-sm font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-200">
                                        {data.kpis.porcentajeRecaudacion}% Cobrado
                                    </span>
                                </div>
                                
                                <div className="grid mt-2 relative z-10">
                                    <div className="col-6 border-r border-gray-100">
                                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Dinero en Caja</p>
                                        <p className="text-xl font-black text-emerald-600 m-0">{formatCurrency(data.kpis.totalCobrado)}</p>
                                    </div>
                                    <div className="col-6 pl-3">
                                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Por Cobrar</p>
                                        <p className="text-xl font-black text-orange-600 m-0">{formatCurrency(data.kpis.totalPorCobrar)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid">
                        
                        {/* Ventas Mensuales BarChart */}
                        <div className="col-12 lg:col-8">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full">
                                <h3 className="text-lg font-bold text-gray-800 mb-1 flex align-items-center"><Calendar className="mr-2 text-indigo-500" size={20}/>Ventas Mensuales ({filtros.anio})</h3>
                                <p className="text-sm text-gray-500 mb-4">Monto total de contratos generados por mes.</p>
                                <div style={{ height: '350px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.ventasPorMes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{fill: '#6b7280', fontSize: 12}}
                                                tickFormatter={(value) => `S/ ${value / 1000}k`}
                                            />
                                            <RechartsTooltip 
                                                cursor={{fill: '#f8fafc'}}
                                                formatter={(value) => [formatCurrency(value), "Monto Vendido"]}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="montoVendido" radius={[4, 4, 0, 0]}>
                                                {data.ventasPorMes && data.ventasPorMes.map((entry, index) => {
                                                    const maxVenta = Math.max(...data.ventasPorMes.map(d => d.montoVendido));
                                                    const isMax = entry.montoVendido === maxVenta && maxVenta > 0;
                                                    return <Cell key={`cell-${index}`} fill={isMax ? '#4f46e5' : '#a5b4fc'} />;
                                                })}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Estado del Inventario PieChart */}
                        <div className="col-12 lg:col-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full flex flex-column">
                                <h3 className="text-lg font-bold text-gray-800 mb-1 flex align-items-center"><Home className="mr-2 text-indigo-500" size={20}/>Estado de Inventario</h3>
                                <p className="text-sm text-gray-500 mb-2">Distribución de Lotes.</p>
                                
                                <div className="flex-1 flex justify-content-center align-items-center" style={{ minHeight: '250px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Vendidos', value: data.kpis.lotesVendidos || 0 },
                                                    { name: 'Disponibles', value: data.kpis.lotesDisponibles || 0 }
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                <Cell fill={COLORS_PIE[0]} />
                                                <Cell fill={COLORS_PIE[1]} />
                                            </Pie>
                                            <RechartsTooltip 
                                                formatter={(value) => [`${value} Lotes`, "Cantidad"]}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Proyección de Cobros AreaChart */}
                        <div className="col-12 mt-2">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full">
                                <h3 className="text-lg font-bold text-gray-800 mb-1 flex align-items-center"><TrendingUp className="mr-2 text-emerald-500" size={20}/>Proyección de Cobros ({filtros.anio})</h3>
                                <p className="text-sm text-gray-500 mb-4">Ingresos proyectados (S/) según vencimiento de cuotas.</p>
                                
                                <div style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.proyeccionCobrosPorMes} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{fill: '#6b7280', fontSize: 12}}
                                                tickFormatter={(value) => `S/ ${value / 1000}k`}
                                            />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <RechartsTooltip 
                                                formatter={(value) => [formatCurrency(value), "Proyectado a Cobrar"]}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Area type="monotone" dataKey="montoVendido" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMonto)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;