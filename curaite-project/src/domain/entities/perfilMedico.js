// src/domain/perfilMedico.js

class PerfilMedico {
    constructor({ usuarioId, tipoSangre, alergias = '', condiciones = '', medicamentos = '', version = 1 }) {
        this.usuarioId = usuarioId;
        this.tipoSangre = this.validarTipoSangre(tipoSangre);
        this.alergias = this.validarLongitud(alergias, 'alergias');
        this.condiciones = this.validarLongitud(condiciones, 'condiciones');
        this.medicamentos = medicamentos;
        this.version = version; // Control de versiones para RNF27
    }

    validarTipoSangre(sangre) {
        const sangresValidas = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        if (!sangresValidas.includes(sangre)) {
            throw new Error("El tipo de sangre proporcionado no es válido para el registro médico.");
        }
        return sangre;
    }

    validarLongitud(texto, campo) {
        if (texto && texto.length > 500) {
            throw new Error(`El campo ${campo} excede el límite permitido de 500 caracteres.`);
        }
        return texto;
    }

    incrementarVersion() {
        this.version += 1;
    }
}

module.exports = PerfilMedico;