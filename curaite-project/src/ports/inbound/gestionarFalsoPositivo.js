// src/ports/inbound/gestionarFalsoPositivo.js

const Incidente = require('../../domain/entities/incidente');

class GestionarFalsoPositivo {
    constructor(dbRepository) {
        this.dbRepository = dbRepository;
    }

    async ejecutar(incidenteId) {
        const incidenteCrudo = await this.dbRepository.obtenerIncidentePorId(incidenteId);

        if (!incidenteCrudo) {
            throw new Error("El registro del incidente no fue localizado.");
        }

        // Construimos la entidad de dominio
        const incidente = new Incidente({
            id: incidenteCrudo.id,
            usuarioId: incidenteCrudo.usuario_id,
            fechaHora: incidenteCrudo.fecha_hora,
            ubicacionAprox: incidenteCrudo.ubicacion_aprox,
            esFalsoPositivo: incidenteCrudo.es_falso_positivo
        });

        // Aplicamos la acción de dominio
        incidente.marcarComoFalsoPositivo();

        // Guardamos el cambio de estado en la infraestructura
        await this.dbRepository.actualizarEstadoIncidente(incidente.id, incidente.esFalsoPositivo);

        return { mensaje: "El incidente ha sido revocado y marcado como falso positivo con éxito." };
    }
}

module.exports = GestionarFalsoPositivo;