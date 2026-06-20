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

    // 3. Método para actualizar el perfil médico en la tabla independiente 'perfiles_medicos'
    async actualizarPerfilMedico(usuarioId, perfilMedico, planPremium) {
        const valorPlan = planPremium ? 1 : 0;

        // 1. Actualizar el plan del usuario en la tabla usuarios
        const queryUsuario = `UPDATE usuarios SET plan_premium = ? WHERE id = ?`;
        
        // 2. Insertar o actualizar la ficha médica en perfiles_medicos usando ON DUPLICATE KEY UPDATE
        const queryPerfil = `
            INSERT INTO perfiles_medicos (usuario_id, tipo_sangre, alergias, condiciones_medicas, medicamentos, version)
            VALUES (?, ?, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE 
                tipo_sangre = VALUES(tipo_sangre),
                alergias = VALUES(alergias),
                condiciones_medicas = VALUES(condiciones_medicas),
                medicamentos = VALUES(medicamentos),
                version = version + 1
        `;

        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();

            // Ejecutar ambas consultas bajo una misma transacción por seguridad
            await connection.execute(queryUsuario, [valorPlan, usuarioId]);
            await connection.execute(queryPerfil, [
                usuarioId,
                perfilMedico.tipoSangre,
                perfilMedico.alergias,
                perfilMedico.condiciones,
                perfilMedico.medicamentos
            ]);

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            console.error("Error en la transacción de guardar perfil:", error);
            throw error;
        } finally {
            connection.release();
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

    // 5. Método indispensable para recuperar los datos médicos guardados y rellenar 'panel.js'
    async obtenerPerfilPorUsuarioId(usuarioId) {
        const query = `
            SELECT p.tipo_sangre, p.alergias, p.condiciones_medicas, p.medicamentos, u.plan_premium
            FROM perfiles_medicos p
            INNER JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.usuario_id = ?
        `;
        try {
            const [rows] = await this.pool.execute(query, [usuarioId]);
            return rows[0] || null;
        } catch (error) {
            console.error("Error en obtenerPerfilPorUsuarioId:", error);
            throw error;
        }
    }

    // 6. Obtener un incidente específico para control de falsos positivos
    async obtenerIncidentePorId(incidenteId) {
        const query = `SELECT id, usuario_id, ubicacion_aprox, es_falso_positivo, fecha_hora FROM incidentes WHERE id = ?`;
        try {
            const [rows] = await this.pool.execute(query, [incidenteId]);
            return rows[0] || null;
        } catch (error) {
            console.error("Error al recuperar incidente:", error);
            throw error;
        }
    }

    // 7. Modificar el estado del incidente en la base de datos
    async actualizarEstadoIncidente(incidenteId, esFalsoPositivo) {
        const query = `UPDATE incidentes SET es_falso_positivo = ? WHERE id = ?`;
        try {
            await this.pool.execute(query, [esFalsoPositivo ? 1 : 0, incidenteId]);
            return true;
        } catch (error) {
            console.error("Error al actualizar estado del incidente:", error);
            throw error;
        }
    }

    // 8. Obtener todos los incidentes asociados a un usuario especifico
    async obtenerIncidentesPorUsuario(usuarioId) {
        const query = `SELECT id, ubicacion_aprox, es_falso_positivo, fecha_hora FROM incidentes WHERE usuario_id = ? ORDER BY fecha_hora DESC`;
        try {
            const [rows] = await this.pool.execute(query, [usuarioId]);
            return rows.map(row => ({
                id: row.id,
                ubicacionAprox: row.ubicacion_aprox,
                esFalsoPositivo: Boolean(row.es_falso_positivo),
                fechaHora: row.fecha_hora
            }));
        } catch (error) {
            console.error("Error al leer lista de incidentes:", error);
            throw error;
        }
    }

    // 9. Registrar un nuevo motociclista en la base de datos (CORREGIDO: password_hash)
    async registrarUsuario(id, nombre, email, passwordHash) {
        const query = `INSERT INTO usuarios (id, nombre, email, password_hash, plan_premium) VALUES (?, ?, ?, ?, 0)`;
        try {
            await this.pool.execute(query, [id, nombre, email, passwordHash]);
            return true;
        } catch (error) {
            console.error("Error al insertar usuario:", error);
            throw error;
        }
    }

    // 10. Buscar un usuario por email para el inicio de sesión (CORREGIDO: password_hash)
    async buscarPorEmail(email) {
        const query = `SELECT id, nombre, email, password_hash, tipo_usuario FROM usuarios WHERE email = ?`;
        try {
            const [rows] = await this.pool.execute(query, [email]);
            return rows[0] || null;
        } catch (error) {
            console.error("Error al buscar email:", error);
            throw error;
        }
    }

    async actualizarPlanUsuario(usuarioId, planPremium) {
        const query = `UPDATE usuarios SET plan_premium = ? WHERE id = ?`;
        try {
            await this.pool.execute(query, [planPremium ? 1 : 0, usuarioId]);
            return true;
        } catch (error) {
            console.error("Error al actualizar plan en BD:", error);
            throw error;
        }
    }

    // 11. Obtener talleres aprobados (Soporta el filtro opcional de especialidad)
    async obtenerTalleresVerificados(especialidad = null) {
        let query = `SELECT id, nombre_taller AS nombreTaller, ubicacion, especialidades, calificacion FROM mecanicos WHERE estado_verificacion = 'Aprobado'`;
        const params = [];

        if (especialidad) {
            query += ` AND especialidades LIKE ?`;
            params.push(`%${especialidad}%`);
        }

        try {
            const [rows] = await this.pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error("Error al obtener mecánicos:", error);
            throw error;
        }
    }

    // 12. Insertar una nueva solicitud de mecánico (Inicia como 'pendiente')
    async registrarMecanico(nombreTaller, ubicacion, especialidades) {
        const query = `INSERT INTO mecanicos (id, nombre_taller, ubicacion, especialidades, calificacion, estado_verificacion) VALUES (?, ?, ?, ?, 5.0, 'aprobado')`;
        try {
            const id = require('crypto').randomUUID();
            await this.pool.execute(query, [id, nombreTaller, ubicacion, especialidades]);
            return true;
        } catch (error) {
            console.error("Error al insertar mecánico:", error);
            throw error;
        }
    }
    async obtenerMetricasGlobales(){
        try {
            const [usuariosRows] = await this.pool.execute("SELECT COUNT(*) AS total FROM usuarios");
            const [usuariosPremiumRows] = await this.pool.execute("SELECT COUNT(*) AS total FROM usuarios WHERE plan_premium = 1");
            const [mecanicosRows] = await this.pool.execute("SELECT COUNT(*) AS total FROM mecanicos");
            const [qrsRows] = await this.pool.execute("SELECT COUNT(*) AS total FROM incidentes");
            return {
                totalUsuarios: usuariosRows[0]?.total || 0,
                totalPremium: usuariosPremiumRows[0]?.total || 0,
                totalMecanicos: mecanicosRows[0]?.total || 0,
                totalQrs: qrsRows[0]?.total || 0
            };

        } catch(error){
            console.error("Error al obtener metricas", error.message);
            throw error;
        }
    }

    async buscarUsuariosAdmin(criterio) {
        const query = `
            SELECT id, nombre, email, tipo_usuario AS tipo, plan_premium AS premium, estado 
            FROM usuarios 
            WHERE nombre LIKE ? OR email LIKE ?
        `;
        const parametro = `%${criterio}%`;
        const [rows] = await this.pool.execute(query, [parametro, parametro]);
        return rows;
    }

    async actualizarEstadoUsuario(usuarioId, nuevoEstado) {
        const query = "UPDATE usuarios SET estado = ? WHERE id = ?";
        await this.pool.execute(query, [nuevoEstado, usuarioId]);
        return true;
    }

    // RF44: Listar mecánicos cuyo estado de registro esté en revisión ('Pendiente')
   async obtenerMecanicosPendientes() {
        try {
            const query = `
                SELECT 
                    id, 
                    nombre_taller AS nombreTaller, 
                    ubicacion, 
                    especialidades 
                FROM mecanicos 
                WHERE estado_verificacion = 'Pendiente'
            `;
            const [rows] = await this.pool.execute(query);
            return rows || [];
        } catch (error) {
            console.error("Error en DbRepository.obtenerMecanicosPendientes:", error.message);
            throw error;
        }
    }

    // 2. Actualizar el estado y guardar la justificación del rechazo
    async actualizarEstadoMecanico(mecanicoId, nuevoEstado, justificacion) {
    try {
        // CORREGIDO: Eliminamos 'justificacion_rechazo' de la consulta SQL
        const query = `
            UPDATE mecanicos 
            SET estado_verificacion = ? 
            WHERE id = ?
        `;
        
        // Ejecutamos pasando únicamente los dos parámetros requeridos
        await this.pool.execute(query, [nuevoEstado, mecanicoId]);
        return true;
    } catch (error) {
        console.error("Error en DbRepository.actualizarEstadoMecanico:", error.message);
        throw error;
    }
}

    // RF45: Filtros combinados dinámicos con SQL para Logs
    async obtenerLogsQRFiltrados(filtros) {
    try {
        // CORREGIDO: Ajustamos los nombres de los campos basados en tu imagen de la BD
        let query = `
            SELECT 
                l.fecha_hora AS fechaHora, 
                u.nombre AS usuario, 
                l.ubicacion_aprox AS ubicacion, 
                l.id AS qrId 
            FROM incidentes l
            JOIN usuarios u ON l.usuario_id = u.id
            WHERE 1=1
        `;
        const params = [];

        // Filtros dinámicos
        if (filtros.fechaInicio) { 
            query += " AND DATE(l.fecha_hora) >= ?"; 
            params.push(filtros.fechaInicio); 
        }
        if (filtros.fechaFin) { 
            query += " AND DATE(l.fecha_hora) <= ?"; 
            params.push(filtros.fechaFin); 
        }
        if (filtros.usuario) { 
            query += " AND (u.nombre LIKE ? OR u.email LIKE ?)"; 
            params.push(`%${filtros.usuario}%`, `%${filtros.usuario}%`); 
        }
        if (filtros.ubicacion) { 
            // CORREGIDO: Filtra sobre la columna real
            query += " AND l.ubicacion_aprox LIKE ?"; 
            params.push(`%${filtros.ubicacion}%`); 
        }

        query += " ORDER BY l.fecha_hora DESC";
        
        const [rows] = await this.pool.execute(query, params);
        return rows || [];

    } catch (error) {
        console.error("Error en DbRepository.obtenerLogsQRFiltrados:", error.message);
        throw error;
    }
}

}

module.exports = DbRepository;