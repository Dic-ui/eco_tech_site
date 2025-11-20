// Animación al cargar tarjetas
document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".card");

    cards.forEach((card, i) => {
        setTimeout(() => {
            card.classList.add("visible");
        }, 200 * i);
    });
});

// Modo oscuro activable
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");

    // Guardar preferencia
    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("modo", "oscuro");
    } else {
        localStorage.setItem("modo", "claro");
    }
}

// Cargar preferencia de modo oscuro
if (localStorage.getItem("modo") === "oscuro") {
    document.body.classList.add("dark-mode");
}

// Mostrar notificaciones simuladas
function mostrarNotificacion(texto) {
    const noti = document.createElement("div");
    noti.className = "notificacion";
    noti.textContent = texto;

    document.body.appendChild(noti);

    setTimeout(() => {
        noti.classList.add("visible");
    }, 100);

    setTimeout(() => {
        noti.classList.remove("visible");
        setTimeout(() => noti.remove(), 500);
    }, 3000);
}

// Activar notificaciones automáticas
setTimeout(() => {
    mostrarNotificacion("ECO-TECH: Datos sincronizados correctamente.");
}, 1500);

// Interacciones sobre tarjetas
document.addEventListener("mouseover", e => {
    if (e.target.classList.contains("card")) {
        e.target.classList.add("hover-activo");
    }
});

document.addEventListener("mouseout", e => {
    if (e.target.classList.contains("card")) {
        e.target.classList.remove("hover-activo");
    }
});
