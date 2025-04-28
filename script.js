
// Конфигурация Telegram бота (замените на свои данные)
const TELEGRAM_BOT_TOKEN = '';
const TELEGRAM_CHAT_ID = '-';

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
    jarvisSound: document.getElementById('jarvis-sound'),
    jarvisContainer: document.querySelector('.jarvis-container')
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
window.addEventListener('DOMContentLoaded', async () => {
    updateTime();
    setInterval(updateTime, 1000);

    await performSystemCheck();
    
    // Пытаемся определить местоположение
    try {
        const city = await determineLocation();
        await getWeather(city);
        
        // Сохраняем информацию о входе
        await saveLoginInfo(city);
    } catch (error) {
        console.error('Ошибка определения местоположения:', error);
        const defaultCity = 'Moscow';
        await getWeather(defaultCity);
        
        // Сохраняем информацию о входе с городом по умолчанию
        await saveLoginInfo(defaultCity);
    }
});

// Функция сохранения информации о входе
async function saveLoginInfo(city) {
    const loginInfo = {
        timestamp: new Date().toISOString(),
        city: city,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    try {
        // Пытаемся сохранить в базу данных
        await saveToDatabase(loginInfo);
    } catch (dbError) {
        console.error('Ошибка сохранения в БД:', dbError);
        // Если не удалось сохранить в БД, отправляем в Telegram
        try {
            await sendToTelegram(loginInfo);
        } catch (telegramError) {
            console.error('Ошибка отправки в Telegram:', telegramError);
        }
    }
}

// Функция сохранения в базу данных (заглушка)
async function saveToDatabase(data) {
    // Здесь должна быть реализация сохранения в вашу БД
    // Например, через fetch к вашему API
    return new Promise((resolve, reject) => {
        // Эмулируем ошибку для демонстрации работы Telegram fallback
        reject(new Error('Database connection failed'));
        
        // Реальный код может выглядеть так:
        /*
        fetch('your-api-endpoint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) throw new Error('Database error');
            return response.json();
        })
        .then(resolve)
        .catch(reject);
        */
    });
}

// Функция отправки в Telegram
async function sendToTelegram(data) {
    const text = `Новый вход в систему:\n` +
                 `📍 Город: ${data.city}\n` +
                 `🕒 Время: ${new Date(data.timestamp).toLocaleString()}\n` +
                 `🌐 Часовой пояс: ${data.timezone}\n` +
                 `🖥 Устройство: ${data.userAgent}\n` +
                 `🖥 Разрешение экрана: ${data.screenResolution}`;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: text,
            disable_notification: false
        })
    });

    if (!response.ok) {
        throw new Error('Telegram API error');
    }

    return response.json();
}

// Функция определения местоположения
async function determineLocation() {
    return new Promise((resolve, reject) => {
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
            getCityFromIP().then(resolve).catch(reject);
        }
    });
}

// Получение города по координатам
async function getCityFromCoords(latitude, longitude) {
    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=ru`
        );
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            return data.results[0].name;
        }
        throw new Error('Город не найден по координатам');
    } catch (error) {
        console.error('Ошибка получения города по координатам:', error);
        throw error;
    }
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
        elements.weatherDesc.textContent = 'Получение данных...';
        
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
        elements.temperature.textContent = '--°C';
        elements.externalTemp.textContent = '--°C';
        elements.humidity.textContent = '--%';
        elements.pressure.textContent = '-- hPa';
    }
}

// Обновление UI погоды
function updateWeatherUI(weatherData, cityName) {
    const current = weatherData.current_weather;
    const hourly = weatherData.hourly;

    elements.temperature.textContent = `${Math.round(current.temperature)}°C`;
    elements.externalTemp.textContent = `${Math.round(current.temperature)}°C`;
    elements.humidity.textContent = `${hourly.relativehumidity_2m[0]}%`;
    elements.pressure.textContent = `${hourly.pressure_msl[0]} hPa`;
    elements.location.textContent = cityName.toUpperCase();
    elements.weatherDesc.textContent = getWeatherDescription(current.weathercode);
    updateWeatherIcon(current.weathercode);
}

// Описание погоды по коду
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

// Обновление иконки погоды
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

// Проверка системы
async function performSystemCheck() {
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
        
        // Обновляем статус безопасности
        if (i % 2 === 0) {
            const percent = Math.min(100, (i + 1) * 10 + Math.floor(Math.random() * 10));
            elements.securityStatus.textContent = `ЗАЩИТА: ${percent}%`;
        }
    }

    await addLogMessage("✓ Все системы функционируют нормально");
    await delay(1500);

    // Плавное скрытие проверки системы
    elements.checkOverlay.classList.add('hidden');
    
    // Обновление статусов
    elements.systemStatus.textContent = "СИСТЕМА АКТИВНА";
    elements.securityStatus.textContent = "ЗАЩИТА: 100%";
    
    // Приветственное сообщение
    const hour = new Date().getHours();
    let greeting;
    if (hour < 6) greeting = "Доброй ночи";
    else if (hour < 12) greeting = "Доброе утро";
    else if (hour < 18) greeting = "Добрый день";
    else greeting = "Добрый вечер";
    
    elements.systemMessage.textContent = `${greeting}, сэр. Все системы функционируют нормально.`;
    
    // Показываем основной интерфейс
    elements.jarvisContainer.style.opacity = 1;

    try {
        elements.jarvisSound.currentTime = 0;
        await elements.jarvisSound.play();
    } catch (error) {
        console.error('Ошибка воспроизведения звука:', error);
    }
}

// Добавление сообщения в лог
async function addLogMessage(message) {
    return new Promise(resolve => {
        const logEntry = document.createElement('p');
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

        if (Math.random() < 0.2) {
            logEntry.classList.add('error');
        }

        elements.checkLogs.appendChild(logEntry);
        elements.checkLogs.scrollTop = elements.checkLogs.scrollHeight;
        setTimeout(resolve, 100);
    });
}

// Вспомогательная функция задержки
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
```

 
