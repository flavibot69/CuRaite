// public/js/panel.js

document.getElementById("form-panel").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Id de prueba de nuestro usuario en la base de datos
    const usuarioId = "11111111-2222-3333-4444-555555555555"; 

    // Agrupamos la información médica
    const datosMedicos = {
        tipoSangre: document.getElementById("form-sangre").value,
        alergias: document.getElementById("form-alergias").value,
        condiciones: document.getElementById("form-condiciones").value,
        medicamentos: document.getElementById("form-medicamentos").value
    };

    // Agrupamos el contacto en un arreglo (Para simular la lista que pide el backend)
    const contactos = [
        {
            nombre: document.getElementById("contacto-nombre").value,
            telefono: document.getElementById("contacto-telefono").value,
            relacion: "Familiar"
        }
    ];

    try {
        const respuesta = await fetch('/api/panel/guardar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuarioId, datosMedicos, contactos })
        });

        const resultado = await respuesta.json();

        if (respuesta.status === 200) {
            alert("¡Información médica y de contactos actualizada con éxito en XAMPP!");
        } else {
            alert(`Error: ${resultado.error}`);
        }
    } catch (error) {
        console.error("Error al guardar en el panel:", error);
        alert("Ocurrió un error de red al intentar guardar.");
    }
});
// Al cargar la página, pedir el código QR correspondiente al usuario
document.addEventListener("DOMContentLoaded", async () => {
    const usuarioId = "11111111-2222-3333-4444-555555555555"; // ID de prueba fijo

    try {
        const respuesta = await fetch(`/api/panel/qr?usuarioId=${usuarioId}`);
        const datos = await respuesta.json();

        if (respuesta.status === 200) {
            const imgQr = document.getElementById("contenedor-qr");
            const btnDescargar = document.getElementById("btn-descargar-qr");

            // Asignamos la imagen Base64 al src de la etiqueta img
            imgQr.src = datos.qrImage;
            imgQr.style.display = "block";

            // Configuramos el botón de descarga automática
            btnDescargar.href = datos.qrImage;
            btnDescargar.style.display = "inline-block";
        }
    } catch (error) {
        console.error("Error al cargar el QR en el panel:", error);
    }
});