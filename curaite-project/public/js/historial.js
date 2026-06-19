// public/js/historial.js

document.addEventListener("DOMContentLoaded", () => {
    // ID de prueba fijo correspondiente a nuestro motociclista registrado en XAMPP
    const usuarioId = "11111111-2222-3333-4444-555555555555";
    cargarHistorial(usuarioId);
});

async function cargarHistorial(usuarioId) {
    const tbody = document.getElementById("tabla-incidentes");
    tbody.innerHTML = "<tr><td colspan='4'>Cargando registros de incidentes...</td></tr>";

    try {
        // Reutilizamos el endpoint existente para buscar los incidentes en la base de datos
        const respuesta = await fetch(`/api/incidentes/usuario?usuarioId=${usuarioId}`);
        const incidentes = await respuesta.json();

        if (respuesta.status !== 200) {
            throw new Error(incidentes.error || "Error al recuperar el historial.");
        }

        if (incidentes.length === 0) {
            tbody.innerHTML = "<tr><td colspan='4'>No tienes incidentes o escaneos registrados.</td></tr>";
            return;
        }

        tbody.innerHTML = ""; // Limpiar el mensaje de carga

        incidentes.forEach(incidente => {
            const fila = document.createElement("tr");

            // Validar textualmente el estado usando las propiedades del Dominio
            const estadoTexto = incidente.esFalsoPositivo ? "Revocado (Falso Positivo)" : "Alerta Activa";
            
            // Renderizar boton solo si el incidente no ha sido cancelado aun
            const botonAccion = incidente.esFalsoPositivo 
                ? "N/A" 
                : `<button onclick="cancelarAlerta('${incidente.id}')">Reportar Falsa Alarma</button>`;

            fila.innerHTML = `
                <td>${new Date(incidente.fechaHora).toLocaleString()}</td>
                <td>${incidente.ubicacionAprox}</td>
                <td><strong>${estadoTexto}</strong></td>
                <td>${botonAccion}</td>
            `;
            tbody.appendChild(fila);
        });

    } catch (error) {
        console.error("Error en el frontend de historial:", error);
        tbody.innerHTML = `<tr><td colspan='4' style='color: red;'>Error: ${error.message}</td></tr>`;
    }
}

async function cancelarAlerta(incidenteId) {
    const confirmar = confirm("¿Seguro que deseas marcar este escaneo como un error accidental (Falso Positivo)? Esto notificara internamente al sistema.");
    if (!confirmar) return;

    try {
        const respuesta = await fetch('/api/incidentes/falso-positivo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ incidenteId })
        });

        const resultado = await respuesta.json();

        if (respuesta.status === 200) {
            alert(resultado.mensaje);
            // Recargar la pagina con el ID fijo para ver el cambio reflejado instantaneamente
            cargarHistorial("11111111-2222-3333-4444-555555555555");
        } else {
            alert(`Error: ${resultado.error}`);
        }
    } catch (error) {
        console.error("Error de red al revocar incidente:", error);
        alert("Ocurrio un error de conexion al enviar la revocacion.");
    }
}