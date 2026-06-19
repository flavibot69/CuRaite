// src/ports/inbound/escanearQR.js

const Motociclista = require('../../domain/entities/motociclista');
const PerfilMedico = require('../../domain/entities/perfilMedico');
const ContactoEmergencia = require('../../domain/entities/contactoEmergencia');
const MensajeSms = require('../../domain/entities/mensajeSms');

class EscanearQR {
    constructor(dbRepository, smsAdapter) {
        this.dbRepository = dbRepository;
        this.smsAdapter = smsAdapter;
    }

    async ejecutar(usuarioId, ubicacion) {
        const datosCrudos = await this.dbRepository.buscarPorId(usuarioId);
        
        if (!datosCrudos) {
            throw new Error("El código QR no pertenece a ningún motociclista registrado.");
        }

        // 1. Instanciar y validar el Perfil Médico mediante el Dominio
        const perfilMedicoDominio = new PerfilMedico({
            usuarioId: datosCrudos.id,
            tipoSangre: datosCrudos.tipoSangre,
            alergias: datosCrudos.alergias,
            condiciones: datosCrudos.condiciones,
            medicamentos: datosCrudos.medicamentos
        });

        // 2. Instanciar y validar cada Contacto de Emergencia mediante el Dominio
        const contactosDominio = datosCrudos.contactos.map(telefono => 
            new ContactoEmergencia({
                usuarioId: datosCrudos.id,
                telefono: telefono,
                nombre: "Contacto Registrado",
                relacion: "Familiar"
            })
        );

        // 3. Instanciar al Motociclista vinculando sus objetos de dominio
        const motociclista = new Motociclista({
            id: datosCrudos.id,
            nombre: datosCrudos.nombre,
            planPremium: datosCrudos.planPremium,
            perfilMedico: perfilMedicoDominio,
            contactos: contactosDominio.map(c => c.telefono)
        });

        // 4. Evaluar el disparo de alertas con la regla de negocio del dominio
        if (motociclista.puedeDispararAlertas()) {
            const enlaceEmergencia = `http://localhost:3000/?id=${motociclista.id}`;
            
            for (const telefono of motociclista.contactos) {
                // Instanciamos el flujo del mensaje en el dominio para controlar su estado
                const smsDominio = new MensajeSms({
                    contenido: `Alerta CuRaite: ${motociclista.nombre} requiere asistencia. Info medica: ${enlaceEmergencia}`
                });

                try {
                    await this.smsAdapter.enviarSMS(telefono, smsDominio.contenido);
                    smsDominio.registrarEnvioExitoso();
                } catch (error) {
                    smsDominio.registrarFallo();
                    console.error(`Fallo en el envío de SMS al número ${telefono}`);
                }
            }

            await this.dbRepository.guardarIncidente(usuarioId, ubicacion || "Ubicación no compartida");
        }

        return motociclista.obtenerPerfilPublico();
    }
}

module.exports = EscanearQR;