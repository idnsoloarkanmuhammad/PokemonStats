const pokemonContainer = document.getElementById('pokemonContainer');
const favoritesContainer = document.getElementById('favoritesContainer');
const searchInput = document.getElementById('SearchBar');
const searchBtn = document.getElementById('searchBtn');
const resetBtn = document.getElementById('resetBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

const navDashboard = document.getElementById('navDashboard');
const navFavorites = document.getElementById('navFavorites');
const viewDashboard = document.getElementById('Dashboard');
const viewFavorites = document.getElementById('viewFavorites');
const favCount = document.getElementById('JumlahFavorit');

let currentUrl = 'https://pokeapi.co/api/v2/pokemon?limit=12&offset=0';
let favorites = JSON.parse(localStorage.getItem('poke_favorites_data')) || [];

let nextPageUrl = null;
let prevPageUrl = null;

function updateFavoritesCount() {  
    favCount.textContent = favorites.length;
}

async function fetchPokemonData(url) {
    try {
        pokemonContainer.innerHTML = '<div class="status-message">Memuat data Pokémon...</div>';
        const response = await fetch(url);

        if (!response.ok) throw new Error('Gagal terhubung ke API');
        const data = await response.json();

        prevBtn.disabled = !data.previous;
        nextBtn.disabled = !data.next;
        currentUrl = url;

        nextPageUrl = data.next;
        prevPageUrl = data.previous;

        const pokemonPromises = data.results.map(item => fetch(item.url).then(res => res.json()));
        const pokemonsData = await Promise.all(pokemonPromises);

        pokemonContainer.innerHTML = '';
        pokemonsData.forEach(pokeData => {
            createPokemonCard(pokeData, pokemonContainer);
        });
        
    } catch (error) {
        pokemonContainer.innerHTML = `<div class="status-message">Gagal memuat data. Pastikan koneksi internet aktif.</div>`;
    }
}

nextBtn.addEventListener('click', () => {
    if (nextPageUrl) fetchPokemonData(nextPageUrl); 
});

prevBtn.addEventListener('click', () => {
    if (prevPageUrl) fetchPokemonData(prevPageUrl); 
});

function createPokemonCard(pokeData, container) {
	const card = document.createElement('div');
	card.className = 'pokemon-card';

	const isFav = favorites.some(fav => fav.id === pokeData.id);
	const frontImg = pokeData.sprites.front_default || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
	const types = pokeData.types.map(t => t.type.name).join(', ');

	const statsHTML = pokeData.stats.map(s => `
		<div class="stat-row">
			<span class="stat-name">${s.stat.name.replace('-', ' ')}</span>
			<span class="stat-value">${s.base_stat}</span>
		</div>
	`).join('');

	card.innerHTML = `
		<img src="${frontImg}" alt="${pokeData.name}">
		<h3>${pokeData.name}</h3>
		<p class="pokemon-type">Tipe: ${types}</p>
		<div class="stats-container">
			${statsHTML}
		</div>
		<button class="btn-fav ${isFav ? 'favorited' : ''}" data-id="${pokeData.id}">
			${isFav ? '❤️ Disukai' : '⭐ Sukai'}
		</button>
	`;

    // Menggunakan addeventlistener modern agar tidak konflik konversi JSON string
    const favBtn = card.querySelector('.btn-fav');
    favBtn.addEventListener('click', () => toggleFavorite(pokeData));

	container.appendChild(card);
}

function toggleFavorite(pokemon) {
	const index = favorites.findIndex(fav => fav.id === pokemon.id);
	if (index > -1) {
		favorites.splice(index, 1);
	} else {
		favorites.push(pokemon);
	}
	
	localStorage.setItem('poke_favorites_data', JSON.stringify(favorites));
	updateFavoritesCount();
	
	if (viewDashboard.style.display !== 'none') {
		const cards = pokemonContainer.getElementsByClassName('pokemon-card');
		for (let card of cards) {
			const btn = card.querySelector('.btn-fav');
			if (btn && parseInt(btn.getAttribute('data-id')) === pokemon.id) {
				const isNowFav = favorites.some(fav => fav.id === pokemon.id);
				btn.className = `btn-fav ${isNowFav ? 'favorited' : ''}`;
				btn.innerHTML = isNowFav ? '❤️ Disukai' : '⭐ Sukai';
			}
		}
	} else {
		renderFavorites();
	}
}

function renderFavorites() {
	favoritesContainer.innerHTML = '';
	if (favorites.length === 0) {
		favoritesContainer.innerHTML = `<div class="status-message">Belum ada Pokémon yang disukai.</div>`;
		return;
	}

	favorites.forEach(pokeData => {
		createPokemonCard(pokeData, favoritesContainer);
	});
}

searchBtn.addEventListener('click', async () => {
	const query = searchInput.value.toLowerCase().trim();
	if (!query) return;

	try {
		pokemonContainer.innerHTML = '<div class="status-message">Mencari...</div>';

		const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
		if (!response.ok) throw new Error('Not found');
		
		const data = await response.json();
		pokemonContainer.innerHTML = '';
		createPokemonCard(data, pokemonContainer);

		resetBtn.style.display = 'inline-block';
		document.getElementById('NextBeforeContainer').style.display = 'none';
	} catch (error) {
		pokemonContainer.innerHTML = `<div class="status-message">Pokémon "${query}" tidak ditemukan!</div>`;
	}
});

resetBtn.addEventListener('click', () => {
	searchInput.value = '';
	resetBtn.style.display = 'none';
	document.getElementById('NextBeforeContainer').style.display = 'flex';
	fetchPokemonData(currentUrl);
});

navDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    viewDashboard.style.display = 'block';
    viewFavorites.style.display = 'none';
    navDashboard.classList.add('active');
    navFavorites.classList.remove('active');
});

navFavorites.addEventListener('click', (e) => {
    e.preventDefault();
    viewDashboard.style.display = 'none';
    viewFavorites.style.display = 'block';
    navDashboard.classList.remove('active');
    navFavorites.classList.add('active');
    renderFavorites();
});

// Jalankan sistem saat pertama kali dimuat
updateFavoritesCount();
fetchPokemonData(currentUrl);
