class GestionarSolicitudesMecanicos {
    constructor(dbRepository) {
        this.dbRepository = dbRepository;
    }

    async listarPendientes() {
        return await this.dbRepository.obtenerMecanicosPendientes();
    }

    async procesar(mecanicoId, aprobado, justificacion = '') {
        if (!aprobado && !justificacion.trim()) {
            throw new Error("Debe proporcionar una justificación para el rechazo.");
        }
        const nuevoEstado = aprobado ? 'Aprobado' : 'Rechazado';
        return await this.dbRepository.actualizarEstadoMecanico(mecanicoId, nuevoEstado, justificacion);
    }
}
module.exports = GestionarSolicitudesMecanicos;
