document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login_form");

    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            try {
                const response = await fetch("https://tareaweb1.onrender.com/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username, password }),
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem("authToken", data.token);
                    alert("Inicio de sesión exitoso");
                    window.location.href = "Admin.html";
                } else {
                    alert("Error al iniciar sesión. Verifica tus credenciales.");
                }
            } catch (error) {
                console.error("Error al iniciar sesión:", error);
                alert("Hubo un problema al iniciar sesión. Inténtalo más tarde.");
            }
        });
    }
});
