// src/infrastructure/controllers/userController.js

const ActualizarPanel = require('../../ports/inbound/actualizarPanel');
const GenerarQRUseCase = require('../../ports/inbound/generarQRUseCase');
const ListarTalleres = require('../../ports/inbound/listarTalleres');
const GestionarFalsoPositivo = require('../../ports/inbound/gestionarFalsoPositivo');
const GestionarUsuariosAdmin = require('../../ports/inbound/gestionarUsuariosAdmin');
const GestionarSolicitudesMecanicos = require('../../ports/inbound/gestionarSolicitudesMecanicos');
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
        this.gestionarUsuariosAdminUseCase = new GestionarUsuariosAdmin(dbRepository);
        this.gestionarSolicitudesMecanicosUseCase = new GestionarSolicitudesMecanicos(dbRepository);
        
        
        // Repositorio directo para lecturas que no requieren reglas complejas de dominio
        this.dbRepository = dbRepository;
    }

    async guardarDatos(req, res) {
        try {
            const { usuarioId, planPremium, datosMedicos, contactos } = req.body;

            if (!usuarioId) {
                return res.status(400).json({ error: "ID de usuario ausente." });
            }

            const resultado = await this.actualizarPanelUseCase.ejecutar(
                usuarioId, 
                planPremium, 
                datosMedicos, 
                contactos
            );
            
            return res.json(resultado);
        } catch (error) {
            console.error("Error en guardarDatos:", error.message);
            return res.status(500).json({ error: error.message });
        }
    }

    async obtenerQR(req, res) {
        try {
            const { usuarioId } = req.query;

            if (!usuarioId || usuarioId === "undefined") {
                return res.status(400).json({ error: "ID de usuario inválido." });
            }

            // Redirige a la raíz con la query '?id=' para que app.js lo mande a emergencia.html de forma estricta
            const urlEmergencia = `http://${req.get('host')}/?id=${usuarioId}`;
            const qrCodeUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(urlEmergencia)}&choe=UTF-8`;

            return res.json({ qrCodeUrl });
        } catch (error) {
            console.error("Error en obtenerQR:", error.message);
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

            if (!usuarioId || usuarioId === "undefined") {
                return res.status(400).json({ error: "ID de usuario ausente." });
            }

            // Llamamos al método del repositorio que creamos para traer la ficha médica real
            const perfil = await this.dbRepository.obtenerPerfilPorUsuarioId(usuarioId);

            if (!perfil) {
                // Si es un usuario nuevo sin datos, regresamos un objeto vacío
                return res.json({});
            }

            // Retornamos el perfil médico completo para que panel.js rellene los inputs
            return res.json(perfil);
        } catch (error) {
            console.error("Error en el controlador al obtener perfil:", error.message);
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
            return res.json({ usuarioId: usuario.id, nombre: usuario.nombre, rol: usuario.tipo_usuario });
        } catch (error) {
            console.error("Error en iniciarSesionUsuario:", error.message);
            return res.status(500).json({ error: error.message });
        }
    }
    async registrarTaller(req, res) {
        try {
            const { nombreTaller, ubicacion, especialidades } = req.body;
            await this.dbRepository.registrarMecanico(nombreTaller, ubicacion, especialidades);
            return res.status(201).json({ mensaje: "Taller registrado." });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    async devolverMetricas(req, res) {
        try {
            
            const metricas = await this.dbRepository.obtenerMetricasGlobales();
            
            
            return res.json(metricas);
        } catch (error) {
            console.error("Error en UserController.devolverMetricas:", error.message);
            return res.status(500).json({ error: error.message });
        }
    }
    async buscarUsuarios(req, res) {
        try {
            const { q } = req.query; // Nombre o correo electrónico
            const usuarios = await this.gestionarUsuariosAdminUseCase.buscar(q || '');
            return res.json(usuarios);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async actualizarEstado(req, res) {
        try {
            const { usuarioId, estado } = req.body;
            await this.gestionarUsuariosAdminUseCase.cambiarEstado(usuarioId, estado);
            return res.json({ mensaje: `Usuario actualizado a ${estado} con éxito.` });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    async listarMecanicosPendientes(req, res) {
        try {
            const solicitudes = await this.gestionarSolicitudesMecanicosUseCase.listarPendientes();
            return res.json(solicitudes);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    async resolverSolicitudMecanico(req, res) {
        try {
            const { mecanicoId, aprobado, justificacion } = req.body;
            await this.gestionarSolicitudesMecanicosUseCase.procesar(mecanicoId, aprobado, justificacion);
            return res.json({ mensaje: "Solicitud procesada correctamente." });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

}

module.exports = UserController;