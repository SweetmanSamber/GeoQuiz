// Global Variables
let timer = 900; // 15 minutes in seconds
const timerElement = document.getElementById('timer');
const playButton = document.getElementById('play-button');
const giveUpButton = document.getElementById('give-up-button');
const playAgainButton = document.getElementById('play-again-button');
const countryInput = document.getElementById('country-input');
let countdown; // Declare countdown globally

let geojsonLayer; // Variable for GeoJSON layer
let correctAnswers = new Set(); // Track correct answers
let missedCountries = new Set(); // Track missed countries
let totalCountries = 0; // Global variable for total countries

// Map Initialization
const map = L.map('map').setView([20, 0], 2); // Centered on the world

// Carto Light Basemap
L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
}).addTo(map);

// Elements for counters and progress
const totalCountElement = document.getElementById('total-count');
let correctCountElement = document.getElementById('correct-count');
//const progressBar = document.getElementById('progress-bar');

// Country Alias List
const countryAliases = {
    "usa": "United States of America",
    "uk": "United Kingdom",
    "uae": "United Arab Emirates",
    "car": "Central African Republic",
    "drc": "Democratic Republic of the Congo",
    "democratic republic of congo": "Democratic Republic of the Congo",
    "eswatini": "Swaziland",
    "cote divoire": "Ivory Coast",
    "czechia": "Czech Republic",
    "north macedonia": "Macedonia",
    "timor-leste": "East Timor",
    "timor leste": "East Timor",
    "cabo verde": "Cape Verde",
    "cabo-verde": "Cape Verde",
    "st kitts and nevis": "Saint Kitts and Nevis",
    "st lucia": "Saint Lucia",
    "st vincent and the grenadines": "Saint Vincent and the Grenadines"
};

// Functions
// Format time as MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// Start Timer
function startTimer() {
    timerElement.textContent = `${formatTime(timer)}`;
    countdown = setInterval(() => {
        timer--;
        timerElement.textContent = `${formatTime(timer)}`;

        if (timer <= 60) {
            timerElement.classList.add('low-time');
        } else {
            timerElement.classList.remove('low-time');
        }

        if (timer <= 0) {
            clearInterval(countdown); // Stop the timer
            endGame(); // End the game when time runs out
        }
    }, 1000);
}

// Start Game
function startGame() {
    startTimer();

    playButton.style.display = 'none';
    countryInput.disabled = false;
    countryInput.focus();
    giveUpButton.style.display = 'inline-block';
}

// Update Progress Bar
// function updateProgress() {
//     const percentage = (correctAnswers.size / totalCountries) * 100;
//     progressBar.style.width = `${percentage}%`;
//     progressBar.setAttribute("aria-valuenow", percentage);
// }

// Highlight Country and Track Correct Answers
function highlightCountry(countryName) {
    countryName = countryName.toLowerCase().trim();
    const canonicalName = countryAliases[countryName] || countryName;

    geojsonLayer.eachLayer(function (layer) {
        if (layer.feature.properties.ADMIN.toLowerCase() === canonicalName.toLowerCase()) {
            if (!correctAnswers.has(canonicalName.toLowerCase())) {
                correctAnswers.add(canonicalName.toLowerCase());
                missedCountries.delete(canonicalName.toLowerCase());

                layer.setStyle({
                    color: '#000',
                    weight: 0.3,
                    opacity: 1,
                    fillColor: 'green',
                    fillOpacity: 0.7
                });

                correctCountElement.textContent = correctAnswers.size;
                //updateProgress();
                document.getElementById('country-input').value = '';
            }
        }
    });
}

// Show Modal (Game Over)
function showModal() {
    const modal = document.getElementById('game-over-modal');
    const overlay = document.querySelector('.modal-overlay');

    // Show modal and overlay with blur effect
    overlay.style.display = 'block';
    modal.style.display = 'flex'; // Flex to ensure proper content alignment
}

// End Game and Display Results
function endGame() {
    clearInterval(countdown); // Stop the timer
    
    // Update the modal with correct and total countries
    document.getElementById('correct-count-final').textContent = correctAnswers.size;
    document.getElementById('total-count-final').textContent = totalCountries;

    const missedList = document.getElementById('missed-countries-list');
    missedList.innerHTML = ''; // Clear the list before adding new items

    // Loop through the missed countries and add them to the list
    missedCountries.forEach(country => {
        const listItem = document.createElement('li');
        listItem.textContent = country.charAt(0).toUpperCase() + country.slice(1); // Capitalize first letter
        missedList.appendChild(listItem);
    });

    giveUpButton.style.display = 'none';
    playAgainButton.style.display = 'inline-block';

    // Show the modal with the game results
    showModal();
}

// Real-time input listener for country input
document.getElementById('country-input').addEventListener('input', function (event) {
    const countryName = event.target.value.trim();
    if (countryName) {
        highlightCountry(countryName);
    }
});

// Close Modal
function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    overlay.style.display = 'none';
    document.getElementById('game-over-modal').style.display = 'none';
}

// Event listener for closing the modal
document.getElementById('close-modal-button').addEventListener('click', closeModal);

// Fetch GeoJSON data and initialize missed countries set
fetch('./spatial-data/countries.geojson')
    .then(response => response.json())
    .then(data => {
        totalCountries = data.features.length;
        totalCountElement.textContent = totalCountries;
        data.features.forEach(feature => missedCountries.add(feature.properties.ADMIN.toLowerCase()));

        geojsonLayer = L.geoJSON(data, {
            style: () => ({ color: 'transparent', weight: 1, opacity: 0, fillColor: 'transparent', fillOpacity: 0 })
        }).addTo(map);
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

// Event listener for "Play" button to start the game
playButton.addEventListener('click', startGame);

// Event listener for "Give Up" button to end the game
giveUpButton.addEventListener('click', () => {
    endGame();
});

playAgainButton.addEventListener('click', () =>{
    location.reload();
});

// Restart the game when the user clicks "Play Again"
document.getElementById('restart-button').addEventListener('click', () => {
    location.reload();
});

// Function to set map view to different regions with adjusted zoom levels
function setView(region) {
    switch (region) {
        case 'Europe':
            map.setView([54.5260, 15.2551], 3); 
            break;
        case 'Asia':
            map.setView([34.0479, 100.6197], 3); 
            break;
        case 'Oceania':
            map.setView([-25.2744, 170.7751], 3); 
            break;
        case 'America':
            map.setView([8.7832, -55.4915], 3); 
            break;
        case 'Africa':
            map.setView([1.6508, 20.9374], 3); 
            break;
        case 'World':
            map.setView([20, 0], 2);
            break;
        default:
            map.setView([20, 0], 2); // Default to world view
    }
}