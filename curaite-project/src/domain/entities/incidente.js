// src/domain/incidente.js

class Incidente {
    constructor({ id, usuarioId, fechaHora = new Date(), ubicacionAprox, esFalsoPositivo = false }) {
        this.id = id;
        this.usuarioId = usuarioId;
        this.fechaHora = fechaHora;
        this.ubicacionAprox = ubicacionAprox;
        this.esFalsoPositivo = esFalsoPositivo;
    }

    marcarComoFalsoPositivo() {
        this.esFalsoPositivo = true;
    }
}

module.exports = Incidente;