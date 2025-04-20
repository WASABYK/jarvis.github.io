// Элементы интерфейса
const elements = {
    time: document.getElementById('time'),
    date: document.getElementById('date'),
    temperature: document.getElementById('temperature'),
    weatherDesc: document.getElementById('weather-desc'),
    location: document.getElementById('location'),
    externalTemp: document.getElementById('external-temp'),
    humidity: document.getElementById('humidity'),
    pressure: document.getElementById('pressure'),
    weatherIcon: document.getElementById('weather-icon'),
    systemStatus: document.querySelector('.system-status'),
    securityStatus: document.querySelector('.security-status'),
    systemMessage: document.querySelector('.system-message p'),
    checkOverlay: document.getElementById('system-check-overlay'),
    checkLogs: document.getElementById('system-check-logs'),
    startupSound: document.getElementById('startup-sound'),
    jarvisSound: document.getElementById('jarvis-sound')
};

// Сообщения для проверки системы
const systemMessages = [
    "Инициализация ядра системы...",
    "Проверка модулей безопасности...",
    "Загрузка интерфейса пользователя...",
    "Подключение к сенсорной сети...",
    "Синхронизация временных серверов...",
    "Калибровка датчиков окружающей среды...",
    "Проверка соединения с Arc Reactor...",
    "Инициализация голосового интерфейса...",
    "Оптимизация работы процессоров...",
    "Финальная проверка системы..."
];

// Инициализация при загрузке
window.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 1000);

    // Пытаемся определить местоположение
    determineLocation().then(city => {
        getWeather(city);
    }).catch(error => {
        console.error('Ошибка определения местоположения:', error);
        // Используем Москву как город по умолчанию
        getWeather('Moscow');
    });

    setTimeout(() => {
        performSystemCheck();
    }, 1000);
});

// Функция определения местоположения
async function determineLocation() {
    return new Promise((resolve, reject) => {
        // Пробуем получить геолокацию через браузер
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async position => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const city = await getCityFromCoords(latitude, longitude);
                        resolve(city);
                    } catch (error) {
                        reject(error);
                    }
                },
                async error => {
                    console.warn('Геолокация не разрешена, пробуем определить по IP');
                    try {
                        const city = await getCityFromIP();
                        resolve(city);
                    } catch (ipError) {
                        reject(ipError);
                    }
                }
            );
        } else {
            // Если геолокация не поддерживается, пробуем по IP
            getCityFromIP().then(resolve).catch(reject);
        }
    });
}

// Получение города по координатам
async function getCityFromCoords(latitude, longitude) {
    const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=ru`
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
        return data.results[0].name;
    }
    throw new Error('Город не найден по координатам');
}

// Получение города по IP (резервный метод)
async function getCityFromIP() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        if (data.city) {
            return data.city;
        }
        throw new Error('Город не найден по IP');
    } catch (error) {
        console.error('Ошибка определения города по IP:', error);
        throw error;
    }
}

// Функция обновления времени
function updateTime() {
    const now = new Date();
    elements.time.textContent = now.toLocaleTimeString('ru-RU');
    elements.date.textContent = now.toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Функция получения погоды
async function getWeather(city) {
    try {
        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=ru`
        );
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('Город не найден');
        }

        const { latitude, longitude } = geoData.results[0];
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
            `&current_weather=true&hourly=temperature_2m,relativehumidity_2m,pressure_msl` +
            `&timezone=auto&forecast_days=1`
        );
        const weatherData = await weatherResponse.json();

        updateWeatherUI(weatherData, geoData.results[0].name);
    } catch (error) {
        console.error('Ошибка получения погоды:', error);
        elements.weatherDesc.textContent = 'Данные недоступны';
    }
}

// Обновление UI погоды (остальные функции остаются без изменений)
function updateWeatherUI(weatherData, cityName) {
    const current = weatherData.current_weather;
    const hourly = weatherData.hourly;

    elements.temperature.textContent = `${current.temperature}°C`;
    elements.externalTemp.textContent = `${current.temperature}°C`;
    elements.humidity.textContent = `${hourly.relativehumidity_2m[0]}%`;
    elements.pressure.textContent = `${hourly.pressure_msl[0]} hPa`;
    elements.location.textContent = cityName.toUpperCase();
    elements.weatherDesc.textContent = getWeatherDescription(current.weathercode);
    updateWeatherIcon(current.weathercode);
}

// Описание погоды по коду (без изменений)
function getWeatherDescription(code) {
    const descriptions = {
        0: 'Ясно',
        1: 'Преимущественно ясно',
        2: 'Переменная облачность',
        3: 'Пасмурно',
        45: 'Туман',
        48: 'Туман с инеем',
        51: 'Морось',
        53: 'Морось',
        55: 'Морось',
        61: 'Дождь',
        63: 'Дождь',
        65: 'Дождь',
        71: 'Снег',
        73: 'Снег',
        75: 'Снег',
        80: 'Ливень',
        81: 'Ливень',
        82: 'Ливень',
        95: 'Гроза',
        96: 'Гроза',
        99: 'Гроза'
    };
    return descriptions[code] || 'Неизвестно';
}

// Обновление иконки погоды (без изменений)
function updateWeatherIcon(code) {
    const icons = {
        0: '☀️',
        1: '🌤',
        2: '⛅',
        3: '☁️',
        45: '🌫',
        48: '🌫',
        51: '🌧',
        53: '🌧',
        55: '🌧',
        61: '🌧',
        63: '🌧',
        65: '🌧',
        71: '❄️',
        73: '❄️',
        75: '❄️',
        80: '🌦',
        81: '🌦',
        82: '🌦',
        95: '⛈',
        96: '⛈',
        99: '⛈'
    };
    elements.weatherIcon.textContent = icons[code] || '🌀';
}

// Проверка системы (без изменений)
async function performSystemCheck() {
    elements.checkOverlay.style.display = 'flex';
    elements.checkLogs.innerHTML = '';

    try {
        elements.startupSound.currentTime = 0;
        await elements.startupSound.play();
    } catch (error) {
        console.error('Ошибка воспроизведения звука:', error);
    }

    for (let i = 0; i < systemMessages.length; i++) {
        await addLogMessage(systemMessages[i]);
        await delay(800 + Math.random() * 400);
    }

    await addLogMessage("✓ Все системы функционируют нормально");
    await delay(2000);

    elements.checkOverlay.style.display = 'none';
    elements.systemStatus.textContent = "СИСТЕМА АКТИВНА";
    elements.securityStatus.textContent = "ЗАЩИТА: 100%";
    elements.systemMessage.textContent = "Добрый вечер, сэр. Все системы функционируют нормально.";

    try {
        elements.jarvisSound.currentTime = 0;
        await elements.jarvisSound.play();
    } catch (error) {
        console.error('Ошибка воспроизведения звука:', error);
    }
}

// Добавление сообщения в лог (без изменений)
async function addLogMessage(message) {
    return new Promise(resolve => {
        const logEntry = document.createElement('p');
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

        if (Math.random() < 0.2) {
            logEntry.classList.add('error');
        }

        elements.checkLogs.appendChild(logEntry);
        logEntry.scrollIntoView({ behavior: 'smooth' });
        setTimeout(resolve, 100);
    });
}

// Вспомогательная функция задержки (без изменений)
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
