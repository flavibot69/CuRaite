// src/domain/motociclista.js

class Motociclista {
    constructor({ id, nombre, email, planPremium, perfilMedico, contactos = [] }) {
        this.id = id;
        this.nombre = nombre;
        this.email = email;
        this.planPremium = planPremium;
        this.perfilMedico = perfilMedico; // Objeto con tipoSangre, alergias, etc.
        this.contactos = contactos;       // Arreglo de telefonos o nombres
    }

    // Regla de Negocio: Validar si el usuario tiene derecho al envío automatizado de SMS
    puedeDispararAlertas() {
        return this.planPremium === true && this.contactos.length > 0;
    }

    // Regla de Negocio: Filtrar la información para cumplir con la privacidad de datos (RNF18)
    obtenerPerfilPublico() {
        return {
            nombre: this.nombre,
            tipoSangre: this.perfilMedico?.tipoSangre || 'No registrado',
            alergias: this.perfilMedico?.alergias || 'Ninguna',
            condiciones: this.perfilMedico?.condiciones || 'Ninguna',
            medicamentos: this.perfilMedico?.medicamentos || 'Ninguno',
            planPremium: this.planPremium
        };
    }
}

module.exports = Motociclista;