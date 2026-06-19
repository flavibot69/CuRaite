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


// 3. --- ENRUTADO DINÁMICO DE VISTAS (¡DEBE IR ARRIBA DE EXPRESS.STATIC!) ---

// Raíz del sitio: Decisión estricta basada en la Query de la URL
app.get('/', (req, res) => {
    // Forzamos la validación del parámetro ?id=
    if (req.query && req.query.id) {
        console.log(`[CuRaite] Escaneo QR detectado. ID: ${req.query.id}. Redirigiendo a Emergencia.`);
        return res.sendFile(path.join(__dirname, 'public', 'views', 'emergencia.html'));
    }
    
    // Si no viene ningún ID en la URL, se muestra la Landing Page
    console.log(`[CuRaite] Acceso general detectado. Redirigiendo a Landing Page.`);
    return res.sendFile(path.join(__dirname, 'public', 'views', 'index.html'));
});

// Vista de autenticación (Registro / Login)
app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'auth.html'));
});

// Vista del panel de configuración del usuario
app.get('/panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'panel.html'));
});

// Vista del historial de alertas y falsos positivos
app.get('/historial', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'historial.html'));
});


// 4. --- RUTAS DE LA API (BACKEND) ---
app.post('/api/escanear', (req, res) => qrController.procesarEscaneo(req, res));
app.post('/api/panel/guardar', (req, res) => userController.guardarDatos(req, res));
app.get('/api/panel/qr', (req, res) => userController.obtenerQR(req, res));
app.get('/api/incidentes/usuario', (req, res) => userController.listarHistorialUsuario(req, res));
app.post('/api/auth/register', (req, res) => userController.registrarNuevoUsuario(req, res));
app.post('/api/auth/login', (req, res) => userController.iniciarSesionUsuario(req, res));


// 5. --- ARCHIVOS ESTÁTICOS (AL FINAL) ---
// Al ponerlo aquí abajo, evitamos que index.html "se coma" la lógica de la raíz '/'
app.use(express.static(path.join(__dirname, 'public')));


// Levantar el servidor
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` Servidor CuRaite Hexagonal Corriendo v1.0`);
    console.log(` Sitio web disponible en: http://localhost:${PORT}`);
    console.log(`==================================================`);
});