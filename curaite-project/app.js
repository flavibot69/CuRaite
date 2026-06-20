// app.js

require('dotenv').config();

const express = require('express');
const path = require('path');

// 1. Importar los Controladores de Infraestructura
const QrController = require('./src/infrastructure/controllers/qrController');
const qrController = new QrController();

const UserController = require('./src/infrastructure/controllers/userController');
const userController = new UserController();

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Middlewares indispensables para entender JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// 3. --- ENRUTADO DINÁMICO DE VISTAS ---

// Raíz del sitio: Decisión estricta basada en la Query de la URL
app.get('/', (req, res) => {
    if (req.query && req.query.id) {
        console.log(`[CuRaite] Escaneo QR detectado. ID: ${req.query.id}. Redirigiendo a Emergencia.`);
        return res.sendFile(path.join(__dirname, 'public', 'views', 'emergencia.html'));
    }
    
    console.log(`[CuRaite] Acceso general detectado. Redirigiendo a Landing Page.`);
    return res.sendFile(path.join(__dirname, 'public', 'views', 'index.html'));
});

app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'auth.html'));
});

app.get('/panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'panel.html'));
});

app.get('/historial', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'historial.html'));
});

app.get('/talleres', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'talleres.html'));
});

app.get('/adminpanel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'adminpanel.html'));
});


// 4. --- RUTAS DE LA API (BACKEND) ---
app.post('/api/escanear', (req, res) => qrController.procesarEscaneo(req, res));
app.post('/api/panel/guardar', (req, res) => userController.guardarDatos(req, res));
app.get('/api/panel/qr', (req, res) => userController.obtenerQR(req, res));
app.post('/api/auth/register', (req, res) => userController.registrarNuevoUsuario(req, res));
app.post('/api/auth/login', (req, res) => userController.iniciarSesionUsuario(req, res));

// AGREGADA DE VUELTA: Ruta que panel.js usa para cargar los datos médicos del perfil
app.get('/api/incidentes/usuario', (req, res) => userController.listarHistorialUsuario(req, res));

// Ruta que historial.js usa en exclusiva para renderizar la lista de accidentes []
app.get('/api/incidentes/lista', async (req, res) => {
    try {
        const { usuarioId } = req.query;
        if (!usuarioId) {
            return res.status(400).json({ error: "ID de usuario ausente." });
        }
        
        const listaIncidentes = await userController.dbRepository.obtenerIncidentesPorUsuario(usuarioId);
        return res.json(listaIncidentes);
    } catch (error) {
        console.error("Error en /api/incidentes/lista:", error.message);
        return res.status(500).json({ error: error.message });
    }
});

app.post('/api/incidentes/falso-positivo', async (req, res) => {
    try {
        const { incidenteId } = req.body;

        if (!incidenteId) {
            return res.status(400).json({ error: "ID de incidente ausente." });
        }

        // Llamamos directamente al método 7 de tu DbRepository para marcarlo como falso positivo (1 / true)
        const actualizado = await userController.dbRepository.actualizarEstadoIncidente(incidenteId, true);

        if (actualizado) {
            return res.status(200).json({ mensaje: "El incidente ha sido marcado como falso positivo correctamente." });
        } else {
            return res.status(400).json({ error: "No se pudo actualizar el estado del incidente." });
        }
    } catch (error) {
        console.error("Error en /api/incidentes/falso-positivo:", error.message);
        return res.status(500).json({ error: error.message });
    }
});

// APIs de talleres
app.get('/api/talleres', (req, res) => userController.buscarTalleres(req, res));
app.post('/api/talleres/registrar', (req, res) => userController.registrarTaller(req, res));

//api del admin

app.get('/api/adminPanel/obtenerMetricas', (req, res) => userController.devolverMetricas(req, res));
app.get('/api/adminPanel/usuarios', (req, res) => userController.buscarUsuarios(req, res));
app.put('/api/adminPanel/usuarios/estado', (req, res) => userController.actualizarEstado(req, res));

// RF44
app.get('/api/adminPanel/mecanicos/pendientes', (req, res) => userController.listarMecanicosPendientes(req, res));
app.put('/api/adminPanel/mecanicos/resolver', (req, res) => userController.resolverSolicitudMecanico(req, res));

// RF45
app.get('/api/adminPanel/logs-qr', (req, res) => qrController.filtrarLogs(req, res));

// 5. --- ARCHIVOS ESTÁTICOS (AL FINAL) ---
app.use(express.static(path.join(__dirname, 'public')));

// Levantar el servidor
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` Servidor CuRaite Hexagonal Corriendo v1.0`);
    console.log(` Sitio web disponible en: http://localhost:${PORT}`);
    console.log(`==================================================`);
});