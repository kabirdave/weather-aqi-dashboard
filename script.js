// =======================
//  API KEY (YOUR KEY)
// =======================
const API_KEY = "00fab42f9776bb3d157ceca53d0ab215";


// =======================
//  ELEMENT REFERENCES
// =======================
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");

const weatherCard = document.getElementById("weatherCard");
const aqiCard = document.getElementById("aqiCard");

const cityNameEl = document.getElementById("cityName");
const dateTextEl = document.getElementById("dateText");
const weatherIconEl = document.getElementById("weatherIcon");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("desc");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");

const aqiValueEl = document.getElementById("aqiValue");
const aqiDescEl = document.getElementById("aqiDesc");
const aqiDetailEl = document.getElementById("aqiDetail");

const historyList = document.getElementById("historyList");


// =======================
//  HISTORY CONFIG
// =======================
const STORAGE_KEY = "weather_app_history_v1";
const MAX_HISTORY = 6;


// =======================
//  EVENT LISTENERS
// =======================
searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) searchCity(city);
});

cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchBtn.click();
});


// Load search history on start
renderHistory();


// =======================
//  SEARCH CITY (MAIN)
// =======================
async function searchCity(city) {
    try {
        console.log("Searching city:", city);

        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
            city
        )}&appid=${API_KEY}&units=metric`;

        const wRes = await fetch(weatherUrl);
        console.log("Weather API status:", wRes.status);

        if (!wRes.ok) throw new Error("City not found");

        const wData = await wRes.json();

        const { coord, name, sys, main, weather, wind } = wData;

        showWeather({ coord, name, sys, main, weather, wind });

        // Save city to history
        saveToHistory(name);
        renderHistory();

        // Fetch AQI if coordinates exist
        if (coord?.lat != null && coord?.lon != null) {
            fetchAQI(coord.lat, coord.lon);
        } else {
            hideAQI();
        }

    } catch (err) {
        alert("City not found. Please try again.");
        console.error("Weather fetch error:", err);
    }
}


// =======================
//  SHOW WEATHER
// =======================
function showWeather({ name, sys, main, weather, wind }) {
    weatherCard.classList.remove("hidden");

    const now = new Date();
    cityNameEl.textContent = `${name}, ${sys.country}`;
    dateTextEl.textContent = now.toLocaleString();

    const iconCode = weather[0].icon;
    weatherIconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    tempEl.textContent = `${Math.round(main.temp)}°C`;
    descEl.textContent = weather[0].description;
    humidityEl.textContent = `${main.humidity}%`;
    windEl.textContent = `${wind.speed} m/s`;
}


// =======================
//  FETCH AQI
// =======================
async function fetchAQI(lat, lon) {
    try {
        const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        console.log("Fetching AQI:", aqiUrl);

        const aRes = await fetch(aqiUrl);
        console.log("AQI API status:", aRes.status);

        if (!aRes.ok) {
            console.error("AQI API error:", await aRes.text());
            hideAQI();
            return;
        }

        const aData = await aRes.json();
        console.log("AQI Data:", aData);

        if (aData?.list?.length > 0) {
            const entry = aData.list[0];

            const aqiIndex = entry.main.aqi;
            const components = entry.components;

            showAQI({ aqiIndex, components });
        } else {
            console.warn("AQI missing");
            hideAQI();
        }
    } catch (err) {
        console.error("AQI fetch error:", err);
        hideAQI();
    }
}


// =======================
//  DISPLAY AQI DATA
// =======================
function showAQI({ aqiIndex, components }) {
    if (!aqiIndex) {
        hideAQI();
        return;
    }

    aqiCard.classList.remove("hidden");

    const mapped = mapAQI(aqiIndex);

    aqiValueEl.textContent = `${aqiIndex} (${mapped.description})`;
    aqiDescEl.textContent = mapped.advice;

    // Show PM2.5, PM10, NO2, O3
    const pm25 = components.pm2_5 ?? "N/A";
    const pm10 = components.pm10 ?? "N/A";
    const no2  = components.no2 ?? "N/A";
    const o3   = components.o3 ?? "N/A";

    aqiDetailEl.textContent = `PM2.5: ${pm25} µg/m³ · PM10: ${pm10} µg/m³ · NO₂: ${no2} µg/m³ · O₃: ${o3} µg/m³`;
}


// =======================
//  HIDE AQI CARD
// =======================
function hideAQI() {
    aqiCard.classList.add("hidden");
}


// =======================
//  MAP AQI VALUES
// =======================
function mapAQI(aqi) {
    switch (aqi) {
        case 1:
            return { description: "Good", advice: "Air quality is clean and healthy." };
        case 2:
            return { description: "Fair", advice: "Acceptable air quality, minimal health risk." };
        case 3:
            return { description: "Moderate", advice: "Sensitive people may feel effects." };
        case 4:
            return { description: "Poor", advice: "Everyone may feel some adverse effects." };
        case 5:
            return { description: "Very Poor", advice: "Serious risk; limit outdoor activity." };
        default:
            return { description: "Unknown", advice: "AQI data unavailable." };
    }
}


// =======================
//  SEARCH HISTORY
// =======================
function saveToHistory(city) {
    let hist = getHistory();
    hist = hist.filter(c => c.toLowerCase() !== city.toLowerCase());
    hist.unshift(city);
    hist = hist.slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hist));
}

function getHistory() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function renderHistory() {
    const hist = getHistory();
    historyList.innerHTML = "";

    hist.forEach(city => {
        const li = document.createElement("li");
        li.textContent = city;
        li.onclick = () => {
            cityInput.value = city;
            searchCity(city);
        };
        historyList.appendChild(li);
    });
}
