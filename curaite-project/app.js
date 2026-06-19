// app.js


require('dotenv').config();

const express = require('express');
const path = require('path');


// 1. Importar el Controlador de Infraestructura
const QrController = require('./src/infrastructure/controllers/qrController');
const qrController = new QrController();

const UserController = require('./src/infrastructure/controllers/userController');
const userController = new UserController();

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Middlewares indispensables (¡Deben ir arriba!)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. --- RUTAS DE LA API (BACKEND HEXAGONAL) ---
// Ponemos la API primero para que Express la encuentre de inmediato
app.post('/api/escanear', (req, res) => qrController.procesarEscaneo(req, res));

// 4. Archivos estáticos (CSS, JS del cliente)
app.use(express.static(path.join(__dirname, 'public')));

// 5. --- ENRUTADO PARA VISTAS (FRONTEND) ---
// Cuando entren a la raíz, sirve el archivo HTML
/*app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'emergencia.html'));
});*/

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'index.html'));
})
app.get('/auth', (req, res)=> {
    res.sendFile(path.join(__dirname, 'public', 'views', 'auth.html'));
})
// Ruta API para guardar los datos del panel
app.post('/api/panel/guardar', (req, res) => userController.guardarDatos(req, res));

// Ruta API para obtener el código QR generado
app.get('/api/panel/qr', (req, res) => userController.obtenerQR(req, res));

// Ruta para ver el archivo HTML del panel de usuario
app.get('/panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'panel.html'));
});

// Levantar el servidor
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` Servidor CuRaite Hexagonal Corriendo v1.0`);
    console.log(` Endpoint listo en: http://localhost:${PORT}/api/escanear`);
    console.log(`==================================================`);
});