import React from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import './Pagination.css';

/**
 * Componente de paginación reutilizable
 * 
 * Props:
 * - currentPage: número de página actual (0-indexed)
 * - totalPages: número total de páginas
 * - totalItems: número total de items
 * - itemsPerPage: items por página actual
 * - onPageChange: callback cuando cambia la página
 * - onItemsPerPageChange: callback cuando cambia items por página
 * - itemsPerPageOptions: array de opciones para items por página (default: [5, 10, 25, 50])
 */
const Pagination = ({
    currentPage = 0,
    totalPages = 1,
    totalItems = 0,
    itemsPerPage = 10,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions = [5, 10, 25, 50]
}) => {

    const startItem = currentPage * itemsPerPage + 1;
    const endItem = Math.min((currentPage + 1) * itemsPerPage, totalItems);

    const goToFirstPage = () => {
        if (currentPage > 0) onPageChange(0);
    };

    const goToPreviousPage = () => {
        if (currentPage > 0) onPageChange(currentPage - 1);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages - 1) onPageChange(currentPage + 1);
    };

    const goToLastPage = () => {
        if (currentPage < totalPages - 1) onPageChange(totalPages - 1);
    };

    const handleItemsPerPageChange = (e) => {
        onItemsPerPageChange(e.value);
        onPageChange(0); // Reset to first page when changing items per page
    };

    const itemsOptions = itemsPerPageOptions.map(opt => ({
        label: `${opt} por página`,
        value: opt
    }));

    return (
        <div className="pagination-container">
            <div className="pagination-info">
                <span className="pagination-text">
                    Mostrando {startItem}-{endItem} de {totalItems} registros
                </span>
            </div>

            <div className="pagination-controls">
                <div className="pagination-items-per-page">
                    <Dropdown
                        value={itemsPerPage}
                        options={itemsOptions}
                        onChange={handleItemsPerPageChange}
                        className="pagination-dropdown"
                    />
                </div>

                <div className="pagination-buttons">
                    <Button
                        icon="pi pi-angle-double-left"
                        className="p-button-text pagination-btn"
                        onClick={goToFirstPage}
                        disabled={currentPage === 0}
                        tooltip="Primera página"
                        tooltipOptions={{ position: 'top' }}
                    />
                    <Button
                        icon="pi pi-angle-left"
                        className="p-button-text pagination-btn"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 0}
                        tooltip="Página anterior"
                        tooltipOptions={{ position: 'top' }}
                    />

                    <span className="pagination-current">
                        Página {currentPage + 1} de {totalPages}
                    </span>

                    <Button
                        icon="pi pi-angle-right"
                        className="p-button-text pagination-btn"
                        onClick={goToNextPage}
                        disabled={currentPage >= totalPages - 1}
                        tooltip="Página siguiente"
                        tooltipOptions={{ position: 'top' }}
                    />
                    <Button
                        icon="pi pi-angle-double-right"
                        className="p-button-text pagination-btn"
                        onClick={goToLastPage}
                        disabled={currentPage >= totalPages - 1}
                        tooltip="Última página"
                        tooltipOptions={{ position: 'top' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Pagination;
