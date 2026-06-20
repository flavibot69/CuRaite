// src/infrastructure/controllers/qrController.js

const EscanearQR = require('../../ports/inbound/escanearQR');
const DbRepository = require('../database/dbRepository');
const ListarLogsQR = require('../../ports/inbound/listarLogsQR');
const FakeSmsAdapter = require('../services/fakeSmsAdapter');

class QrController {
    constructor() {
        const dbRepository = new DbRepository();
        const fakeSmsAdapter = new FakeSmsAdapter();
        this.listarLogsQRUseCase = new ListarLogsQR(dbRepository);
        this.escanearQRUseCase = new EscanearQR(dbRepository, fakeSmsAdapter);
    }

    async procesarEscaneo(req, res) {
        try {
            const { usuarioId, ubicacion } = req.body;

            if (!usuarioId) {
                return res.status(400).json({ error: "El ID del usuario es obligatorio para procesar el codigo QR." });
            }

            // Invoca al puerto que contiene las validaciones de las entidades de dominio
            const datosMedicosPublicos = await this.escanearQRUseCase.ejecutar(usuarioId, ubicacion);

            return res.json(datosMedicosPublicos);
        } catch (error) {
            console.error("Error en QrController:", error.message);
            return res.status(500).json({ error: error.message });
        }
    }
    
    async filtrarLogs(req, res) {
        try {
            const { fechaInicio, fechaFin, usuario, ubicacion } = req.query;
            const logs = await this.listarLogsQRUseCase.ejecutar({
                fechaInicio,
                fechaFin,
                usuario,
                ubicacion
            });
            return res.json(logs);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = QrController;