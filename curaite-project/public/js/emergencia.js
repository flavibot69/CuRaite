// public/js/emergencia.js

document.addEventListener("DOMContentLoaded", () => {
    // 1. Obtener el ID del motociclista desde la URL (Ejemplo: ?id=11111111-2222-3333-4444-555555555555)
    const valoresUrl = window.location.search;
    const parametros = new URLSearchParams(valoresUrl);
    const usuarioId = parametros.get("id");

    if (!usuarioId) {
        alert("Error: No se detectó un código QR válido de CuRaite.");
        return;
    }

    // 2. Intentar obtener la ubicación GPS del celular del transeúnte (Requerimiento RF30)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (posicion) => {
                const latitud = posicion.coords.latitude;
                const longitud = posicion.coords.longitude;
                const ubicacionTexto = `Lat: ${latitud}, Lng: ${longitud}`;
                
                // Si obtenemos el GPS con éxito, enviamos los datos al backend
                enviarDatosEscaneo(usuarioId, ubicacionTexto);
            },
            (error) => {
                console.warn("El transeúnte denegó el GPS o hubo un error. Enviando sin ubicación.");
                // Si el transeúnte rechaza el permiso, procesamos el escaneo de todos modos
                enviarDatosEscaneo(usuarioId, "Ubicación rechazada por el usuario");
            }
        );
    } else {
        // Navegador antiguo sin soporte de GPS
        enviarDatosEscaneo(usuarioId, "GPS no soportado por el navegador");
    }
});

// 3. Función que conecta el Frontend con tu API Hexagonal usando fetch()
async function enviarDatosEscaneo(usuarioId, ubicacion) {
    try {
        const respuesta = await fetch('/api/escanear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usuarioId, ubicacion })
        });

        const datos = await respuesta.json();

        if (respuesta.status !== 200) {
            throw new Error(datos.error || "Error desconocido en el servidor");
        }

        // 4. Inyectar los datos recibidos del backend en el HTML de forma dinámica
        document.getElementById("tipo-sangre").innerText = datos.tipoSangre;
        document.getElementById("alergias").innerText = datos.alergias;
        document.getElementById("condiciones").innerText = datos.condiciones;
        document.getElementById("medicamentos").innerText = datos.medicamentos;
        
        // Mostrar un mensaje extra si se disparó la alerta Premium
        if (datos.planPremium) {
            console.log("¡Se han enviado alertas SMS automáticamente a los contactos de emergencia!");
        }

    } catch (error) {
        console.error("Error al procesar el escaneo en el frontend:", error);
        document.getElementById("tipo-sangre").innerText = "⚠️";
        document.getElementById("alergias").innerText = `Error al cargar la información: ${error.message}`;
    }
}