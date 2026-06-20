// public/js/historial.js

// public/js/historial.js
document.addEventListener("DOMContentLoaded", () => {
    const usuarioId = localStorage.getItem("usuarioId");

    // SI NO HAY SESIÓN, LO SACAMOS A LA LANDING PAGE DE INMEDIATO
    if (!usuarioId || usuarioId === "undefined") {
        alert("¡Acceso denegado! Debes iniciar sesión para ver tu historial.");
        window.location.href = "/auth"; 
        return;
    }

    cargarHistorial(usuarioId);
});

async function cargarHistorial(usuarioId) {
    try {
        // Apuntar a la ruta de la API que devuelve el Array []
        const respuesta = await fetch(`/api/incidentes/lista?usuarioId=${usuarioId}`);
        let incidentes = await respuesta.json();

        // Blindaje: Si por alguna razón no es un arreglo, lo convertimos en uno vacío
        if (!Array.isArray(incidentes)) {
            console.warn("La respuesta de la API no es un arreglo, remapeando...", incidentes);
            incidentes = [];
        }

        // CORREGIDO: Buscamos exactamente el ID 'tabla-incidentes' que está en tu HTML
        const tabla = document.getElementById("tabla-incidentes"); 
        
        if (!tabla) {
            console.error("No se encontró el elemento id='tabla-incidentes' en el HTML.");
            return;
        }

        tabla.innerHTML = ""; 

        if (incidentes.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center;">No tienes incidentes registrados en tu historial.</td>
                </tr>
            `;
            return;
        }

        // Renderizamos fila por fila (tr) con sus respectivas celdas (td)
        incidentes.forEach(incidente => {
            const fecha = new Date(incidente.fechaHora).toLocaleString();
            const estadoTexto = incidente.esFalsoPositivo ? "Falso Positivo" : "Alerta Real";
            
            // Si ya es falso positivo, deshabilitamos el botón de acción
            const botonAccion = incidente.esFalsoPositivo 
                ? `<span style="color: gray;">Reportado</span>`
                : `<button onclick="cancelarAlerta('${incidente.id}')">Marcar Falso Positivo</button>`;

            tabla.innerHTML += `
                <tr>
                    <td>${fecha}</td>
                    <td>${incidente.ubicacionAprox || 'No disponible'}</td>
                    <td><strong>${estadoTexto}</strong></td>
                    <td>${botonAccion}</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Error en el frontend de historial:", error);
    }
}

async function cancelarAlerta(incidenteId) {
    const confirmar = confirm("¿Seguro que deseas marcar este escaneo como un error accidental (Falso Positivo)?");
    if (!confirmar) return;

    try {
        const respuesta = await fetch('/api/incidentes/falso-positivo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ incidenteId })
        });

        const resultado = await respuesta.json();

        if (respuesta.status === 200) {
            alert(resultado.mensaje || "Estado actualizado con éxito.");
            
            // Recargar el historial dinámicamente con el usuario actual para refrescar la tabla
            const usuarioId = localStorage.getItem("usuarioId");
            cargarHistorial(usuarioId);
        } else {
            alert(`Error: ${resultado.error}`);
        }
    } catch (error) {
        console.error("Error de red al revocar incidente:", error);
        alert("Ocurrió un error de conexión al enviar la revocación.");
    }
}