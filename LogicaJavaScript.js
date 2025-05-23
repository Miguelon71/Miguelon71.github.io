let cart = [];
const API_BASE_URL = "https://tareaweb1.onrender.com/api"; // Assuming Django runs on port 8000

document.addEventListener("DOMContentLoaded", () => {
    fetchMenu();
    const orderForm = document.getElementById("order-form");

    if (orderForm) {
        orderForm.addEventListener("submit", submitOrder);
        console.log("Formulario vinculado correctamente.");
    } else {
        console.error("No se encontró el formulario de pedido.");
    }
});

async function fetchMenu() {
    try {
        const response = await fetch(`${API_BASE_URL}/menu/`);
        if (!response.ok) {
            throw new Error(`Error al obtener el menú: ${response.statusText}`);
        }
        const menuItems = await response.json();
        renderMenu(menuItems);
    } catch (error) {
        console.error("Error al cargar el menú:", error);
        const menuContainer = document.getElementById("menu-section");
        if (menuContainer) {
            menuContainer.innerHTML = "<p>Error al cargar el menú. Por favor, inténtalo más tarde.</p>";
        }
    }
}

function renderMenu(items) {
    const menuContainer = document.getElementById("menu-section");
    menuContainer.innerHTML = ""; // Limpiar contenido previo

    const categories = {};

    // Organizar los elementos del menú por categoría
    items.forEach((item) => {
        if (!categories[item.category]) {
            categories[item.category] = [];
        }
        categories[item.category].push(item);
    });

    // Crear secciones para cada categoría
    for (const categoryName in categories) {
        const categorySection = document.createElement("div");
        categorySection.classList.add("menu-category");

        const categoryHeading = document.createElement("h2");
        categoryHeading.textContent = categoryName;
        categorySection.appendChild(categoryHeading);

        const categoryItems = document.createElement("div");
        categoryItems.classList.add("menu-items");

        categories[categoryName].forEach((item) => {
            const itemCard = document.createElement("div");
            itemCard.classList.add("menu-item-container");

            itemCard.innerHTML = `
                <img src="${item.image}" alt="${item.name}" />
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <p>Precio: $${item.price.toFixed(2)}</p>
                <button onclick="addToCart(${JSON.stringify(item)})">Agregar al carrito</button>
            `;

            categoryItems.appendChild(itemCard);
        });

        categorySection.appendChild(categoryItems);
        menuContainer.appendChild(categorySection);
    }
}


// Funciones del carrito de compras
function addToCart(item) {
    cart.push({ id: item.id, name: item.name, price: parseFloat(item.price) });
    updateCart();
}

function updateCart() {
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    cartItems.innerHTML = "";
    let total = 0;

    cart.forEach((item, index) => {
        const li = document.createElement("li");
        li.textContent = `${item.name} - $${item.price.toFixed(2)}`;
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "X";
        removeBtn.onclick = () => removeFromCart(index);
        li.appendChild(removeBtn);
        cartItems.appendChild(li);
        total += item.price;
    });

    cartTotal.textContent = `Total: $${total.toFixed(2)}`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

function clearCart() {
    cart = [];
    updateCart();
}

// Función para realizar la compra
function purchaseCart() {
    if (cart.length === 0) {
        document.getElementById("purchase-summary").innerHTML = "<p>El carrito está vacío. No hay nada para comprar.</p>";
        return;
    }

    let summaryHTML = "<h2>Resumen de tu compra</h2><ul>";
    let total = 0;

    cart.forEach((item) => {
        summaryHTML += `<li>${item.name} - $${item.price.toFixed(2)}</li>`;
        total += item.price;
    });

    summaryHTML += `</ul><p><strong>Total: $${total.toFixed(2)}</strong></p>`;
    summaryHTML += `<button onclick="closeSummary()">Cerrar</button>`;

    document.getElementById("purchase-summary").innerHTML = summaryHTML;
    document.getElementById("purchase-summary").style.display = "block";
    document.getElementById("delivery-form-section").style.display = "block"; // Corrected ID
}

// Enviar pedido a la hoja "Pedidos" con POST
async function submitOrder(event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const address = document.getElementById("address").value;
    const phone = document.getElementById("phone").value;

    if (!name || !address || !phone) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    const orderProducts = cart.map(item => ({
        id: item.id, // Django OrderProduct expects product ID
        quantity: 1 // Default quantity
    }));
    
    const calculatedTotal = cart.reduce((acc, item) => acc + item.price, 0);

    const orderData = {
        name: name,
        phone: phone,
        address: address,
        total: calculatedTotal.toFixed(2),
        state: "Pendiente", // Default state for new orders
        products: orderProducts 
    };

    try {
        const response = await fetch(`${API_BASE_URL}/ordenes/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log("Pedido enviado:", result);
            showConfirmation(name, address, phone); 
            clearCart(); 
            document.getElementById("purchase-summary").style.display = "none"; // Hide summary
        } else {
            const errorData = await response.json(); // Assuming error response is JSON
            console.error("Error enviando pedido:", response.status, errorData);
            let errorMessage = "Hubo un error al enviar tu pedido.";
            if (errorData && typeof errorData === 'object') {
                const messages = Object.values(errorData).flat().join("\n");
                if (messages) errorMessage += `\nDetalles: ${messages}`;
            }
            alert(errorMessage);
        }

    } catch (error) {
        console.error("Error enviando pedido (catch):", error);
        alert("Hubo un error al enviar tu pedido. Por favor, inténtalo de nuevo más tarde.");
    }
}

// Mostrar confirmación de pedido
function showConfirmation(name, address, phone) {
    let confirmationHTML = `
        <h2>Pedido Confirmado</h2>
        <p>Gracias, <strong>${name}</strong>.</p>
        <p>Tu pedido será enviado a: <strong>${address}</strong></p>
        <p>Nos pondremos en contacto al <strong>${phone}</strong>.</p>
        <p>Tu pedido ha sido procesado por nuestro sistema.</p>
        <button onclick="closeConfirmation()">Cerrar</button>
    `;

    document.getElementById("order-confirmation").innerHTML = confirmationHTML;
    document.getElementById("order-confirmation").style.display = "flex";
    document.getElementById("delivery-form-section").style.display = "none"; // Corrected ID
    document.getElementById("order-form").reset();
}

// Funciones de cierre de resumen y confirmación
function closeConfirmation() {
    document.getElementById("order-confirmation").style.display = "none";
}

function closeSummary() {
    document.getElementById("purchase-summary").style.display = "none";
}

function scrollToSection(sectionId) {
    if (sectionId === 'all') {
        document.querySelectorAll('.menu-section').forEach(section => {
            section.style.display = 'block';
        });
        // Optionally scroll to the top of the menu container or a general menu heading
        const menuContainer = document.getElementById('menu-section');
        if (menuContainer) {
            menuContainer.scrollIntoView({ behavior: 'smooth' });
        }
    } else {
        // Hide all sections first
        document.querySelectorAll('.menu-section').forEach(section => {
            section.style.display = 'none';
        });
        // Show the target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            // If a specific category section doesn't exist (e.g. 'platos', 'bebidas'),
            // it might be because categories are dynamically generated.
            // This part assumes IDs like 'entradas', 'platos-principales' etc. are set on .menu-section divs
            // If sectionId corresponds to a category name like "Entradas", "Platos Principales"
            // we need to find the section with that ID (e.g. id="entradas", id="platos-principales")
            const dynamicSectionId = sectionId.toLowerCase().replace(/\s+/g, '-');
            const dynamicTargetSection = document.getElementById(dynamicSectionId);
            if (dynamicTargetSection) {
                dynamicTargetSection.style.display = 'block';
                dynamicTargetSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                console.warn(`Section with ID '${sectionId}' or '${dynamicSectionId}' not found.`);
                // Fallback: show all if specific section not found
                 document.querySelectorAll('.menu-section').forEach(section => {
                    section.style.display = 'block';
                });
            }
        }
    }
}

// Función para autenticar al usuario
async function authenticateUser() {
    try {
        const response = await fetch(`${API_BASE_URL}/verify-token`, {
            method: 'GET',
            credentials: 'include', // Para enviar cookies
        });

        if (!response.ok) {
            throw new Error('No autenticado');
        }

        console.log('Usuario autenticado');
    } catch (error) {
        console.error('Error de autenticación:', error);
        alert('Por favor, inicia sesión para acceder a esta funcionalidad.');
        window.location.href = 'Login.html';
    }
}

// Llamar a la autenticación al cargar la página de administración
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('Admin.html')) {
        authenticateUser();
    }
});

// Función para cargar pedidos en la interfaz administrativa
async function fetchOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/ordenes/`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Error al obtener los pedidos');
        }

        const orders = await response.json();
        renderOrders(orders);
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        alert('No se pudieron cargar los pedidos. Inténtalo más tarde.');
    }
}

// Función para renderizar pedidos en la tabla
function renderOrders(orders) {
    const ordersTbody = document.getElementById('orders-tbody');
    ordersTbody.innerHTML = '';

    orders.forEach(order => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${order.name}</td>
            <td>${order.phone}</td>
            <td>${order.address}</td>
            <td>${order.products.map(p => p.name).join(', ')}</td>
            <td>$${order.total}</td>
            <td>${order.state}</td>
            <td>
                <button onclick="updateOrderState(${order.id}, 'Atendido')">Marcar como Atendido</button>
            </td>
        `;

        ordersTbody.appendChild(row);
    });
}

// Función para actualizar el estado de un pedido
async function updateOrderState(orderId, newState) {
    try {
        const response = await fetch(`${API_BASE_URL}/ordenes/${orderId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ state: newState }),
        });

        if (!response.ok) {
            throw new Error('Error al actualizar el estado del pedido');
        }

        alert('Estado del pedido actualizado');
        fetchOrders(); // Recargar pedidos
    } catch (error) {
        console.error('Error al actualizar el pedido:', error);
        alert('No se pudo actualizar el estado del pedido.');
    }
}
