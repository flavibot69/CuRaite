// public/js/auth.js

async function register() {
    const inputName = document.getElementById("registerName");
    const inputFirstName = document.getElementById("registerFirstName");
    const inputLastName = document.getElementById("registerLastName");
    const inputEmail = document.getElementById("registerEmail");
    const inputPassword = document.getElementById("registerPassword");

    if (inputName.value === "" || inputFirstName.value === "" || inputEmail.value === "" || inputLastName.value === "" || inputPassword.value === "") {
        alert("Llena todos los campos");
        return;
    }

    if (!validarContraseña(inputPassword.value)) {
        alert("La contraseña debe contener mínimo 8 caracteres, al menos 1 mayúscula, un número y un carácter especial");
        return;
    }

    // Concatenamos el nombre completo para el backend
    const nombreCompleto = `${inputName.value} ${inputFirstName.value} ${inputLastName.value}`.trim();

    try {
        const respuesta = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: nombreCompleto,
                email: inputEmail.value.trim(),
                password: inputPassword.value
            })
        });

        const datos = await respuesta.json();

        if (respuesta.status === 201) {
            alert("Registro exitoso. Ahora puedes iniciar sesión.");
            // Limpiar formulario de registro
            inputName.value = ""; inputFirstName.value = ""; inputLastName.value = "";
            inputEmail.value = ""; inputPassword.value = "";
        } else {
            alert("Error al registrar: " + datos.error);
        }
    } catch (error) {
        console.error("Error de red en registro:", error);
        alert("No se pudo conectar con el servidor.");
    }
}

async function login() {
    const inputEmail = document.getElementById("loginEmail");
    const inputPassword = document.getElementById("loginPassword");

    if (inputEmail.value === "" || inputPassword.value === "") {
        alert("Introduce tu correo y contraseña.");
        return;
    }

    try {
        const respuesta = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: inputEmail.value.trim(),
                password: inputPassword.value
            })
        });

        const datos = await respuesta.json();

        if (respuesta.status === 200) {
            // Guardamos el ID devuelto por el servidor en el almacenamiento local
            localStorage.setItem("usuarioId", datos.usuarioId);
            localStorage.setItem("nombreUsuario", datos.nombre);
            localStorage.setItem("rol", datos.rol);
            
            alert("Bienvenido a CuRaite, " + datos.nombre);
            window.location.href = "/panel"; // Redirección automática al panel configurado
        } else {
            alert("Error de acceso: " + datos.error);
        }
    } catch (error) {
        console.error("Error de red en login:", error);
        alert("No se pudo conectar con el servidor.");
    }
}

function validarContraseña(password) {
    const requisitos = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
    return requisitos.test(password);
}