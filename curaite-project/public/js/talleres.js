// public/js/talleres.js

// public/js/talleres.js
document.addEventListener("DOMContentLoaded", () => {
    const usuarioId = localStorage.getItem("usuarioId");

    // Si intenta colarse directo desde la landing page sin cuenta
    if (!usuarioId || usuarioId === "undefined") {
        alert("Para buscar talleres verificados en tu zona, por favor inicia sesión.");
        window.location.href = "/auth";
        return;
    }
    
    // Aquí continuaría tu función normal para cargar los talleres del backend...
});

async function cargarTalleres() {
    const especialidad = document.getElementById("select-especialidad").value;
    const contenedor = document.getElementById("lista-talleres");
    contenedor.innerHTML = "<p>Buscando talleres verificados...</p>";

    try {
        // Petición a nuestra API hexagonal
        const url = especialidad ? `/api/talleres?especialidad=${especialidad}` : '/api/talleres';
        const respuesta = await fetch(url);
        const talleres = await respuesta.json();

        if (talleres.length === 0) {
            contenedor.innerHTML = "<p>No se encontraron talleres verificados con esa especialidad en este momento.</p>";
            return;
        }

        contenedor.innerHTML = ""; // Limpiar
        talleres.forEach(taller => {
            const div = document.createElement("div");
            div.style = "border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 5px;";
            div.innerHTML = `
                <h3>${taller.nombreTaller} ⭐️ ${taller.calificacion}/5</h3>
                <p><strong>Ubicación:</strong> ${taller.ubicacion}</p>
                <p><strong>Especialidades:</strong> ${taller.keywordsEspecialidad}</p>
                <span style="color: green; font-weight: bold;">✓ Verificado por CuRaite</span>
            `;
            contenedor.appendChild(div);
        });
    } catch (error) {
        contenedor.innerHTML = "<p style='color:red;'>Error al conectar con el directorio.</p>";
    }
}

async function registrarMecanico(event) {
    event.preventDefault();

    const nombreTaller = document.getElementById("mec-nombre").value;
    const ubicacion = document.getElementById("mec-ubicacion").value;
    const especialidades = document.getElementById("mec-especialidades").value;

    try {
        const respuesta = await fetch('/api/talleres/registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombreTaller, ubicacion, especialidades })
        });

        if (respuesta.status === 201) {
            alert("¡Solicitud enviada! Un administrador revisará tu taller para verificarlo en el mapa.");
            document.getElementById("form-mecanico").reset();
            cargarTalleres(); // Recargar lista
        } else {
            alert("No se pudo procesar el registro del taller.");
        }
    } catch (error) {
        alert("Error de conexión al registrar taller.");
    }
}