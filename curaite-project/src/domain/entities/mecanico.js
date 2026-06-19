// src/domain/mecanico.js

class Mecanico {
    constructor({ id, nombreTaller, ubicacion, keywordsEspecialidad, calificacion = 0.0, estadoVerificacion = 'pendiente' }) {
        this.id = id;
        this.nombreTaller = nombreTaller;
        this.ubicacion = ubicacion;
        this.keywordsEspecialidad = keywordsEspecialidad; // String o array de especialidades
        this.calificacion = calificacion;
        this.estadoVerificacion = estadoVerificacion; // 'pendiente', 'aprobado', 'suspendido'
    }

    isAprobado() {
        return this.estadoVerificacion === 'aprobado';
    }

    recibirCalificacion(nuevaCalificacion) {
        if (nuevaCalificacion < 1 || nuevaCalificacion > 5) {
            throw new Error("La calificación debe estar en un rango de 1.0 a 5.0 estrellas.");
        }
        // Lógica de negocio básica para promediar o asignar (adaptable según el alcance)
        this.calificacion = nuevaCalificacion;
    }
}

module.exports = Mecanico;