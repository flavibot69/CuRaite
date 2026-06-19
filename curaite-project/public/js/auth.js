// public/js/auth.js

async function register() {
    const inputName = document.getElementById("registerName");
    const inputFirstName = document.getElementById("registerFirstName");
    const inputLastName = document.getElementById("registerLastName");
    const inputEmail = document.getElementById("registerEmail");
    const inputPassword = document.getElementById("registerPassword");

    if (inputName.value == "" || inputFirstName.value == "" || inputEmail.value == "" || inputLastName.value == "" || inputPassword.value == "") {
        alert("Llena todos los campos");
        return;
    } 
    
    if (!validarContraseña(inputPassword.value)) {
        alert("La contraseña debe contener minimo 8 caracteres, al menos 1 mayúscula, un número y un carácter especial");
        return;
    }

    const datosRegistro = {
        nombre: `${inputName.value} ${inputFirstName.value} ${inputLastName.value}`,
        email: inputEmail.value,
        password: inputPassword.value
    };

    try {
        const respuesta = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosRegistro)
        });

        const resultado = await respuesta.json();

        if (respuesta.status === 201) {
            alert("Registro completado con éxito. Ya puedes iniciar sesión.");
            // Limpiar formulario
            inputName.value = ""; inputFirstName.value = ""; inputLastName.value = ""; inputEmail.value = ""; inputPassword.value = "";
        } else {
            alert(`Error en el registro: ${resultado.error}`);
        }
    } catch (error) {
        console.error("Error al conectar con la API de registro:", error);
        alert("Error de conexión con el servidor.");
    }
}

async function login() {
    const inputEmail = document.getElementById("loginEmail");
    const inputPassword = document.getElementById("loginPassword");

    if (inputEmail.value == "" || inputPassword.value == "") {
        alert("Por favor llena ambos campos para entrar.");
        return;
    }

    try {
        const respuesta = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: inputEmail.value, password: inputPassword.value })
        });

        const resultado = await respuesta.json();

        if (respuesta.status === 200) {
            // Guardamos temporalmente el ID devuelto por la base de datos para usarlo en el panel
            localStorage.setItem("usuarioId", resultado.usuarioId);
            alert(`Bienvenido de nuevo, ${resultado.nombre}`);
            // Redirigir de forma funcional al panel de usuario
            window.location.href = "/panel";
        } else {
            alert(`Error de acceso: ${resultado.error}`);
        }
    } catch (error) {
        console.error("Error al conectar con la API de login:", error);
        alert("Error de conexión con el servidor.");
    }
}

function validarContraseña(password) {
    const requisitos = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
    return requisitos.test(password);
}