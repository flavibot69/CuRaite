// src/ports/inbound/generarQRUseCase.js
const QRCode = require('qrcode');

class GenerarQRUseCase {
    async ejecutar(usuarioId) {
        if (!usuarioId) {
            throw new Error("Se requiere el ID del usuario para generar el código QR.");
        }

        // Esta es la URL pública que la gente escaneará en la calle.
        // Apunta a la raíz de tu servidor local con el ID del motociclista.
        const urlPublica = `http://localhost:3000/?id=${usuarioId}`;

        try {
            // Generamos el QR en formato DataURL (Base64)
            const qrBase64 = await QRCode.toDataURL(urlPublica, {
                errorCorrectionLevel: 'H', // Alta tolerancia a errores (por si el QR del casco se raya)
                margin: 2,
                width: 300
            });

            return {
                id: usuarioId,
                urlPublica: urlPublica,
                qrImage: qrBase64 // La imagen lista para el HTML
            };
        } catch (error) {
            console.error("Error generando el código QR en el puerto:", error);
            throw error;
        }
    }
}

module.exports = GenerarQRUseCase;