const apiToken = '9951249b-1e91-4e29-b122-b48768f2010e';
let cards = [];
let cart = [];

// Load cart from localStorage on page load
function loadCart() {
    const savedCart = localStorage.getItem('pokeCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('pokeCart', JSON.stringify(cart));
}

// Initialize page-specific functionality
function initPage() {
    loadCart(); // Load cart on page initialization
    const page = window.location.pathname.split('/').pop();
    if (page === 'index.html' || page === '') {
        initCarousel();
    } else if (page === 'catalog.html') {
        initCatalog();
    } else if (page === 'cart.html') {
        initCart();
    } else if (page === 'sell.html') {
        initSell();
    }
}

// Carousel functionality
function initCarousel() {
    const carouselItems = document.getElementById('carouselItems');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const items = document.querySelectorAll('.carousel-item');
    let currentIndex = 0;

    if (!carouselItems || !prevBtn || !nextBtn || items.length === 0) {
        console.error('Carousel elements not found');
        return;
    }

    function showSlide(index) {
        if (index >= items.length) currentIndex = 0;
        else if (index < 0) currentIndex = items.length - 1;
        else currentIndex = index;
        carouselItems.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    prevBtn.addEventListener('click', () => showSlide(currentIndex - 1));
    nextBtn.addEventListener('click', () => showSlide(currentIndex + 1));

    let autoSlide = setInterval(() => showSlide(currentIndex + 1), 5000);
    carouselItems.addEventListener('mouseenter', () => clearInterval(autoSlide));
    carouselItems.addEventListener('mouseleave', () => {
        autoSlide = setInterval(() => showSlide(currentIndex + 1), 5000);
    });
}

// Catalog page: Fetch and display cards
function initCatalog() {
    const cardGrid = document.getElementById('cardGrid');
    const rarityFilter = document.getElementById('rarityFilter');
    const setFilter = document.getElementById('setFilter');
    const searchInput = document.getElementById('searchInput');

    async function fetchCards(page = 1) {
        try {
            const response = await fetch(`https://api.pokemontcg.io/v2/cards?pageSize=100&page=${page}`, {
                headers: { 'X-Api-Key': apiToken }
            });
            const data = await response.json();
            if (data.data && Array.isArray(data.data)) {
                cards = data.data;
                populateFilters();
                renderCards(cards);
            } else {
                cardGrid.innerHTML = '<p>No s\'han trobat cartes. Torna a provar més tard.</p>';
            }
        } catch (error) {
            console.error('Error fetching cards:', error);
            cardGrid.innerHTML = '<p>Error carregant les cartes. Torna a provar més tard.</p>';
        }
    }

    function populateFilters() {
        const rarities = [...new Set(cards.map(card => card.rarity).filter(Boolean))];
        const sets = [...new Set(cards.map(card => card.set.name))];
        
        rarityFilter.innerHTML = '<option value="">Totes les rareses</option>';
        setFilter.innerHTML = '<option value="">Totes les edicions</option>';
        
        rarities.forEach(rarity => {
            const option = document.createElement('option');
            option.value = rarity;
            option.textContent = rarity;
            rarityFilter.appendChild(option);
        });

        sets.forEach(set => {
            const option = document.createElement('option');
            option.value = set;
            option.textContent = set;
            setFilter.appendChild(option);
        });
    }

    function renderCards(cardsToRender) {
        cardGrid.innerHTML = '';
        cardsToRender.forEach(card => {
            const price = card.cardmarket?.prices?.averageSellPrice || 0;
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card bg-white p-4 rounded-lg';
            cardDiv.innerHTML = `
                <img src="${card.images.small}" alt="${card.name}" class="w-full h-48 object-contain mb-2" loading="lazy">
                <h3 class="text-lg font-semibold">${card.name}</h3>
                <p>Raresa: ${card.rarity || 'N/A'}</p>
                <p>Edició: ${card.set.name}</p>
                <p>Preu: ${price.toFixed(2)}€</p>
                <button class="bg-poke-red text-white px-2 py-1 rounded-lg hover:bg-opacity-80 transition-colors" onclick="addToCart('${card.id}', '${card.name}', ${price})">Afegir al Carret</button>
            `;
            cardGrid.appendChild(cardDiv);
        });
    }

    function filterCards() {
        const selectedRarity = rarityFilter.value;
        const selectedSet = setFilter.value;
        const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
        let filteredCards = cards;

        if (selectedRarity) {
            filteredCards = filteredCards.filter(card => card.rarity === selectedRarity);
        }
        if (selectedSet) {
            filteredCards = filteredCards.filter(card => card.set.name === selectedSet);
        }
        if (searchQuery) {
            filteredCards = filteredCards.filter(card => card.name.toLowerCase().includes(searchQuery));
        }

        renderCards(filteredCards);
    }

    rarityFilter.addEventListener('change', filterCards);
    setFilter.addEventListener('change', filterCards);
    if (searchInput) searchInput.addEventListener('input', filterCards);

    fetchCards();
}

// Cart page: Display and manage cart
function initCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    function renderCart() {
        if (!cartItems || !cartTotal) return;
        cartItems.innerHTML = '';
        let total = 0;
        cart.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'flex justify-between items-center border-b border-poke-blue py-2';
            itemDiv.innerHTML = `
                <p>${item.name} (x${item.quantity})</p>
                <p>${(item.price * item.quantity).toFixed(2)}€</p>
            `;
            cartItems.appendChild(itemDiv);
            total += item.price * item.quantity;
        });
        cartTotal.textContent = `Total: ${total.toFixed(2)}€`;
    }

    checkoutBtn.addEventListener('click', () => {
        alert('Compra finalitzada! Gràcies per la teva comanda.');
        cart = [];
        saveCart();
        renderCart();
    });

    renderCart();
}

// Sell page: Handle form submission with improved validation
function initSell() {
    const sellSubmitBtn = document.getElementById('sellSubmitBtn');
    const errorDiv = document.getElementById('formErrors');

    sellSubmitBtn.addEventListener('click', () => {
        const cardName = document.getElementById('cardName').value.trim();
        const cardSet = document.getElementById('cardSet').value.trim();
        const cardRarity = document.getElementById('cardRarity').value.trim();
        const cardCondition = document.getElementById('cardCondition').value;
        const sellerEmail = document.getElementById('sellerEmail').value.trim();

        const errors = [];

        if (cardName.length < 3) {
            errors.push('El nom de la carta ha de tenir almenys 3 caràcters.');
        }
        if (cardSet.length < 3) {
            errors.push('L\'edició ha de tenir almenys 3 caràcters.');
        }
        if (cardRarity.length < 2) {
            errors.push('La raresa ha de tenir almenys 2 caràcters.');
        }
        if (!cardCondition) {
            errors.push('Selecciona un estat per a la carta.');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sellerEmail)) {
            errors.push('Introdueix un correu electrònic vàlid.');
        }

        if (errors.length > 0) {
            errorDiv.innerHTML = errors.map(error => `<p class="text-red-500">${error}</p>`).join('');
            return;
        }

        alert(`Oferta rebuda!\nCarta: ${cardName}\nEdició: ${cardSet}\nRaresa: ${cardRarity}\nEstat: ${cardCondition}\nCorreu: ${sellerEmail}\nEns posarem en contacte aviat!`);
        document.getElementById('cardName').value = '';
        document.getElementById('cardSet').value = '';
        document.getElementById('cardRarity').value = '';
        document.getElementById('cardCondition').value = 'Mint';
        document.getElementById('sellerEmail').value = '';
        errorDiv.innerHTML = '';
    });
}

// Global cart management
function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    saveCart(); // Save to localStorage immediately

    // Show a notification to confirm the item was added
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-2 rounded-lg shadow-lg';
    notification.textContent = `${name} afegit al carret!`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);

    // If on cart.html, refresh the cart display
    if (window.location.pathname.split('/').pop() === 'cart.html') {
        initCart();
    }
}

// Initialize page on load
document.addEventListener('DOMContentLoaded', initPage);