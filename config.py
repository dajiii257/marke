# ============================================
# Matrix Market Bot - Конфигурация
# ============================================

# 🤖 Токен вашего Telegram бота
# Получите у @BotFather командой /newbot
BOT_TOKEN = "8882587752:AAEzfjhmlGuWcvIM4YbxEQZZNo3HqK0_oos"

# 🔑 API ID и API Hash для Telegram Client API
# Получите на https://my.telegram.org
API_ID = 2040
API_HASH = "b18441a1ff607e10a989891a5462e627"

# 👑 ID администраторов (список)
# Узнайте свой ID у @userinfobot
ADMIN_IDS = [6655077013, 8833355464, 192237320]  # Замените на ваши ID

# 🌐 URL вашего MiniApp (фронтенд)
# Для локальной разработки: "http://localhost:8080/market/index.html"
# Для продакшена на bothost.ru: "https://your-domain.com/market/index.html"
MINIAPP_URL = "https://mybot45669.bothost.tech/static/index.html"

# 🖥️ Настройки Flask API сервера
API_HOST = "0.0.0.0"  # Слушать на всех интерфейсах
API_PORT = 8080       # Порт для API (bothost.ru использует 8080!)

# 🗄️ База данных SQLite
DATABASE_PATH = "market.db"

# 📸 Путь к фото для отправки со звёздами
STARS_PHOTO_PATH = "./stars/photo_2026-10-11_13-05-25.jpg"  # ⬅️ Исправлен путь!

# 🔐 Безопасность (для продакшена включите!)
VERIFY_INIT_DATA = False  # True - включить HMAC валидацию initData (пока False для тестирования)

# ⚙️ Дополнительные настройки
DEBUG_MODE = True  # Включить подробные логи для диагностики
GIFT_EXPIRY_MINUTES = 60   # Время жизни подарков (минут)
STARS_EXPIRY_MINUTES = 45  # Время жизни звёзд (минут)

# 🎁 Список возможных NFT подарков (реальные подарки!)
GIFT_NAMES = [
    "SnowGlobe-45994",
    "MirageLamp-22457",
    "FlyingBroom-21518",
    "JesterHat-5832",
    "VictoryMedal-61594",
    "JesterHat-143758"
]

# ⭐ Курс обмена Stars на TON
STARS_TO_TON_RATE = 100  # 100 Stars = 1 TON
