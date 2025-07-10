// API Configuration
const apiKey = "9b2018691ef0b90976f2da57a51417ec";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?q=";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?q=";

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const currentLocationEl = document.getElementById('current-location');
const currentLocationInnerEl = document.getElementById('current-location-inner');
const currentConditionEl = document.getElementById('current-condition');
const currentTempEl = document.getElementById('current-temp');
const mainWeatherIconEl = document.getElementById('main-weather-icon');

// City elements - would need to be created dynamically in a real app
const cityCards = document.querySelectorAll('.city-card');

// Load default location when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Default to Dehradun if no recent searches
    const lastSearch = localStorage.getItem('lastSearch') || 'Dehradun,IN';
    searchInput.value = lastSearch;
    checkWeather(lastSearch);
    
    // Also fetch other cities for the "Other Cities" section
    const otherCities = ['Manchester', 'Edinburgh', 'Bristol', 'York'];
    otherCities.forEach((city, index) => {
        fetchOtherCityWeather(city, index);
    });
});

// Add event listener for search button
searchBtn.addEventListener('click', () => {
    if (searchInput.value.trim() !== '') {
        checkWeather(searchInput.value);
    }
});

// Add event listener for Enter key
searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && searchInput.value.trim() !== '') {
        checkWeather(searchInput.value);
    }
});

// Fetch weather data for main location
async function checkWeather(city) {
    try {
        const response = await fetch(`${apiUrl}${encodeURIComponent(city)}&appid=${apiKey}&units=metric`);
        
        if (!response.ok) {
            if (response.status === 404) {
                alert("City not found. Please check the spelling.");
            } else {
                alert(`Error: ${response.statusText}`);
            }
            return;
        }
        
        const data = await response.json();
        updateMainWeather(data);
        
        // Save to localStorage
        localStorage.setItem('lastSearch', city);
        
        // Also fetch forecast data
        fetchForecast(city);
        
    } catch (error) {
        console.error("Failed to fetch weather data:", error);
        alert("Failed to fetch weather data. Please try again.");
    }
}

// Fetch weather for other cities
async function fetchOtherCityWeather(city, index) {
    try {
        const response = await fetch(`${apiUrl}${encodeURIComponent(city)}&appid=${apiKey}&units=metric`);
        
        if (!response.ok) return;
        
        const data = await response.json();
        if (cityCards[index]) {
            updateCityCard(cityCards[index], data);
        }
        
    } catch (error) {
        console.error(`Failed to fetch weather for ${city}:`, error);
    }
}

// Fetch forecast data
async function fetchForecast(city) {
    try {
        const response = await fetch(`${forecastUrl}${encodeURIComponent(city)}&appid=${apiKey}&units=metric`);
        
        if (!response.ok) return;
        
        const data = await response.json();
        updateForecast(data);
        
    } catch (error) {
        console.error("Failed to fetch forecast data:", error);
    }
}

// Update main weather display
function updateMainWeather(data) {
    currentLocationEl.textContent = `${data.name}, ${data.sys.country}`;
    currentLocationInnerEl.textContent = `${data.name}, ${data.sys.country}`;
    currentTempEl.textContent = `${Math.round(data.main.temp)}°`;
    currentConditionEl.textContent = getWeatherCondition(data.weather[0].main);
    
    // Update weather icon
    mainWeatherIconEl.src = getWeatherIcon(data.weather[0].main, isNightTime(data.dt, data.sys.sunrise, data.sys.sunset));
    
    // Update highlights
    updateHighlights(data);
}

// Update city card
function updateCityCard(cardElement, data) {
    const tempEl = cardElement.querySelector('.city-temp h2');
    const conditionEl = cardElement.querySelector('.city-info p');
    const iconEl = cardElement.querySelector('.city-icon img');
    
    if (tempEl) tempEl.textContent = `${Math.round(data.main.temp)}°`;
    
    if (conditionEl) {
        const condition = getWeatherCondition(data.weather[0].main);
        const feelsLike = Math.round(data.main.feels_like);
        const temp = Math.round(data.main.temp);
        conditionEl.textContent = `${condition}, High: ${temp + 3}° Low: ${temp - 3}°`;
    }
    
    if (iconEl) {
        iconEl.src = getWeatherIcon(data.weather[0].main, isNightTime(data.dt, data.sys.sunrise, data.sys.sunset));
    }
}

// Update forecast cards
function updateForecast(data) {
    const forecasts = data.list.filter((item, index) => index % 8 === 0); // Get one forecast per day
    const forecastCards = document.querySelectorAll('.forecast-card');
    
    forecasts.slice(0, forecastCards.length).forEach((forecast, index) => {
        if (forecastCards[index]) {
            const dayName = new Date(forecast.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' });
            const icon = getWeatherIcon(forecast.weather[0].main, false);
            const temp = Math.round(forecast.main.temp);
            
            forecastCards[index].querySelector('h3').textContent = dayName;
            forecastCards[index].querySelector('img').src = icon;
            forecastCards[index].querySelector('h2').textContent = `${temp}°`;
        }
    });
}

// Update today's highlights section
function updateHighlights(data) {
    // These would need to be properly referenced from your HTML
    const highlightCards = document.querySelectorAll('.highlight-card');
    
    if (highlightCards.length >= 6) {
        // Feels Like
        highlightCards[0].querySelector('.highlight-value h2').textContent = `${Math.round(data.main.feels_like)}°`;
        
        // Cloud
        const cloudValue = data.clouds ? data.clouds.all : 0;
        highlightCards[1].querySelector('.highlight-value h2').innerHTML = `${cloudValue}<span>%</span>`;
        
        // Rain
        const rainValue = data.rain ? Math.round(data.rain['1h'] || 0) : 0;
        highlightCards[2].querySelector('.highlight-value h2').innerHTML = `${rainValue}<span>mm</span>`;
        
        // Humidity
        highlightCards[3].querySelector('.highlight-value h2').innerHTML = `${data.main.humidity}<span>%</span>`;
        
        // UV (not available in this API, using placeholder)
        highlightCards[4].querySelector('.highlight-value h2').textContent = `7`;
        
        // Wind
        highlightCards[5].querySelector('.highlight-value h2').innerHTML = `${Math.round(data.wind.speed)}<span>km/h</span>`;
    }
}

// Helper function to determine weather condition text
function getWeatherCondition(weatherMain) {
    switch (weatherMain) {
        case 'Clouds': return 'Cloudy';
        case 'Rain': return 'Rain';
        case 'Clear': return 'Clear Sky';
        case 'Drizzle': return 'Drizzle';
        case 'Mist': case 'Fog': case 'Haze': return 'Mist';
        case 'Snow': return 'Snow';
        default: return weatherMain;
    }
}

// Helper function to get weather icon based on condition and time of day
function getWeatherIcon(weatherMain, isNight) {
    // This function would need to map to your available icons
    if (isNight) {
        if (weatherMain === 'Clear') return 'images/clear.png';
        if (weatherMain === 'Clouds') return 'images/night-cloud.png';
        if (weatherMain === 'Rain') return 'images/rain.png';
        if (weatherMain === 'Snow') return 'images/snow.png';
        if (weatherMain === 'Drizzle') return 'images/drizzle.png';
        if (['Mist', 'Fog', 'Haze'].includes(weatherMain)) return 'images/mist.png';
        return 'images/night-cloud.png';
    } else {
        if (weatherMain === 'Clear') return 'images/clear.png';
        if (weatherMain === 'Clouds') return 'images/sun-cloud.png';
        if (weatherMain === 'Rain') return 'images/rain.png';
        if (weatherMain === 'Snow') return 'images/snow.png';
        if (weatherMain === 'Drizzle') return 'images/drizzle.png';
        if (['Mist', 'Fog', 'Haze'].includes(weatherMain)) return 'images/mist.png';
        return 'images/sun-cloud.png';
    }
}

// Helper function to determine if it's night time
function isNightTime(currentTime, sunrise, sunset) {
    return currentTime < sunrise || currentTime > sunset;
}



// Add this JavaScript to your app.js file

// Calendar functionality
const calendarBtn = document.querySelector('.top-nav-icons .icon-btn:first-child');
const calendarPopup = document.getElementById('calendar-popup');
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// Calendar toggle functionality
calendarBtn.addEventListener('click', () => {
    calendarPopup.classList.toggle('active');
    if (calendarPopup.classList.contains('active')) {
        generateCalendar(currentMonth, currentYear);
    }
});

// Close calendar when clicking outside
document.addEventListener('click', (e) => {
    if (!calendarPopup.contains(e.target) && !calendarBtn.contains(e.target)) {
        calendarPopup.classList.remove('active');
    }
});

// Previous month button
document.getElementById('prev-month').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    generateCalendar(currentMonth, currentYear);
});

// Next month button
document.getElementById('next-month').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    generateCalendar(currentMonth, currentYear);
});

// Generate calendar days
function generateCalendar(month, year) {
    const calendarDays = document.getElementById('calendar-days');
    const calendarMonth = document.getElementById('calendar-month');
    const today = new Date();
    
    // Clear previous days
    calendarDays.innerHTML = '';
    
    // Set month and year in header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    calendarMonth.textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get days from previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // Add days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day', 'other-month');
        dayElement.textContent = daysInPrevMonth - i;
        calendarDays.appendChild(dayElement);
    }
    
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        dayElement.textContent = i;
        
        // Highlight current day
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayElement.classList.add('current');
        }
        
        // Add click event to select a date
        dayElement.addEventListener('click', () => {
            // You can do something with the selected date
            const selectedDate = new Date(year, month, i);
            console.log('Selected date:', selectedDate.toDateString());
            
            // Example: Update search input to search for weather on this date (if API supports it)
            // searchInput.value = `${searchInput.value.split(' ')[0]} ${selectedDate.toDateString()}`;
            
            // Close calendar after selection
            calendarPopup.classList.remove('active');
        });
        
        calendarDays.appendChild(dayElement);
    }
    
    // Calculate how many days to show from next month
    const totalDaysShown = firstDay + daysInMonth;
    const remainingCells = 7 - (totalDaysShown % 7);
    
    // Add days from next month if needed
    if (remainingCells < 7) {
        for (let i = 1; i <= remainingCells; i++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day', 'other-month');
            dayElement.textContent = i;
            calendarDays.appendChild(dayElement);
        }
    }
}