// Конфигурация
const config = {
    weatherAPIKey: '1dc391a4df1d4e0eb9e182841251904', // Не требуется для Open-Meteo
    city: 'Moscow',
    lang: 'ru'
};

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
    weatherIcon: document.querySelector('.weather-icon')
};

// Обновление времени
function updateTime() {
    const now = new Date();
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };

    elements.time.textContent = now.toLocaleTimeString('ru-RU', timeOptions);
    elements.date.textContent = now.toLocaleDateString('ru-RU', dateOptions);
}

// Получение погоды через Open-Meteo (бесплатно, без API ключа)
async function getWeather() {
    try {
        // Получаем координаты города (геокодирование)
        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${config.city}&count=1&language=${config.lang}`
        );
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('Город не найден');
        }

        const { latitude, longitude } = geoData.results[0];

        // Получаем погоду по координатам
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
            `&current_weather=true&hourly=temperature_2m,relativehumidity_2m,pressure_msl` +
            `&timezone=auto&forecast_days=1`
        );

        const weatherData = await weatherResponse.json();

        // Обновляем интерфейс
        const current = weatherData.current_weather;
        const hourly = weatherData.hourly;

        elements.temperature.textContent = `${current.temperature}°C`;
        elements.externalTemp.textContent = `${current.temperature}°C`;
        elements.humidity.textContent = `${hourly.relativehumidity_2m[0]}%`;
        elements.pressure.textContent = `${hourly.pressure_msl[0]} hPa`;
        elements.location.textContent = geoData.results[0].name.toUpperCase();

        // Определяем описание погоды по коду
        elements.weatherDesc.textContent = getWeatherDescription(current.weathercode);

        // Обновляем иконку
        updateWeatherIcon(current.weathercode);

    } catch (error) {
        console.error('Ошибка получения погоды:', error);
        elements.weatherDesc.textContent = 'Данные недоступны';
    }
}

// Описание погоды по коду (WMO)
function getWeatherDescription(code) {
    const descriptions = {
        0: 'Ясно',
        1: 'Преимущественно ясно',
        2: 'Переменная облачность',
        3: 'Пасмурно',
        45: 'Туман',
        48: 'Туман с инеем',
        51: 'Морось: слабая',
        53: 'Морось: умеренная',
        55: 'Морось: сильная',
        56: 'Ледяная морось: слабая',
        57: 'Ледяная морось: сильная',
        61: 'Дождь: слабый',
        63: 'Дождь: умеренный',
        65: 'Дождь: сильный',
        66: 'Ледяной дождь: слабый',
        67: 'Ледяной дождь: сильный',
        71: 'Снег: слабый',
        73: 'Снег: умеренный',
        75: 'Снег: сильный',
        77: 'Снежные зерна',
        80: 'Ливень: слабый',
        81: 'Ливень: умеренный',
        82: 'Ливень: сильный',
        85: 'Снегопад: слабый',
        86: 'Снегопад: сильный',
        95: 'Гроза',
        96: 'Гроза со слабым градом',
        99: 'Гроза с сильным градом'
    };

    return descriptions[code] || 'Неизвестно';
}

// Иконки погоды по коду
function updateWeatherIcon(code) {
    const iconMap = {
        0: '☀️',
        1: '🌤',
        2: '⛅',
        3: '☁️',
        45: '🌫',
        48: '🌫',
        51: '🌧',
        53: '🌧',
        55: '🌧',
        56: '🌧',
        57: '🌧',
        61: '🌧',
        63: '🌧',
        65: '🌧',
        66: '🌧',
        67: '🌧',
        71: '❄️',
        73: '❄️',
        75: '❄️',
        77: '❄️',
        80: '🌦',
        81: '🌦',
        82: '🌦',
        85: '❄️',
        86: '❄️',
        95: '⛈',
        96: '⛈',
        99: '⛈'
    };

    elements.weatherIcon.textContent = iconMap[code] || '🌀';
}

// Инициализация
updateTime();
getWeather();

// Обновление времени каждую секунду
setInterval(updateTime, 1000);

// Обновление погоды каждые 30 минут
setInterval(getWeather, 1800000);