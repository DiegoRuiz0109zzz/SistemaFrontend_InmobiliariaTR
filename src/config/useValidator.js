import { useEffect, useState } from 'react';
import { TRUSTED_HASHES } from './hashes';
import CryptoJS from 'crypto-js';

export const useValidator = (footerRef) => {
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (footerRef && footerRef.current) {
      const footerText = footerRef.current.textContent.trim();
      const textoAValidar = footerText.split(new Date().getFullYear())[0].trim();

      const currentHash = CryptoJS.SHA256(textoAValidar).toString(CryptoJS.enc.Hex);

      if (currentHash !== TRUSTED_HASHES.APP_FOOTER) {
        console.error("Advertencia de seguridad: El texto del footer ha sido modificado.");
        setIsValid(false);
      }
    }
  }, [footerRef]);

  return isValid;
};