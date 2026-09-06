import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import React from 'react';

/**
 * Exporta un arreglo de datos a un archivo Excel (.xlsx) estándar.
 * @param {Array} columnas - Array de objetos de columna (ej. { header: 'Nombre', key: 'nombre', width: 20 })
 * @param {Array} datos - Array de objetos con los datos correspondientes a las keys de las columnas
 * @param {string} nombreArchivo - Nombre del archivo a exportar
 * @param {Object} filtros - Opcional. Objeto con los filtros aplicados para mostrarlos
 */
export const exportarExcelEstandar = async (columnas, datos, nombreArchivo = 'Reporte', filtros = null) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Datos', {
        views: [{ showGridLines: false }]
    });

    // Fila 1: INMOBILIARIA TERRANORT S.A.C.
    const fila1 = worksheet.getCell('A1');
    fila1.value = 'INMOBILIARIA TERRANORT S.A.C.';
    fila1.font = { name: 'Calibri', bold: true, size: 11 };

    // Fila 2: RUC
    const fila2 = worksheet.getCell('A2');
    fila2.value = '20613699890';
    fila2.font = { name: 'Calibri', bold: true, size: 11 };

    // Fila 3: Subtítulo genérico
    const fila3 = worksheet.getCell('A3');
    fila3.value = `Reporte de ${nombreArchivo.replace(/_/g, ' ')}`;
    fila3.font = { name: 'Calibri', bold: true, size: 11 };

    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const mesActual = meses[new Date().getMonth()];

    // Fila 5: Título centrado
    const fila5 = worksheet.getCell('C5');
    const tituloMayus = nombreArchivo.replace(/_/g, ' ').toUpperCase();
    fila5.value = `REPORTE DE ${tituloMayus} INMOBILIARIA TERRANORT - MES ${mesActual}`;
    fila5.font = { name: 'Calibri', bold: true, size: 12 };
    fila5.alignment = { horizontal: 'center' };
    worksheet.mergeCells(`C5:${String.fromCharCode(67 + Math.max(3, columnas.length - 1))}5`);

    // Fila 6: Filtros
    let textFiltros = `Filtros: `;
    if (filtros) {
        const arrFiltros = [];
        for (const [key, value] of Object.entries(filtros)) {
            if (value && value !== 'Todas las Etapas' && value !== 'Todas las Manzanas' && value !== 'Todos los Lotes') {
                arrFiltros.push(`${key}: ${value}`);
            }
        }
        if (arrFiltros.length === 0) {
            textFiltros += 'Ninguno (Mostrando todos)';
        } else {
            textFiltros += arrFiltros.join(', ');
        }
    } else {
        textFiltros += 'Ninguno (Mostrando todos)';
    }

    const fila6 = worksheet.getCell('C6');
    fila6.value = textFiltros;
    fila6.font = { name: 'Calibri', size: 10 };

    // Establecer columnas en la fila 8
    const filaInicioTabla = 8;
    
    // Mapear cabeceras en la fila 8
    columnas.forEach((col, index) => {
        const cell = worksheet.getCell(filaInicioTabla, index + 1);
        cell.value = col.header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' } // Color azulado
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
        worksheet.getColumn(index + 1).width = col.width || 20;
    });

    // Mapear datos
    datos.forEach((item, index) => {
        const rowData = columnas.map(c => item[c.key]);
        const filaActual = filaInicioTabla + 1 + index;
        
        rowData.forEach((val, colIndex) => {
            const cell = worksheet.getCell(filaActual, colIndex + 1);
            cell.value = val;
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
            };
        });
    });



    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${nombreArchivo}_${new Date().getTime()}.xlsx`);
};

/**
 * Función genérica para exportar desde la referencia de un DataTable de PrimeReact.
 * Extrae automáticamente las columnas (header y field) y los datos actuales.
 * @param {Object} dtRef - Referencia al DataTable (dt.current)
 * @param {string} nombreArchivo - Nombre del archivo a exportar
 * @param {Object} filtros - Opcional. Filtros para la cabecera del Excel.
 */
export const exportarDesdeDataTable = async (dtRef, nombreArchivo = 'Reporte', filtros = null) => {
    if (!dtRef || !dtRef.props) return;

    const children = React.Children.toArray(dtRef.props.children);
    const columns = [];
    
    // Extraer configuracion de columnas
    children.forEach(child => {
        if (child && child.props && (child.props.field || child.props.header)) {
            // Ignorar columnas de solo acciones si no tienen field y su header es 'Acciones' o vacío
            if (!child.props.field && (child.props.header === 'Acciones' || !child.props.header)) return;
            
            columns.push({
                header: child.props.header || child.props.field,
                key: child.props.field || child.props.header, // fallback para key
                width: 25 // ancho por defecto
            });
        }
    });

    // Obtener los datos (value del datatable, asume que está en props.value)
    // Si la tabla está filtrada o sorteada, PrimeReact expone processedData() (en versiones recientes) o usa value.
    const rawData = dtRef.props.value || [];
    
    // Mapear los datos según las columnas
    const exportData = rawData.map(item => {
        const row = {};
        columns.forEach(col => {
            // Resolver campos anidados (ej. 'cliente.nombre')
            const keys = col.key.split('.');
            let value = item;
            for (let k of keys) {
                if (value === null || value === undefined) break;
                value = value[k];
            }
            row[col.key] = value !== undefined && value !== null ? value : '';
        });
        return row;
    });

    await exportarExcelEstandar(columns, exportData, nombreArchivo, filtros);
};

/**
 * Exporta los datos de Historial Comercial a un formato Excel (.xlsx) específico con encabezados customizados.
 * @param {Array} datos - Array de objetos con los contratos
 * @param {Object} filtros - Objeto con los filtros aplicados para mostrarlos en el reporte
 * @param {string} nombreArchivo - Nombre del archivo a exportar
 */
export const exportarExcelHistorialComercial = async (datos, filtros, nombreArchivo = 'Historial_Comercial') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historial Comercial', {
        views: [{ showGridLines: false }]
    });

    // Fila 1: INMOBILIARIA TERRANORT S.A.C.
    const fila1 = worksheet.getCell('A1');
    fila1.value = 'INMOBILIARIA TERRANORT S.A.C.';
    fila1.font = { name: 'Calibri', bold: true, size: 11 };

    // Fila 2: RUC
    const fila2 = worksheet.getCell('A2');
    fila2.value = '20613699890';
    fila2.font = { name: 'Calibri', bold: true, size: 11 };

    // Fila 3: Contratos
    const fila3 = worksheet.getCell('A3');
    fila3.value = 'Contratos';
    fila3.font = { name: 'Calibri', bold: true, size: 11 };

    // Mes actual para el título
    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const mesActual = meses[new Date().getMonth()];

    // Fila 5: Título centrado
    const fila5 = worksheet.getCell('D5');
    fila5.value = `REPORTE DE HISTORIAL COMERCIAL INMOBILIARIA TERRANORT - MES ${mesActual}`;
    fila5.font = { name: 'Calibri', bold: true, size: 12 };
    fila5.alignment = { horizontal: 'center' };
    worksheet.mergeCells('D5:M5'); // Unir celdas para que se centre

    // Fila 6: Filtros
    // Construir texto de filtros
    let textFiltros = `Filtros: `;
    const arrFiltros = [];
    if (filtros.estadoContrato && filtros.estadoContrato !== 'Todos') arrFiltros.push(`Est. Contrato: ${filtros.estadoContrato}`);
    if (filtros.estadoPagos && filtros.estadoPagos !== 'Todas las Deudas') arrFiltros.push(`Est. Pagos: ${filtros.estadoPagos}`);
    if (filtros.documento && filtros.documento !== 'Todos') arrFiltros.push(`Doc: ${filtros.documento}`);
    if (filtros.etapa && filtros.etapa !== 'Todas las Etapas') arrFiltros.push(`${filtros.etapa}`);
    if (filtros.manzana && filtros.manzana !== 'Todas las Manzanas') arrFiltros.push(`${filtros.manzana}`);
    if (filtros.lote && filtros.lote !== 'Todos los Lotes') arrFiltros.push(`${filtros.lote}`);
    if (filtros.fechaRango && filtros.fechaRango[0]) {
        let fRango = `${filtros.fechaRango[0].toLocaleDateString()}`;
        if (filtros.fechaRango[1]) fRango += ` a ${filtros.fechaRango[1].toLocaleDateString()}`;
        arrFiltros.push(`Fecha: ${fRango}`);
    }
    if (filtros.busqueda) arrFiltros.push(`Búsqueda: ${filtros.busqueda}`);
    
    if (arrFiltros.length === 0) {
        textFiltros += 'Ninguno (Mostrando todos)';
    } else {
        textFiltros += arrFiltros.join(', ');
    }

    const fila6 = worksheet.getCell('D6');
    fila6.value = textFiltros;
    fila6.font = { name: 'Calibri', size: 10 };

    // Fila 8: Encabezados de la tabla
    const filaInicioTabla = 8;
    const columnasTabla = [
        { header: 'N° CONTRATO', key: 'contrato', width: 15 },
        { header: 'FECHA EMISION', key: 'fechaEmision', width: 15 },
        { header: 'CLIENTE', key: 'cliente', width: 35 },
        { header: 'DOCUMENTO IDENTIDAD', key: 'documento', width: 20 },
        { header: 'URBANIZACION', key: 'urbanizacion', width: 25 },
        { header: 'ETAPA', key: 'etapa', width: 15 },
        { header: 'MANZANA', key: 'manzana', width: 12 },
        { header: 'LOTE', key: 'lote', width: 10 },
        { header: 'ESTADO LOTE', key: 'estadoLote', width: 15 },
        { header: 'DOC. FIRMADO', key: 'docFirmado', width: 15 },
        { header: 'PRECIO VENTA', key: 'precioVenta', width: 15 },
        { header: 'RECAUDADO', key: 'recaudado', width: 15 },
        { header: 'PROGRESO (%)', key: 'progreso', width: 15 },
        { header: 'ESTADO PAGO', key: 'estadoPago', width: 20 },
        { header: 'CUOTAS (PAG/TOT)', key: 'totalCuotasInfo', width: 18 },
        { header: 'FECHA ULT. PAGO', key: 'ultimoPagoFmt', width: 18 },
        { header: 'MONTO ULT. PAGO', key: 'ultimoPagoMonto', width: 18 },
        { header: 'ALERTA SEPARACION', key: 'alertaSeparacion', width: 25 }
    ];

    // Asignar los encabezados en la fila 8
    columnasTabla.forEach((col, index) => {
        const cell = worksheet.getCell(filaInicioTabla, index + 1);
        cell.value = col.header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
        };
        worksheet.getColumn(index + 1).width = col.width;
    });

    // Mapear los datos a partir de la fila 9
    datos.forEach((item, index) => {
        const filaActual = filaInicioTabla + 1 + index;
        
        const mz = item.lote?.manzana?.nombre || '';
        const loteNum = item.lote?.numero || '';
        const urb = item.lote?.manzana?.etapa?.urbanizacion?.nombre || '';
        const etapa = item.lote?.manzana?.etapa?.nombre || '';
        const docFirmado = item.tieneDocumento ? 'SI' : 'NO';
        const clienteNombres = `${item.cliente?.nombres || ''} ${item.cliente?.apellidos || ''}`.trim();
        const docIdentidad = item.cliente?.numeroDocumento || '';

        const rowData = [
            item.codigo,
            item.fechaEmisionFmt,
            clienteNombres,
            docIdentidad,
            urb,
            etapa,
            mz,
            loteNum,
            item.estadoLote,
            docFirmado,
            item.precioTotal,
            item.totalPagado,
            item.progreso,
            item.estadoPago,
            item.totalCuotasInfo,
            item.ultimoPagoFmt,
            item.ultimoPagoMonto,
            item.alertaSeparacion || ''
        ];

        rowData.forEach((val, colIndex) => {
            const cell = worksheet.getCell(filaActual, colIndex + 1);
            cell.value = val;
            
            // Format numbers for currency/percentages if needed
            if (colIndex === 10 || colIndex === 11 || colIndex === 16) {
                cell.numFmt = '"S/"#,##0.00'; // Soles format
            } else if (colIndex === 12) {
                cell.numFmt = '0"%"'; // Percentage
            }
            
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
            };
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${nombreArchivo}_${new Date().getTime()}.xlsx`);
};

/**
 * Exporta los datos de Reporte Maestro a un formato Excel (.xlsx) específico con encabezados customizados.
 * @param {Array} datos - Array de objetos con los reportes
 * @param {Object} filtros - Objeto con los filtros aplicados para mostrarlos en el reporte
 * @param {string} nombreArchivo - Nombre del archivo a exportar
 */
export const exportarExcelReporteMaestro = async (datos, filtros, nombreArchivo = 'Reporte_Maestro') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Maestro', {
        views: [{ showGridLines: false }]
    });

    // Fila 1: INMOBILIARIA TERRANORT S.A.C.
    const fila1 = worksheet.getCell('A1');
    fila1.value = 'INMOBILIARIA TERRANORT S.A.C.';
    fila1.font = { name: 'Calibri', bold: true, size: 11 };

    // Fila 2: RUC
    const fila2 = worksheet.getCell('A2');
    fila2.value = '20613699890';
    fila2.font = { name: 'Calibri', bold: true, size: 11 };

    // Fila 3: Contratos / Reporte Maestro
    const fila3 = worksheet.getCell('A3');
    fila3.value = 'Reporte Maestro';
    fila3.font = { name: 'Calibri', bold: true, size: 11 };

    // Mes actual para el título
    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const mesActual = meses[new Date().getMonth()];

    // Fila 5: Título centrado
    const fila5 = worksheet.getCell('D5');
    fila5.value = `REPORTE MAESTRO INMOBILIARIA TERRANORT - MES ${mesActual}`;
    fila5.font = { name: 'Calibri', bold: true, size: 12 };
    fila5.alignment = { horizontal: 'center' };
    worksheet.mergeCells('D5:M5');

    // Fila 6: Filtros
    let textFiltros = `Filtros: `;
    const arrFiltros = [];
    if (filtros.etapa) arrFiltros.push(`Etapa: ${filtros.etapa}`);
    if (filtros.manzana) arrFiltros.push(`Manzana: ${filtros.manzana}`);
    if (filtros.numeroLote) arrFiltros.push(`Lote: ${filtros.numeroLote}`);
    if (filtros.nombreVendedor) arrFiltros.push(`Vendedor: ${filtros.nombreVendedor}`);
    if (filtros.estadoContrato) arrFiltros.push(`Estado: ${filtros.estadoContrato}`);
    if (filtros.global) arrFiltros.push(`Búsqueda: ${filtros.global}`);
    
    if (arrFiltros.length === 0) {
        textFiltros += 'Ninguno (Mostrando todos)';
    } else {
        textFiltros += arrFiltros.join(', ');
    }

    const fila6 = worksheet.getCell('D6');
    fila6.value = textFiltros;
    fila6.font = { name: 'Calibri', size: 10 };

    // Fila 8: Encabezados de la tabla
    const filaInicioTabla = 8;
    const columnasTabla = [
        { header: 'N°', width: 6 },
        { header: 'NRO DE CONTRATO', width: 18 },
        { header: 'FECHA', width: 12 },
        { header: 'CLIENTE', width: 35 },
        { header: 'DOCUMENTO IDENTIDAD', width: 22 },
        { header: 'VENDEDOR', width: 35 },
        { header: 'URBZ', width: 25 },
        { header: 'ETAPA', width: 12 },
        { header: 'MANZANA', width: 12 },
        { header: 'LOTE', width: 10 },
        { header: 'PRECIO LOTE', width: 15 },
        { header: 'PRECIO FINAL', width: 15 },
        { header: 'C. PAGAS', width: 12 },
        { header: 'C. PENDIENTES', width: 15 },
        { header: 'C. VENCIDAS', width: 15 },
        { header: 'ESTADO', width: 15 }
    ];

    // Asignar los encabezados en la fila 8
    columnasTabla.forEach((col, index) => {
        const cell = worksheet.getCell(filaInicioTabla, index + 1);
        cell.value = col.header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
        };
        worksheet.getColumn(index + 1).width = col.width;
    });

    // Mapear los datos a partir de la fila 9
    datos.forEach((item, index) => {
        const filaActual = filaInicioTabla + 1 + index;
        
        let fechaFormat = '-';
        if (item.fechaContrato) {
            const d = new Date(item.fechaContrato);
            fechaFormat = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        }

        const rowData = [
            index + 1,
            item.nroContrato,
            fechaFormat,
            item.nombreCliente,
            item.documentoCliente,
            item.nombreVendedor,
            item.urbanizacion,
            item.etapa,
            item.manzana,
            item.numeroLote,
            item.precioOficinaLote,
            item.precioVentaFinal,
            item.cuotasPagas,
            item.cuotasPendientes,
            item.cuotasVencidas,
            item.estadoContrato
        ];

        rowData.forEach((val, colIndex) => {
            const cell = worksheet.getCell(filaActual, colIndex + 1);
            cell.value = val;
            
            // Format numbers for currency
            if (colIndex === 10 || colIndex === 11) {
                cell.numFmt = '"S/"#,##0.00';
            }
            
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
            };
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${nombreArchivo}_${new Date().getTime()}.xlsx`);
};

/**
 * Exporta los datos de Reporte de Lotes a un formato Excel (.xlsx) específico con encabezados customizados.
 * @param {Array} datos - Array de objetos con los reportes
 * @param {Object} filtros - Objeto con los filtros aplicados para mostrarlos en el reporte
 * @param {string} nombreArchivo - Nombre del archivo a exportar
 */
export const exportarExcelReporteLotes = async (datos, filtros, nombreArchivo = 'Reporte_Lotes') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Lotes', {
        views: [{ showGridLines: false }]
    });

    // Fila 1: INMOBILIARIA TERRANORT S.A.C.
    const fila1 = worksheet.getCell('A1');
    fila1.value = 'INMOBILIARIA TERRANORT S.A.C.';
    fila1.font = { name: 'Calibri', bold: true, size: 11 };

    // Fila 2: RUC
    const fila2 = worksheet.getCell('A2');
    fila2.value = '20613699890';
    fila2.font = { name: 'Calibri', bold: true, size: 11 };

    // Fila 3: Contratos / Reporte de Lotes
    const fila3 = worksheet.getCell('A3');
    fila3.value = 'Reporte de Lotes';
    fila3.font = { name: 'Calibri', bold: true, size: 11 };

    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const mesActual = meses[new Date().getMonth()];

    // Fila 5: Título centrado
    const fila5 = worksheet.getCell('C5');
    fila5.value = `REPORTE DE LOTES INMOBILIARIA TERRANORT - MES ${mesActual}`;
    fila5.font = { name: 'Calibri', bold: true, size: 12 };
    fila5.alignment = { horizontal: 'center' };
    worksheet.mergeCells('C5:I5');

    // Fila 6: Filtros
    let textFiltros = `Filtros: `;
    const arrFiltros = [];
    if (filtros.etapa) arrFiltros.push(`Etapa: ${filtros.etapa}`);
    if (filtros.mz) arrFiltros.push(`Manzana: ${filtros.mz}`);
    if (filtros.clienteNombre) arrFiltros.push(`Cliente: ${filtros.clienteNombre}`);
    if (filtros.estadoVenta) arrFiltros.push(`Estado: ${filtros.estadoVenta}`);
    if (filtros.rangoFechas) arrFiltros.push(`Fechas: ${filtros.rangoFechas}`);
    if (filtros.global) arrFiltros.push(`Búsqueda: ${filtros.global}`);
    
    if (arrFiltros.length === 0) {
        textFiltros += 'Ninguno (Mostrando todos)';
    } else {
        textFiltros += arrFiltros.join(', ');
    }

    const fila6 = worksheet.getCell('C6');
    fila6.value = textFiltros;
    fila6.font = { name: 'Calibri', size: 10 };

    // Fila 8: Encabezados de la tabla
    const filaInicioTabla = 8;
    const columnasTabla = [
        { header: 'N°', width: 6 },
        { header: 'ETAPA', width: 12 },
        { header: 'MANZANA', width: 12 },
        { header: 'LOTE', width: 10 },
        { header: 'PRECIO OFICINA', width: 18 },
        { header: 'PRECIO FINAL (VENTA)', width: 22 },
        { header: 'FECHA DE VENTA', width: 16 },
        { header: 'CLIENTE ASIGNADO', width: 35 },
        { header: 'ESTADO', width: 15 }
    ];

    // Asignar los encabezados en la fila 8
    columnasTabla.forEach((col, index) => {
        const cell = worksheet.getCell(filaInicioTabla, index + 1);
        cell.value = col.header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
        };
        worksheet.getColumn(index + 1).width = col.width;
    });

    // Mapear los datos a partir de la fila 9
    datos.forEach((item, index) => {
        const filaActual = filaInicioTabla + 1 + index;
        
        let fechaFormat = '-';
        if (item.esVendido && item.fechaVenta) {
            const d = new Date(item.fechaVenta);
            if (!isNaN(d)) {
                fechaFormat = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            }
        }

        const rowData = [
            index + 1,
            item.etapa,
            item.mz,
            item.numLote,
            item.precioVenta,
            item.precioVendido,
            fechaFormat,
            item.clienteNombre,
            item.estadoVenta
        ];

        rowData.forEach((val, colIndex) => {
            const cell = worksheet.getCell(filaActual, colIndex + 1);
            cell.value = val !== undefined && val !== null ? val : '-';
            
            // Format numbers for currency
            if (colIndex === 4 || colIndex === 5) {
                if (typeof val === 'number') {
                    cell.numFmt = '"S/"#,##0.00';
                }
            }
            
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
            };
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${nombreArchivo}_${new Date().getTime()}.xlsx`);
};
