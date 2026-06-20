class GestionarUsuariosAdmin {
    constructor(dbRepository) {
        this.dbRepository = dbRepository;
    }

    async buscar(criterio) {
        return await this.dbRepository.buscarUsuariosAdmin(criterio);
    }

    async cambiarEstado(usuarioId, nuevoEstado) {
        // Regla de negocio: Validar estados permitidos (Activo, Suspendido, Eliminado)
        const estadosValidos = ['Activo', 'Suspendido', 'Eliminado'];
        if (!estadosValidos.includes(nuevoEstado)) {
            throw new Error("Estado no válido.");
        }
        return await this.dbRepository.actualizarEstadoUsuario(usuarioId, nuevoEstado);
    }
}
module.exports = GestionarUsuariosAdmin;
