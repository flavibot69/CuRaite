// public/js/panel.js

document.addEventListener("DOMContentLoaded", () => {
    const usuarioId = localStorage.getItem("usuarioId");
    const usuarioRol = localStorage.getItem("rol");

    if (!usuarioId) {
        alert("Sesión no válida o expirada. Por favor, inicia sesión.");
        window.location.href = "/auth";
        return;
    }
    if(usuarioRol == "administrador"){
        document.getElementById("boton-admin").style.display = "block";
    }else{
        document.getElementById("boton-admin").style.display = "none";
    }
    

    // 1. Enlazar los elementos del DOM
    const form = document.getElementById("formulario-panel");
    const planFreemium = document.getElementById("plan-freemium");
    const planPremium = document.getElementById("plan-premium");
    
    const nombreCont = document.getElementById("contacto1-nombre");
    const telCont = document.getElementById("contacto1-telefono");
    const relCont = document.getElementById("contacto1-relacion");

    // 2. Función interna para activar o desactivar campos del plan en tiempo real
    function gestionarCamposPlan() {
        const esPremium = planPremium.checked;
        
        if (!esPremium) {
            // Si es gratuito, deshabilitamos, limpiamos campos y quitamos el requerimiento
            nombreCont.disabled = true; nombreCont.value = ""; nombreCont.removeAttribute("required");
            telCont.disabled = true; telCont.value = ""; telCont.removeAttribute("required");
            relCont.disabled = true; relCont.value = ""; relCont.removeAttribute("required");
        } else {
            // Si es premium, los habilitamos y los volvemos obligatorios automáticamente
            nombreCont.disabled = false; nombreCont.setAttribute("required", "true");
            telCont.disabled = false; telCont.setAttribute("required", "true");
            relCont.disabled = false; relCont.setAttribute("required", "true");
        }
    }

    // 3. Escuchar los cambios en los botones de opción del plan
    if (planFreemium && planPremium) {
        planFreemium.addEventListener("change", gestionarCamposPlan);
        planPremium.addEventListener("change", gestionarCamposPlan);
    }

    // 4. Cargar datos previos de la base de datos
    cargarDatosPanel(usuarioId);
    cargarCodigoQr(usuarioId);

    // 5. Procesar el envío del formulario con validaciones
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const tipoSangre = document.getElementById("input-sangre").value;
            const alergias = document.getElementById("input-alergias").value.trim();
            const condiciones = document.getElementById("input-condiciones").value.trim();
            const medicamentos = document.getElementById("input-medicamentos").value.trim();
            const esPremiumSeleccionado = planPremium.checked;

            // Validación estricta: Tipo de sangre obligatorio
            if (!tipoSangre) {
                alert("Debes seleccionar un tipo de sangre válido.");
                return;
            }

            const contactos = [];

            if (esPremiumSeleccionado) {
                const nombre = nombreCont.value.trim();
                const telefono = telCont.value.trim();
                const relacion = relCont.value.trim();

                // Validación por código del teléfono (10 dígitos exactos sin letras)
                const regexNumeros = /^[0-9]{10}$/;
                if (!regexNumeros.test(telefono)) {
                    alert("El campo de teléfono debe contener exactamente 10 números sin letras ni espacios.");
                    return;
                }

                contactos.push({ nombre, telefono, relacion });
            }

            // Crear el paquete de datos para enviar a la API Hexagonal
            const payload = {
                usuarioId,
                planPremium: esPremiumSeleccionado,
                datosMedicos: { tipoSangre, alergias, condiciones, medicamentos },
                contactos
            };

            try {
                const respuesta = await fetch('/api/panel/guardar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (respuesta.status === 200) {
                    alert("¡Configuración guardada y actualizada con éxito!");
                } else {
                    const err = await respuesta.json();
                    alert("Error en el servidor: " + err.error);
                }
            } catch (error) {
                console.error("Error de red:", error);
                alert("Ocurrió un fallo de red al intentar guardar los datos.");
            }
        });
    }
});

// Funciones para pintar el código QR y recuperar los datos al entrar
async function cargarDatosPanel(usuarioId) {
    try {
        const respuesta = await fetch(`/api/incidentes/usuario?usuarioId=${usuarioId}`);
        if (respuesta.status === 200) {
            const datos = await respuesta.json();
            
            if (datos && typeof datos === 'object') {
                // Mapear los nombres de columnas exactos de la tabla perfiles_medicos
                if (datos.tipo_sangre) document.getElementById("input-sangre").value = datos.tipo_sangre;
                if (datos.alergias) document.getElementById("input-alergias").value = datos.alergias;
                if (datos.condiciones_medicas) document.getElementById("input-condiciones").value = datos.condiciones_medicas;
                if (datos.medicamentos) document.getElementById("input-medicamentos").value = datos.medicamentos;
                
                // Mapear el estado de la suscripción
                if (datos.plan_premium === 1) {
                    document.getElementById("plan-premium").checked = true;
                    document.getElementById("contacto1-nombre").disabled = false;
                    document.getElementById("contacto1-telefono").disabled = false;
                    document.getElementById("contacto1-relacion").disabled = false;
                }
            }
        }
    } catch (err) {
        console.log("Creando un perfil nuevo desde cero para este usuario.");
    }
}

async function cargarCodigoQr(usuarioId) {
    const contenedor = document.getElementById("contenedor-qr");
    if (!contenedor) return;
    
    if (!usuarioId || usuarioId === "undefined") {
        contenedor.innerHTML = "<p>Error: ID de usuario no válido.</p>";
        return;
    }

    try {
        // Limpiamos el contenedor
        contenedor.innerHTML = "";

        // Creamos la URL local exacta que leerá el parametro del QR
        const urlEmergencia = `${window.location.origin}/?id=${usuarioId}`;

        // Generamos el QR directamente en el DOM de forma síncrona y nativa
        new QRCode(contenedor, {
            text: urlEmergencia,
            width: 180,
            height: 180,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

    } catch (err) {
        console.error("Error al generar el código QR nativo:", err);
        contenedor.innerHTML = "<p>Error al renderizar el código QR.</p>";
    }
} 