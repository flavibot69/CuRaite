// public/js/emergencia.js

document.addEventListener("DOMContentLoaded", () => {
    // 1. Extraer el ID del motociclista desde la URL (?id=...)
    const parametros = new URLSearchParams(window.location.search);
    const usuarioId = parametros.get("id");

    if (!usuarioId) {
        mostrarError("Código QR no válido o ID ausente.");
        return;
    }

    // 2. Intentar capturar la ubicación GPS del navegador antes de pedir los datos
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (posicion) => {
                const lat = posicion.coords.latitude;
                const lon = posicion.coords.longitude;
                const ubicacionTexto = `Lat: ${lat}, Lon: ${lon}`;
                
                document.getElementById("alerta-gps").innerText = "Ubicación compartida. Enviando alerta a familiares...";
                enviarDatosEscaneo(usuarioId, ubicacionTexto);
            },
            () => {
                // Si el usuario rechaza el GPS, enviamos la petición sin coordenadas
                document.getElementById("alerta-gps").innerText = "Ubicación rechazada. Alerta enviada sin coordenadas GPS.";
                enviarDatosEscaneo(usuarioId, "Ubicación no compartida por el usuario");
            }
        );
    } else {
        document.getElementById("alerta-gps").innerText = "El navegador no soporta geolocalización. Alerta enviada sin GPS.";
        enviarDatosEscaneo(usuarioId, "Geolocalización no soportada por el dispositivo");
    }
});

async function enviarDatosEscaneo(usuarioId, ubicacion) {
    try {
        const respuesta = await fetch('/api/escanear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuarioId, ubicacion })
        });

        const datos = await respuesta.json();

        if (respuesta.status === 200) {
            // Pintar los datos del dominio filtrados en el HTML
            document.getElementById("nombre-usuario").innerText = datos.nombre;
            document.getElementById("tipo-sangre").innerText = datos.tipoSangre;
            document.getElementById("alergias").innerText = datos.alergias;
            document.getElementById("condiciones").innerText = datos.condiciones;
            document.getElementById("medicamentos").innerText = datos.medicamentos;

            // Mostrar el bloque de información
            document.getElementById("bloque-datos").style.display = "block";
        } else {
            mostrarError(datos.error || "Error interno al procesar el escaneo.");
        }
    } catch (error) {
        console.error("Error de conexión con la API de escaneo:", error);
        mostrarError("No se pudo conectar con el servidor de CuRaite.");
    }
}

function mostrarError(mensaje) {
    document.getElementById("mensaje-error").innerText = mensaje;
    document.getElementById("bloque-error").style.display = "block";
    document.getElementById("alerta-gps").style.display = "none";
}