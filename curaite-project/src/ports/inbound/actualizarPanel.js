// src/ports/inbound/actualizarPanel.js

const Motociclista = require('../../domain/entities/motociclista');
const PerfilMedico = require('../../domain/entities/perfilMedico');
const ContactoEmergencia = require('../../domain/entities/contactoEmergencia');

class ActualizarPanel {
    constructor(dbRepository) {
        this.dbRepository = dbRepository;
    }

    async ejecutar(usuarioId, planPremium, datosMedicos, contactos) {
        // 1. Validar las entidades de dominio
        const perfilValidado = new PerfilMedico({
            tipoSangre: datosMedicos.tipoSangre,
            alergias: datosMedicos.alergias,
            condiciones: datosMedicos.condiciones,
            medicamentos: datosMedicos.medicamentos
        });

        const contactosValidados = contactos.map(c => new ContactoEmergencia({
            nombre: c.nombre,
            telefono: c.telefono,
            relacion: c.relacion
        }));

        const motociclista = new Motociclista({
            id: usuarioId,
            planPremium: planPremium,
            contactos: contactosValidados
        });

        // 2. Aplicar regla de negocio estricta
        if (motociclista.contactos.length > 0 && !motociclista.planPremium) {
            throw new Error("El plan gratuito no permite registrar contactos de emergencia.");
        }

        // 3. Guardar todo en la infraestructura de la base de datos
        // Pasamos el perfil y el plan juntos al repositorio
        await this.dbRepository.actualizarPerfilMedico(usuarioId, perfilValidado, motociclista.planPremium);
        
        if (motociclista.planPremium) {
            await this.dbRepository.actualizarContactos(usuarioId, contactosValidados);
        }

        return { estatus: "completado" };
    }
}

module.exports = ActualizarPanel;