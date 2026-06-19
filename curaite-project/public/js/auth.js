

function register() {
    const inputName = document.getElementById("registerName");
    const inputFirstName = document.getElementById("registerFirstName");
    const inputLastName = document.getElementById("registerLastName");
    const inputEmail = document.getElementById("registerEmail");
    const inputPassword = document.getElementById("registerPassword");
    if (inputName.value == "" || inputFirstName.value == "" || inputEmail.value == "" || inputLastName.value == ""|| inputPassword.value == ""){
        alert("Llena todos los campos");
    }else if (!validarContraseña(inputPassword.value)){
        alert("La contraseña debe contener minimo 8 caracteres, al menos 1 mayúscula, un número y un carácter especial");
    }
    
}

function validarContraseña(password){
    const requisitos = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!requisitos.test(password)){
        return false
    }else{
        return true
    }
}