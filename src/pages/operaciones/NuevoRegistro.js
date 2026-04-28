import React, { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import PageHeader from '../../components/ui/PageHeader';
import Cotizacion from './Cotizacion';
import Contrato from './Contrato';

const NuevoRegistro = () => {
    const [tabIndex, setTabIndex] = useState(0);

    return (
        <div className="contrato-page cotizacion-page">
            <PageHeader
                title="Gestion Comercial"
                description="Registro de cotizacion y contrato en un solo flujo."
                icon="pi pi-briefcase"
            />

            <div className="main-content">
                <TabView activeIndex={tabIndex} onTabChange={(e) => setTabIndex(e.index)}>
                    <TabPanel header="Cotizacion" leftIcon="pi pi-file mr-2">
                        <Cotizacion embedded />
                    </TabPanel>
                    <TabPanel header="Contrato" leftIcon="pi pi-file-edit mr-2">
                        <Contrato embedded />
                    </TabPanel>
                </TabView>
            </div>
        </div>
    );
};

export default NuevoRegistro;
