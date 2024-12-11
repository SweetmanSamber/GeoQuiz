let timer = 900; // 15 minutes in seconds
const timerElement = document.getElementById('timer');
const playButton = document.getElementById('play-button');
const giveUpButton = document.getElementById('give-up-button');
const playAgainButton = document.getElementById('play-again-button');
const capitalInput = document.getElementById('capital-input');
let countdown;

let geojsonLayer;
let correctAnswers = new Set();
let missedAnswers = new Set();
let totalCount = 0; 

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

const capitalAliases = {
    "washington": "Washington D.C.",
    "st johns": "Saint Johns",
    "nuku alofa": "Nuku'alofa",
    "ndjamena": "N'Djamena",
    "ulan bator": "Ulaanbaatar",
    "st georges": "Saint Georges",
    "san jose": "San José",
    "yaounde": "Yaoundé"
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
    capitalInput.disabled = false;
    capitalInput.focus();
    giveUpButton.style.display = 'inline-block';
}

function highlightMap(capitalName) {
    capitalName = capitalName.toLowerCase().trim();
    const canonicalName = capitalAliases[capitalName] || capitalName;

    geojsonLayer.eachLayer(function (layer) {
        if (layer.feature.properties.ADMIN.toLowerCase() === canonicalName.toLowerCase()) {
            if (!correctAnswers.has(canonicalName.toLowerCase())) {
                correctAnswers.add(canonicalName.toLowerCase());
                missedAnswers.delete(canonicalName.toLowerCase());

                layer.setStyle({
                    color: '#000',
                    weight: 0.3,
                    opacity: 1,
                    fillColor: 'green',
                    fillOpacity: 0.7
                });

                correctCountElement.textContent = correctAnswers.size;
                //updateProgress();
                document.getElementById('capital-input').value = '';
            }
        }
    });
}

function showModal() {
    const modal = document.getElementById('game-over-modal');
    const overlay = document.querySelector('.modal-overlay');

    overlay.style.display = 'block';
    modal.style.display = 'flex'; 
}

function endGame() {
    clearInterval(countdown); 
    
    document.getElementById('correct-count-final').textContent = correctAnswers.size;
    document.getElementById('total-count-final').textContent = totalCount;

    const missedList = document.getElementById('missed-capitals-list');
    missedList.innerHTML = ''; 

    missedAnswers.forEach(answer => {
        const listItem = document.createElement('li');
        listItem.textContent = answer.charAt(0).toUpperCase() + answer.slice(1); 
        missedList.appendChild(listItem);
    });

    giveUpButton.style.display = 'none';
    playAgainButton.style.display = 'inline-block';

    showModal();
}

document.getElementById('capital-input').addEventListener('input', function (event) {
    const capitalName = event.target.value.trim();
    if (capitalName) {
        highlightMap(capitalName);
    }
});

function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    overlay.style.display = 'none';
    document.getElementById('game-over-modal').style.display = 'none';
}

document.getElementById('close-modal-button').addEventListener('click', closeModal);

fetch('./spatial-data/capitals.geojson')
    .then(response => response.json())
    .then(data => {
        totalCount = data.features.length;
        totalCountElement.textContent = totalCount;
        data.features.forEach(feature => missedAnswers.add(feature.properties.ADMIN.toLowerCase()));

        geojsonLayer = L.geoJSON(data, {
            style: () => ({ color: 'transparent', weight: 1, opacity: 0, fillColor: 'transparent', fillOpacity: 0 })
        }).addTo(map);
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

playButton.addEventListener('click', startGame);

giveUpButton.addEventListener('click', () => {
    endGame();
});

playAgainButton.addEventListener('click', () =>{
    location.reload();
});

document.getElementById('restart-button').addEventListener('click', () => {
    location.reload();
});

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
            map.setView([20, 0], 2);
    }
}