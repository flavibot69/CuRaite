// public/js/panel.js

document.addEventListener("DOMContentLoaded", () => {
    // 1. Recuperar el ID del usuario autenticado desde el almacenamiento local
    const usuarioId = localStorage.getItem("usuarioId");

    if (!usuarioId) {
        alert("Sesión no válida o expirada. Por favor, inicia sesión.");
        window.location.href = "/auth";
        return;
    }

    // 2. Cargar la información inicial del conductor
    cargarDatosPanel(usuarioId);
    cargarCodigoQr(usuarioId);

    // 3. Escuchar el evento de guardado del formulario
    const formulario = document.getElementById("formulario-panel");
    if (formulario) {
        formulario.addEventListener("submit", (e) => {
            e.preventDefault();
            guardarDatosPanel(usuarioId);
        });
    }
});

async function cargarDatosPanel(usuarioId) {
    try {
        // Solicitamos los datos actuales del usuario (Reutiliza el endpoint de lectura pública)
        const respuesta = await fetch(`/api/incidentes/usuario?usuarioId=${usuarioId}`);
        
        // Si el usuario es completamente nuevo y no tiene historial médico aún, 
        // el servidor responderá correctamente pero el formulario se mantendrá vacío para su llenado.
        if (respuesta.status === 200) {
            const datos = await respuesta.json();
            // Si tu endpoint de lectura devuelve el formato del perfil, aquí mapeas los inputs:
            // Ejemplo: document.getElementById("input-sangre").value = datos.tipoSangre;
        }
    } catch (error) {
        console.error("Error al recuperar datos iniciales:", error);
    }
}

async function cargarCodigoQr(usuarioId) {
    const contenedorQr = document.getElementById("contenedor-qr");
    if (!contenedorQr) return;

    try {
        const respuesta = await fetch(`/api/panel/qr?usuarioId=${usuarioId}`);
        const datos = await respuesta.json();

        if (respuesta.status === 200) {
            // Pintamos el código QR en texto o imagen generado por el caso de uso
            contenedorQr.innerHTML = `<img src="${datos.qrCodeUrl}" alt="Código QR de Emergencia" style="max-width: 200px;"/>`;
        } else {
            contenedorQr.innerHTML = "<p>Error al generar el código QR dinámico.</p>";
        }
    } catch (error) {
        console.error("Error de red al solicitar el QR:", error);
        contenedorQr.innerHTML = "<p>No se pudo conectar para obtener el QR.</p>";
    }
}

// Añadir al final de public/js/panel.js o integrarlo

function evaluarRestriccionesPlan() {
    const esPremium = document.getElementById("plan-premium").checked;
    
    // Campos del contacto de emergencia
    const nombreCont = document.getElementById("contacto1-nombre");
    const telCont = document.getElementById("contacto1-telefono");
    const relCont = document.getElementById("contacto1-relacion");

    if (!esPremium) {
        // Bloquear campos y limpiarlos si es Freemium
        if(nombreCont) { nombreCont.disabled = true; nombreCont.value = ""; }
        if(telCont) { telCont.disabled = true; telCont.value = ""; }
        if(relCont) { relCont.disabled = true; relCont.value = ""; }
        console.log("[CuRaite] Restricción Freemium aplicada: Contactos deshabilitados.");
    } else {
        // Desbloquear si es Premium
        if(nombreCont) nombreCont.disabled = false;
        if(telCont) telCont.disabled = false;
        if(relacionCont) relCont.disabled = false;
    }
}

// MODIFICAR la función existente guardarDatosPanel para capturar el plan:
async function guardarDatosPanel(usuarioId) {
    const tipoSangre = document.getElementById("input-sangre").value;
    const alergias = document.getElementById("input-alergias").value;
    const condiciones = document.getElementById("input-condiciones").value;
    const medicamentos = document.getElementById("input-medicamentos").value;
    
    // Capturamos el valor del Radio Button del Plan
    const planPremium = document.getElementById("plan-premium").checked;

    const contactos = [];
    if (planPremium) {
        const nombreContacto1 = document.getElementById("contacto1-nombre")?.value;
        const telContacto1 = document.getElementById("contacto1-telefono")?.value;
        const relContacto1 = document.getElementById("contacto1-relacion")?.value;

        if (nombreContacto1 && telContacto1) {
            contactos.push({ nombre: nombreContacto1, telefono: telContacto1, relacion: relContacto1 });
        }
    }

    const payload = {
        usuarioId,
        // Enviamos el estado del plan al servidor
        planPremium, 
        datosMedicos: { tipoSangre, alergias, condiciones, medicamentos },
        contactos
    };

    try {
        const respuesta = await fetch('/api/panel/guardar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const resultado = await respuesta.json();
        if (respuesta.status === 200) {
            alert("¡Configuración de perfil y plan actualizada con éxito!");
        } else {
            alert(`Error: ${resultado.error}`);
        }
    } catch (error) {
        alert("Error de conexión al guardar.");
    }
}