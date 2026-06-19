// src/ports/inbound/actualizarPanel.js

const PerfilMedico = require('../../domain/entities/perfilMedico');
const ContactoEmergencia = require('../../domain/entities/contactoEmergencia');
const Motociclista = require('../../domain/entities/motociclista');

class ActualizarPanel {
    constructor(dbRepository) {
        this.dbRepository = dbRepository;
    }

    async ejecutar(usuarioId, planPremium, datosMedicos, contactos) { // <-- Recibe planPremium
    const perfilValidado = new PerfilMedico({ /* ... */ });
    const contactosValidados = contactos.map(c => new ContactoEmergencia({ /* ... */ }));

      
        


        // 3. Crear el motociclista en el dominio para validar el límite máximo de contactos (RF17)
        const motociclista = new Motociclista({
        id: usuarioId,
        planPremium: planPremium, // <-- Pasamos el flag real
        contactos: contactosValidados
    });
        if (motociclista.contactos.length > 0 && !motociclista.planPremium) {
        throw new Error("El plan gratuito no permite almacenar contactos de emergencia.");
    }

        if (motociclista.contactos.length > 5) {
            throw new Error("El sistema restringe el almacenamiento a un máximo de 5 contactos.");
        }

        // 4. Si el dominio da luz verde, se persiste en la infraestructura
        await this.dbRepository.actualizarPerfilMedico(usuarioId, perfilValidado);
    await this.dbRepository.actualizarContactos(usuarioId, contactosValidados);
    await this.dbRepository.actualizarPlanUsuario(usuarioId, motociclista.planPremium);

    return { estatus: "completado" };
    }
}

module.exports = ActualizarPanel;