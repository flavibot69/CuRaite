class ListarLogsQR {
    constructor(dbRepository) {
        this.dbRepository = dbRepository;
    }

    async ejecutar(filtros) {
        // Regla de negocio: Sanitizar y parsear fechas si vienen vacías
        return await this.dbRepository.obtenerLogsQRFiltrados(filtros);
    }
}
module.exports = ListarLogsQR;
