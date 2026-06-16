// src/infrastructure/controllers/qrController.js

// Importamos el Caso de Uso (Puerto)
const EscanearQR = require('../../ports/inbound/escanearQR');

// Importamos los Adaptadores (Infraestructura de salida)
const DbRepository = require('../database/dbRepository');
const FakeSmsAdapter = require('../services/fakeSmsAdapter');

class QrController {
    constructor() {
        // Instanciamos los adaptadores reales
        const dbRepository = new DbRepository();
        const fakeSmsAdapter = new FakeSmsAdapter();

        // Le pasamos los adaptadores al caso de uso (Unión hexagonal)
        this.escanearQRUseCase = new EscanearQR(dbRepository, fakeSmsAdapter);
    }

    async procesarEscaneo(req, res) {
        try {
            const { usuarioId, ubicacion } = req.body;

            if (!usuarioId) {
                return res.status(400).json({ error: "Falta el ID del usuario en el QR." });
            }

            // Ejecutamos la lógica de negocio
            const datosMedicos = await this.escanearQRUseCase.ejecutar(usuarioId, ubicacion);

            // Respondemos con éxito al Frontend
            return res.json(datosMedicos);
        } catch (error) {
            console.error("Error en QrController:", error.message);
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = QrController;