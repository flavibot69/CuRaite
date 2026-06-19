// src/infrastructure/database/fakeSmsAdapter.js

class FakeSmsAdapter {
    async enviarSMS(telefono, mensaje) {
        // En lugar de gastar saldo en una API real, simulamos el comportamiento en la consola
        console.log(`\n--- SIMULACIÓN DE SMS ENVIADO (Cumpliendo RNF24) ---`);
        console.log(`Para: ${telefono}`);
        console.log(`Contenido: ${mensaje}`);
        console.log(`Estado: Entregado con éxito a la red celular.\n------------------------------------------------\n`);
        return true;
    }
}

module.exports = FakeSmsAdapter;