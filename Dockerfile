# Используем официальный Python образ
FROM python:3.11-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем requirements.txt
COPY requirements.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь код
COPY . .

# Создаём папки для sessions и tdata
RUN mkdir -p sessions tdata && \
    chmod 700 sessions tdata

# Открываем порт для Flask API
EXPOSE 8080

# Запускаем бота
CMD ["python3", "main.py"]
