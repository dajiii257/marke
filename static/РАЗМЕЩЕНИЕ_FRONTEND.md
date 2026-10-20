# 🌐 РАЗМЕЩЕНИЕ FRONTEND (MiniApp)

## 📋 У ВАС ДВА ВАРИАНТА

### Вариант А: Frontend на отдельном хосте (РЕКОМЕНДУЕТСЯ) ✅
**Плюсы**: Быстрее, проще, бесплатно, автодеплой
**Минусы**: Нужно зарегистрироваться на Netlify/Vercel

### Вариант Б: Frontend и Backend на bothost.ru вместе
**Плюсы**: Всё в одном месте
**Минусы**: Нужно добавить код для раздачи статических файлов

---

## 🚀 ВАРИАНТ А: NETLIFY (РЕКОМЕНДУЕТСЯ)

### Шаг 1: Подготовка
1. Откройте папку `frontend/`
2. Убедитесь, что в `config.js` указан правильный API URL:
   ```javascript
   window.MARKET_API_ORIGIN = "https://mybot45669.bothost.tech";
   ```
   ✅ Уже настроено!

### Шаг 2: Размещение на Netlify

#### Способ 1: Через сайт (проще)
1. Зайдите на https://www.netlify.com/
2. Нажмите "Sign up" (можно через GitHub)
3. Нажмите "Add new site" → "Deploy manually"
4. Перетащите **всю папку `frontend/`** в окно браузера
5. Дождитесь загрузки (30-60 секунд)
6. Netlify даст вам URL типа: `https://random-name-123.netlify.app`

#### Способ 2: Через Netlify CLI
```bash
# Установите Netlify CLI
npm install -g netlify-cli

# Перейдите в папку frontend
cd "c:\Users\PC\Desktop\shant papa\frontend"

# Разверните
netlify deploy --prod
```

### Шаг 3: Получите URL
После деплоя вы получите URL вида:
```
https://your-app-name.netlify.app
```

### Шаг 4: Обновите бота
1. Откройте `upload_to_bothost/config.py`
2. Измените:
   ```python
   MINIAPP_URL = "https://your-app-name.netlify.app/index.html"
   ```
3. Загрузите обновлённый `config.py` на bothost.ru
4. Перезапустите бота

### Шаг 5: Обновите @BotFather
```
/mybots → Ваш бот → Bot Settings → Menu Button → Edit
```
Новый URL: `https://your-app-name.netlify.app/index.html`

---

## 🔧 ВАРИАНТ Б: BOTHOST.RU (Frontend + Backend вместе)

### Шаг 1: Загрузите frontend на bothost.ru

Загрузите **всю папку `frontend/`** в `/app/static/` на bothost.ru:

```
/app/
  ├── server.py
  ├── config.py
  ├── requirements.txt
  ├── stars/
  │   └── photo_2026-10-11_13-05-25.jpg
  └── static/              ← Новая папка!
      ├── ajax/
      ├── Stic/
      ├── index.html
      ├── config.js
      ├── api.js
      ├── auth.js
      └── ... (все файлы из frontend/)
```

### Шаг 2: Обновите config.js
В файле `/app/static/config.js` измените:
```javascript
window.MARKET_API_ORIGIN = "https://mybot45669.bothost.tech";
```

### Шаг 3: Добавьте роут в server.py

Откройте `server.py` и добавьте **ПЕРЕД** строкой `# ============================================`:

```python
from flask import send_from_directory

@app.route('/static/<path:path>')
def serve_static(path):
    """Раздача статических файлов frontend"""
    return send_from_directory('static', path)

@app.route('/')
def serve_index():
    """Главная страница - редирект на MiniApp"""
    return send_from_directory('static', 'index.html')
```

### Шаг 4: Обновите config.py
```python
MINIAPP_URL = "https://mybot45669.bothost.tech/static/index.html"
```

### Шаг 5: Обновите @BotFather
```
/mybots → Ваш бот → Bot Settings → Menu Button → Edit
```
Новый URL: `https://mybot45669.bothost.tech/static/index.html`

### Шаг 6: Перезапустите бота
Перезапустите бота на bothost.ru.

---

## ✅ ПРОВЕРКА

После размещения frontend, проверьте:

### 1. Откройте URL напрямую в браузере
```
https://your-app-name.netlify.app/index.html
```
или
```
https://mybot45669.bothost.tech/static/index.html
```

Должна открыться страница маркета (даже без Telegram WebApp).

### 2. Откройте через бота
1. Откройте бота в Telegram
2. Нажмите кнопку "🎁 Открыть"
3. Должен открыться MiniApp

### 3. Проверьте API подключение
1. Откройте MiniApp
2. Откройте Developer Tools (F12) → Console
3. НЕ должно быть ошибок подключения к API
4. Должны быть успешные запросы к `/market/open`

---

## 🔍 ДИАГНОСТИКА ПРОБЛЕМ

### Ошибка: "Not Found"
**Причина**: Frontend не размещён или неправильный URL

**Решение**:
1. Проверьте, что файлы загружены
2. Проверьте URL в `config.py` и @BotFather
3. Убедитесь, что `/index.html` добавлен в конец URL

### Ошибка: "Failed to fetch" в консоли
**Причина**: Frontend не может подключиться к API

**Решение**:
1. Проверьте `frontend/config.js` - должен быть правильный URL backend
2. Проверьте, что backend запущен на bothost.ru
3. Проверьте CORS в backend (должен быть `CORS(app)`)

### Ошибка: "Invalid initData"
**Причина**: Frontend отправляет пустой или неправильный initData

**Решение**:
1. Убедитесь, что MiniApp открывается через Telegram (не в обычном браузере)
2. В `config.py` установите `VERIFY_INIT_DATA = False` для тестирования
3. Проверьте консоль браузера на ошибки

---

## 📝 РЕКОМЕНДАЦИИ

1. **Используйте Netlify** - это проще и быстрее
2. **Не забудьте обновить Menu Button** в @BotFather после размещения
3. **Проверяйте консоль браузера** (F12) для диагностики ошибок
4. **После первого деплоя**, можете включить `VERIFY_INIT_DATA = True` в config.py

---

## 🎯 ИТОГОВАЯ СТРУКТУРА

### Вариант А (Netlify):
```
Backend: https://mybot45669.bothost.tech (bothost.ru)
Frontend: https://your-app.netlify.app (Netlify)
MiniApp URL: https://your-app.netlify.app/index.html
```

### Вариант Б (Всё на bothost.ru):
```
Backend + Frontend: https://mybot45669.bothost.tech (bothost.ru)
MiniApp URL: https://mybot45669.bothost.tech/static/index.html
```

---

Готово! Выберите вариант и следуйте инструкции. 🚀
