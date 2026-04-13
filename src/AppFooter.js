import React, { forwardRef } from 'react';

import { SystemConfig } from './config/SystemConfig';

export const AppFooter = forwardRef((props, ref) => {
    const añoActual = new Date().getFullYear();
    const contenidoFooter = SystemConfig.footerText.replace('{year}', añoActual);

    const styles = {
        body: {
            color: '#6b7888',
        }
    };

    return (
        <div ref={ref} className="layout-footer"> {/* Asigna la referencia al div */}
            <img src={SystemConfig.logoPath} alt="Logo" height="20" className="mr" />
            <span className="font-medium ml-2" style={styles.body}>{contenidoFooter}</span>
        </div>
    );
});