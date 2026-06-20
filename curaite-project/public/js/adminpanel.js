// public/js/historial.js

// public/js/historial.js
document.addEventListener("DOMContentLoaded", () => {
    const usuarioId = localStorage.getItem("usuarioId");

    // SI NO HAY SESIÓN, LO SACAMOS A LA LANDING PAGE DE INMEDIATO
    if (!usuarioId || usuarioId === "undefined") {
        alert("¡Acceso denegado! Debes iniciar sesión para el panel de administrador.");
        window.location.href = "/auth"; 
        return;
    }

    cargarMetricas();
    cargarMecanicosPendientes();
    cargarLogsQR(); // Carga por defecto sin filtros

    // Event Listeners para botones e interacciones
    // CORREGIDO: Buscamos el botón por su texto exacto de manera segura
    const botonFiltrar = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Filtrar"));
    if (botonFiltrar) {
        botonFiltrar.onclick = cargarLogsQR;
    }

    // CORREGIDO: Buscamos el botón de buscar usuarios por su texto exacto
    const botonBuscarUsuario = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Buscar"));
    if (botonBuscarUsuario) {
        botonBuscarUsuario.onclick = buscarUsuarios;
    }
});

async function cargarMetricas() {
    try {
    const respuesta = await fetch(`/api/adminPanel/obtenerMetricas`);
    const metricasGlobales = await respuesta.json();

    // Referencias a los elementos del HTML
    const tabla = document.getElementById("tabla-incidentes"); 
    const totalUsuariosSpan = document.getElementById("totalUsuarios");
    const totalMecanicosSpan = document.getElementById("totalMecanicos");
    const totalUsuariosPremSpan = document.getElementById("usuariosPremium");
    const totalQrsSpan = document.getElementById("totalQR");

    // Asignación de los valores usando textContent y protección opcional (?.)
    if (totalUsuariosSpan) totalUsuariosSpan.textContent = metricasGlobales.totalUsuarios;
    if (totalUsuariosPremSpan) totalUsuariosPremSpan.textContent = metricasGlobales.totalPremium;
    if (totalMecanicosSpan) totalMecanicosSpan.textContent = metricasGlobales.totalMecanicos;
    if (totalQrsSpan) totalQrsSpan.textContent = metricasGlobales.totalQrs;

} catch (error) {
    console.error("Error al cargar las métricas en el panel:", error);
}
}
async function buscarUsuarios() {
    const query = document.getElementById("buscarUsuario").value;
    const res = await fetch(`/api/adminPanel/usuarios?q=${encodeURIComponent(query)}`);
    const usuarios = await res.json();
    
    const tbody = document.getElementById("tablaUsuarios");
    tbody.innerHTML = "";

    usuarios.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${u.nombre}</td>
            <td>${u.email}</td>
            <td>${u.tipo}</td>
            <td>${u.premium ? 'Sí' : 'No'}</td>
            <td>${u.estado}</td>
            <td>
                <button onclick="cambiarEstadoUsuario('${u.id}', 'Suspendido')">Suspender</button>
                <button onclick="cambiarEstadoUsuario('${u.id}', 'Activo')">Activar</button>
                <button class="btn-danger" onclick="cambiarEstadoUsuario('${u.id}', 'Eliminado')">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function cambiarEstadoUsuario(usuarioId, estado) {
    const res = await fetch('/api/adminPanel/usuarios/estado', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId, estado })
    });
    if (res.ok) buscarUsuarios(); // Recarga la tabla de inmediato
}

// ==========================================
// RF44: SOLICITUDES DE MECÁNICOS PENDIENTES
// ==========================================
async function cargarMecanicosPendientes() {
    const res = await fetch('/api/adminPanel/mecanicos/pendientes');
    const solicitudes = await res.json();
    
    const tbody = document.getElementById("tablaSolicitudes");
    tbody.innerHTML = "";

    solicitudes.forEach(m => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${m.nombreTaller}</td>
            <td>${m.ubicacion}</td>
            <td>${m.especialidades}</td>
            <td>
                <button onclick="resolverMecanico('${m.id}', true)">Aprobar</button>
                <button class="btn-danger" onclick="resolverMecanico('${m.id}', false)">Rechazar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function resolverMecanico(mecanicoId, aprobado) {
    

    

    try {
        const res = await fetch('/api/adminPanel/mecanicos/resolver', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                mecanicoId: mecanicoId, 
                aprobado: Boolean(aprobado), // Forzamos explícitamente a que sea un booleano (true/false)
                
            })
        });

        if (!res.ok) {
            const errData = await res.json();
            console.error("Error del servidor al resolver mecánico:", errData.error);
            alert(`Error: ${errData.error}`);
            return;
        }

        // Si todo sale bien, limpiamos el text area y recargamos la lista
        
        await cargarMecanicosPendientes();
        alert(aprobado ? "Mecánico aprobado con éxito" : "Mecánico rechazado");

    } catch (error) {
        console.error("Error de red al resolver mecánico:", error.message);
    }
}

// ==========================================
// RF45: LOGS DE ESCANEOS QR
// ==========================================
async function cargarLogsQR() {
    const fInicio = document.getElementById("fechaInicio").value;
    const fFin = document.getElementById("fechaFin").value;
    const usuario = document.getElementById("usuarioFiltro").value;
    const ubicacion = document.getElementById("ubicacionFiltro").value;

    const queryParams = new URLSearchParams({
        fechaInicio: fInicio,
        fechaFin: fFin,
        usuario,
        ubicacion
    });

    const res = await fetch(`/api/adminPanel/logs-qr?${queryParams.toString()}`);
    const logs = await res.json();
    
    const tbody = document.getElementById("tablaLogs");
    tbody.innerHTML = "";

    logs.forEach(log => {
        const tr = document.createElement("tr");
        // Formatea la fecha de MySQL a formato amigable legible
        const fechaFormateada = new Date(log.fechaHora).toLocaleString('es-MX');
        tr.innerHTML = `
            <td>${fechaFormateada}</td>
            <td>${log.usuario}</td>
            <td>${log.ubicacion}</td>
            <td>${log.qrId}</td>
        `;
        tbody.appendChild(tr);
    });
}