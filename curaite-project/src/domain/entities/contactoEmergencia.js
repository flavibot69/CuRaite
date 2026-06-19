// src/domain/contactoEmergencia.js

class ContactoEmergencia {
    constructor({ id, usuarioId, nombre, telefono, relacion }) {
        this.id = id;
        this.usuarioId = usuarioId;
        this.nombre = nombre;
        this.telefono = this.validarTelefono(telefono);
        this.relacion = relacion;
    }

    validarTelefono(telefono) {
        // Expresión regular para validar formato internacional (Ej: +52 seguido de 10 dígitos)
        const regexTelefono = /^\+?[1-9]\d{1,14}$/;
        if (!regexTelefono.test(telefono)) {
            throw new Error(`El número telefónico ${telefono} no cumple con el formato internacional válido.`);
        }
        return telefono;
    }
}

module.exports = ContactoEmergencia;