// src/domain/mensajeSms.js

class MensajeSms {
    constructor({ id, contenido, estadoEntrega = 'pendiente', intentos = 0 }) {
        this.id = id;
        this.contenido = contenido;
        this.estadoEntrega = estadoEntrega; // 'pendiente', 'entregado', 'fallido'
        this.intentos = intentos;
    }

    registrarEnvioExitoso() {
        this.estadoEntrega = 'entregado';
    }

    registrarFallo() {
        this.intentos += 1;
        if (this.intentos >= 3) {
            this.estadoEntrega = 'fallido';
        }
    }

    puedeReintentar() {
        return this.estadoEntrega !== 'entregado' && this.intentos < 3;
    }
}

module.exports = MensajeSms;