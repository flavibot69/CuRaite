// src/ports/inbound/escanearQR.js

class EscanearQR {
    // Recibe los adaptadores a través del constructor (Inyección de dependencias)
    constructor(dbRepository, smsAdapter) {
        this.dbRepository = dbRepository;
        this.smsAdapter = smsAdapter;
    }

    async ejecutar(usuarioId, ubicacion) {
        // 1. Buscar al motociclista en la base de datos de XAMPP
        const motociclista = await this.dbRepository.buscarPorId(usuarioId);
        
        if (!motociclista) {
            throw new Error("El código QR no pertenece a ningún motociclista registrado.");
        }

        // 2. Si el plan es Premium, se disparan las alertas por SMS (RF18, RF35)
        if (motociclista.planPremium === true && motociclista.contactos.length > 0) {
            const mensajeSMS = `🚨 EMERGENCIACuRaite: ${motociclista.nombre} ha tenido un incidente. Revisa su perfil médico de inmediato aquí: http://localhost:3000/views/emergencia.html?id=${motociclista.id}`;
            
            // Enviamos el SMS a cada contacto registrado (Máximo 5)
            for (const telefono of motociclista.contactos) {
                await this.smsAdapter.enviarSMS(telefono, mensajeSMS);
            }

            // 3. Registrar el incidente en el historial de XAMPP (RF30)
            await this.dbRepository.guardarIncidente(usuarioId, ubicacion || "Ubicación no compartida");
        }

        // 4. Retornar solo los datos médicos necesarios (Ocultando datos privados RNF18)
        return {
            nombre: motociclista.nombre,
            tipoSangre: motociclista.tipoSangre,
            alergias: motociclista.alergias,
            condiciones: motociclista.condiciones,
            medicamentos: motociclista.medicamentos,
            planPremium: motociclista.planPremium
        };
    }
}

module.exports = EscanearQR;