// src/infrastructure/controllers/userController.js

const ActualizarPanel = require('../../ports/inbound/actualizarPanel');
const GenerarQRUseCase = require('../../ports/inbound/generarQRUseCase');
const ListarTalleres = require('../../ports/inbound/listarTalleres');
const GestionarFalsoPositivo = require('../../ports/inbound/gestionarFalsoPositivo');
const DbRepository = require('../database/dbRepository');
const crypto = require('crypto');

class UserController {
    constructor() {
        const dbRepository = new DbRepository();
        
        // Inicializacion de todos los Casos de Uso (Puertos de Entrada)
        this.actualizarPanelUseCase = new ActualizarPanel(dbRepository);
        this.generarQRUseCase = new GenerarQRUseCase();
        this.listarTalleresUseCase = new ListarTalleres(dbRepository);
        this.gestionarFalsoPositivoUseCase = new GestionarFalsoPositivo(dbRepository);
        
        // Repositorio directo para lecturas que no requieren reglas complejas de dominio
        this.dbRepository = dbRepository;
    }

    async guardarDatos(req, res) {
        try {
            const { usuarioId, planPremium, datosMedicos, contactos } = req.body;

            if (!usuarioId || !datosMedicos || !contactos) {
                return res.status(400).json({ error: "Estructura de peticion incompleta." });
            }

            const resultado = await this.actualizarPanelUseCase.ejecutar(usuarioId, planPremium, datosMedicos, contactos);
            return res.json(resultado);
        } catch (error) {
            console.error("Error en UserController.guardarDatos:", error.message);
            return res.status(500).json({ error: error.message });
        }
    }

    async obtenerQR(req, res) {
        try {
            const { usuarioId } = req.query;

            if (!usuarioId) {
                return res.status(400).json({ error: "El ID del usuario es requerido." });
            }

            const qrData = await this.generarQRUseCase.ejecutar(usuarioId);
            return res.json(qrData);
        } catch (error) {
            console.error("Error en UserController.obtenerQR:", error.message);
            return res.status(500).json({ error: error.message });
        }
    }

    async buscarTalleres(req, res) {
        try {
            // CORREGIDO: Removidas las llaves duplicadas
            const { especialidad } = req.query;
            
            const talleres = await this.listarTalleresUseCase.ejecutar(especialidad);
            return res.json(talleres);
        } catch (error) {
            console.error("Error en UserController.buscarTalleres:", error.message);
            return res.status(500).json({ error: error.message });
        }
    }

    async marcarFalsoPositivo(req, res) {
        try {
            const { incidenteId } = req.body;

            if (!incidenteId) {
                return res.status(400).json({ error: "El ID del incidente es requerido." });
            }

            const resultado = await this.gestionarFalsoPositivoUseCase.ejecutar(incidenteId);
            return res.json(resultado);
        } catch (error) {
            console.error("Error en UserController.marcarFalsoPositivo:", error.message);
            return res.status(500).json({ error: error.message });
        }
    }

    async listarHistorialUsuario(req, res) {
        try {
            const { usuarioId } = req.query;
            if (!usuarioId) {
                return res.status(400).json({ error: "ID de usuario requerido." });
            }

            const incidentes = await this.dbRepository.obtenerIncidentesPorUsuario(usuarioId);
            return res.json(incidentes);
        } catch (error) {
            console.error("Error en UserController.listarHistorialUsuario:", error.message);
            return res.status(500).json({ error: error.message });
        }
    }
    async registrarNuevoUsuario(req, res) {
        try {
            const { nombre, email, password } = req.body;
            const nuevoId = crypto.randomUUID();

            // 1. Validar si el correo ya existe
            const existe = await this.dbRepository.buscarPorEmail(email);
            if (existe) return res.status(400).json({ error: "El correo ya está registrado." });

            // 2. Hashear la contraseña usando SHA-256
            const hash = crypto.createHash('sha256').update(password).digest('hex');

            // 3. Guardar en la base de datos con la contraseña protegida
            await this.dbRepository.registrarUsuario(nuevoId, nombre, email, hash);
            return res.status(201).json({ mensaje: "Usuario creado con éxito." });
        } catch (error) {
            console.error("Error en registrarNuevoUsuario:", error.message);
            return res.status(500).json({ error: error.message });
        }
    }

    async iniciarSesionUsuario(req, res) {
        try {
            const { email, password } = req.body;
            
            // 1. Buscar al usuario en MySQL
            const usuario = await this.dbRepository.buscarPorEmail(email);
            if (!usuario) {
                return res.status(401).json({ error: "El correo o la contraseña son incorrectos." });
            }

            // 2. Hashear la contraseña introducida para compararla con el hash guardado
            const hashEntrada = crypto.createHash('sha256').update(password).digest('hex');

            // 3. Evaluar si coinciden
            if (usuario.password_hash !== hashEntrada) {
                return res.status(401).json({ error: "El correo o la contraseña son incorrectos." });
            }

            // Si todo está bien, otorgamos acceso
            return res.json({ usuarioId: usuario.id, nombre: usuario.nombre });
        } catch (error) {
            console.error("Error en iniciarSesionUsuario:", error.message);
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = UserController;