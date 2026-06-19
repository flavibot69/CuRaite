// src/ports/inbound/listarTalleres.js

const Mecanico = require('../../domain/entities/mecanico');

class ListarTalleres {
    constructor(dbRepository) {
        this.dbRepository = dbRepository;
    }

    async ejecutar(especialidad = null) {
        const registrosCrudos = await this.dbRepository.obtenerTalleresVerificados(especialidad);
        
        // Convertimos los registros planos de la base de datos a Entidades del Dominio
        const talleresMecanicos = registrosCrudos.map(reg => 
            new Mecanico({
                id: reg.id,
                nombreTaller: reg.nombreTaller,
                ubicacion: reg.ubicacion,
                keywordsEspecialidad: reg.especialidades,
                calificacion: reg.calificacion,
                estadoVerificacion: 'aprobado' // Viene filtrado desde el repositorio
            })
        );

        // Regla de negocio: Filtrar solo los aprobados y ordenar de forma descendente por calificación
        return talleresMecanicos
            .filter(taller => taller.isAprobado())
            .sort((a, b) => b.calificacion - a.calificacion);
    }
}

module.exports = ListarTalleres;