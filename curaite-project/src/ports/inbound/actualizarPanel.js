// src/ports/inbound/actualizarPanel.js

class ActualizarPanel {
    constructor(dbRepository) {
        this.dbRepository = dbRepository;
    }

    async ejecutar(usuarioId, datosMedicos, contactos) {
        // 1. Regla de Negocio (RF17): Validar máximo 5 contactos de emergencia
        if (contactos && contactos.length > 5) {
            throw new Error("El plan de CuRaite permite un máximo de 5 contactos de emergencia.");
        }

        // 2. Regla de Negocio (RNF13): Validar longitud de textos médicos
        if (datosMedicos.alergias.length > 500 || datosMedicos.condiciones.length > 500) {
            throw new Error("Las alergias o condiciones no pueden superar los 500 caracteres.");
        }

        // 3. Ordenar a la base de datos que guarde el perfil médico
        await this.dbRepository.actualizarPerfilMedico(usuarioId, datosMedicos);

        // 4. Actualizar los contactos de emergencia (borramos los anteriores y guardamos los nuevos)
        await this.dbRepository.actualizarContactos(usuarioId, contactos);

        return { mensaje: "Panel actualizado correctamente" };
    }
}

module.exports = ActualizarPanel;