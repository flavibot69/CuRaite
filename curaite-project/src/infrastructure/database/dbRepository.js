// src/infrastructure/database/dbRepository.js
require('dotenv').config();

const mysql = require('mysql2/promise'); // Usamos la versión de promesas para usar async/await

class DbRepository {
    constructor() {
        // Creamos un "Pool" de conexiones usando las variables que pusimos en el .env
        this.pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }

    // 1. Método para buscar un motociclista por su ID (Para cuando escanean el QR)
    async buscarPorId(usuarioId) {
        const queryUsuario = `SELECT id, nombre, plan_premium FROM usuarios WHERE id = ?`;
        const queryMedica = `SELECT tipo_sangre, alergias, condiciones_medicas, medicamentos FROM perfiles_medicos WHERE usuario_id = ?`;
        const queryContactos = `SELECT telefono FROM contactos_emergencia WHERE usuario_id = ?`;

        try {
            // Ejecutamos las consultas en la base de datos de XAMPP
            const [usuarios] = await this.pool.execute(queryUsuario, [usuarioId]);
            
            if (usuarios.length === 0) return null; // Si no existe el usuario

            const [perfil] = await this.pool.execute(queryMedica, [usuarioId]);
            const [contactos] = await this.pool.execute(queryContactos, [usuarioId]);

            // Juntamos toda la información en un solo objeto limpio de JavaScript (como pide el Dominio)
            return {
                id: usuarios[0].id,
                nombre: usuarios[0].nombre,
                planPremium: Boolean(usuarios[0].plan_premium),
                tipoSangre: perfil[0]?.tipo_sangre || 'No registrado',
                alergias: perfil[0]?.alergias || 'Ninguna',
                condiciones: perfil[0]?.condiciones_medicas || 'Ninguna',
                medicamentos: perfil[0]?.medicamentos || 'Ninguno',
                contactos: contactos.map(c => c.telefono) // Devolvemos un arreglo con los teléfonos
            };
        } catch (error) {
            console.error("Error en el adaptador de Base de Datos (buscarPorId):", error);
            throw error;
        }
    }

    // 2. Método para registrar un incidente en el historial (RF30)
    async guardarIncidente(usuarioId, ubicacion) {
        const query = `INSERT INTO incidentes (id, usuario_id, ubicacion_aprox) VALUES (UUID(), ?, ?)`;
        try {
            await this.pool.execute(query, [usuarioId, ubicacion]);
            return true;
        } catch (error) {
            console.error("Error en el adaptador de Base de Datos (guardarIncidente):", error);
            throw error;
        }
    }
    // 3. Método para actualizar el perfil médico
    async actualizarPerfilMedico(usuarioId, datos) {
        const query = `
            INSERT INTO perfiles_medicos (usuario_id, tipo_sangre, alergias, condiciones_medicas, medicamentos, version)
            VALUES (?, ?, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE 
                tipo_sangre = VALUES(tipo_sangre), 
                alergias = VALUES(alergias), 
                condiciones_medicas = VALUES(condiciones_medicas), 
                medicamentos = VALUES(medicamentos),
                version = version + 1; -- Cumple RNF27 (Historial de versiones)
        `;
        try {
            await this.pool.execute(query, [usuarioId, datos.tipoSangre, datos.alergias, datos.condiciones, datos.medicamentos]);
        } catch (error) {
            console.error("Error al actualizar perfil médico:", error);
            throw error;
        }
    }

    // 4. Método para actualizar contactos de emergencia
    async actualizarContactos(usuarioId, contactos) {
        try {
            // Primero eliminamos los contactos anteriores para no duplicar
            await this.pool.execute(`DELETE FROM contactos_emergencia WHERE usuario_id = ?`, [usuarioId]);

            // Insertamos los nuevos contactos uno por uno
            const queryInsert = `INSERT INTO contactos_emergencia (id, usuario_id, nombre, telefono, relacion) VALUES (UUID(), ?, ?, ?, ?)`;
            for (const contacto of contactos) {
                await this.pool.execute(queryInsert, [usuarioId, contacto.nombre, contacto.telefono, contacto.relacion]);
            }
        } catch (error) {
            console.error("Error al actualizar contactos:", error);
            throw error;
        }
    }
}

module.exports = DbRepository;