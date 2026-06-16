// src/infrastructure/controllers/userController.js
const ActualizarPanel = require('../../ports/inbound/actualizarPanel');
const GenerarQRUseCase = require('../../ports/inbound/generarQRUseCase');
const DbRepository = require('../database/dbRepository');

class UserController {
    constructor() {
        const dbRepository = new DbRepository();
        this.actualizarPanelUseCase = new ActualizarPanel(dbRepository);
        this.generarQRUseCase = new GenerarQRUseCase();
    }

    async guardarDatos(req, res) {
        try {
            const { usuarioId, datosMedicos, contactos } = req.body;

            if (!usuarioId) {
                return res.status(400).json({ error: "ID de usuario requerido." });
            }

            const resultado = await this.actualizarPanelUseCase.ejecutar(usuarioId, datosMedicos, contactos);
            return res.json(resultado);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async obtenerQR(req, res) {
        try {
            const { usuarioId } = req.query; // Lo recibiremos por la URL (?usuarioId=...)
            if (!usuarioId) return res.status(400).json({ error: "ID de usuario requerido." });

            const qrData = await this.generarQRUseCase.ejecutar(usuarioId);
            return res.json(qrData);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = UserController;