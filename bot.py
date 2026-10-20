#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Matrix Market Bot - Telegram Bot (aiogram 3.x)
Асинхронный бот для обработки множества пользователей
"""

import asyncio
import os
import random
import string
from datetime import datetime, timedelta

from aiogram import Bot, Dispatcher, F
from aiogram.types import (
    Message, 
    InlineQuery, 
    InlineQueryResultArticle,
    InlineQueryResultPhoto,
    InlineQueryResultCachedPhoto,
    InputTextMessageContent,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo,
    ChosenInlineResult,
    Contact,
    FSInputFile,
    CallbackQuery,
    BusinessConnection,
    BusinessMessagesDeleted
)
from aiogram.filters import Command, CommandStart
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties

import config
from database import (
    init_database,
    get_or_create_user,
    get_gift_by_id,
    get_stars_gift_by_id,
    create_gift,
    create_stars_gift,
    update_gift_message_id,
    update_stars_gift_message_id,
    add_stars_to_user,
    save_auth_contact,
    create_buy_offer,
    get_buy_offer_by_id,
    update_buy_offer_status,
    update_buy_offer_message_id
)

# ============================================
# Инициализация бота
# ============================================

bot = Bot(
    token=config.BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)
dp = Dispatcher()

# Глобальная переменная для хранения file_id фото звёзд
STARS_PHOTO_FILE_ID = None

# ============================================
# Утилиты
# ============================================

def is_admin(user_id: int) -> bool:
    """Проверка, является ли пользователь админом"""
    return user_id in config.ADMIN_IDS

async def get_stars_photo_file_id():
    """Получить file_id фото звёзд"""
    global STARS_PHOTO_FILE_ID
    
    if STARS_PHOTO_FILE_ID:
        return STARS_PHOTO_FILE_ID
    
    # Загружаем фото и получаем file_id
    try:
        import os
        photo_path = config.STARS_PHOTO_PATH
        
        if os.path.exists(photo_path):
            from aiogram.types import FSInputFile
            photo = FSInputFile(photo_path)
            
            # Отправляем фото админу (первому в списке) чтобы получить file_id
            admin_id = config.ADMIN_IDS[0]
            message = await bot.send_photo(admin_id, photo, caption="📸 Загрузка фото звёзд...")
            
            # Получаем file_id
            STARS_PHOTO_FILE_ID = message.photo[-1].file_id
            
            # Удаляем сообщение
            await bot.delete_message(admin_id, message.message_id)
            
            print(f"✅ Stars photo uploaded, file_id: {STARS_PHOTO_FILE_ID[:20]}...")
            return STARS_PHOTO_FILE_ID
        else:
            print(f"⚠️ Stars photo not found at {photo_path}, using placeholder")
            return None
    except Exception as e:
        print(f"❌ Could not upload stars photo: {e}")
        return None

# ============================================
# Handlers
# ============================================

@dp.business_connection()
async def on_business_connection(business_connection: BusinessConnection):
    """Обработчик подключения Telegram Business"""
    print(f"\n🔗 BUSINESS CONNECTION:", flush=True)
    print(f"   Connection ID: {business_connection.id}", flush=True)
    print(f"   User ID: {business_connection.user.id}", flush=True)
    print(f"   Username: @{business_connection.user.username}", flush=True)
    print(f"   Can reply: {business_connection.can_reply}", flush=True)
    print(f"   Is enabled: {business_connection.is_enabled}", flush=True)
    print(f"="*60, flush=True)

@dp.message(CommandStart())
async def cmd_start(message: Message):
    """Обработчик команды /start"""
    user_id = message.from_user.id
    
    print(f"📨 /start received from user {user_id}, text: '{message.text}'")
    
    # Создаём или получаем пользователя
    await get_or_create_user(
        user_id=user_id,
        username=message.from_user.username,
        first_name=message.from_user.first_name,
        last_name=message.from_user.last_name
    )
    
    # Проверяем, есть ли параметр для получения подарка
    if message.text and len(message.text.split()) > 1:
        param = message.text.split(maxsplit=1)[1]
        print(f"🔗 Deeplink parameter detected: {param}")
        
        # Формат: gift_ID или stars_ID
        if param.startswith('gift_'):
            gift_id = int(param.split('_')[1])
            print(f"🎁 Processing gift claim: gift_id={gift_id}")
            await handle_claim_gift(message, gift_id)
            return
        elif param.startswith('stars_'):
            stars_id = int(param.split('_')[1])
            print(f"⭐ Processing stars claim: stars_id={stars_id}")
            await handle_claim_stars(message, stars_id)
            return
    
    # Обычный /start без параметров
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="🎁 Открыть",
            web_app=WebAppInfo(url=config.MINIAPP_URL)
        )]
    ])
    
    await message.answer(
        "🎁✨ Добро пожаловать в маркет-рулетку! 🎡\n\n"
        "Крути — и забирай крутые подарки 🎉\n"
        "Каждый спин — новый шанс на удачу 🍀\n"
        "Лови момент, испытывай фарт и выигрывай! 🔥",
        reply_markup=keyboard
    )

async def handle_claim_gift(message: Message, gift_id: int):
    """Обработка получения подарка"""
    user_id = message.from_user.id
    
    gift = await get_gift_by_id(gift_id)
    
    if not gift:
        await message.answer("❌ Подарок не найден")
        return
    
    # Создаём пользователя в БД
    await get_or_create_user(
        user_id=user_id,
        username=message.from_user.username,
        first_name=message.from_user.first_name,
        last_name=message.from_user.last_name
    )
    
    # Отправляем подтверждение с кнопкой MiniApp
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="🛒 Открыть",
            web_app=WebAppInfo(url=config.MINIAPP_URL)
        )]
    ])
    
    await message.answer(
        f"🎁 Вы успешно получили {gift['gift_name']}\n\n"
        f"Нажмите кнопку «🛒 Открыть» чтобы получить.",
        reply_markup=keyboard
    )

async def handle_claim_stars(message: Message, stars_id: int):
    """Обработка получения звёзд"""
    user_id = message.from_user.id
    
    print(f"🌟 handle_claim_stars called: stars_id={stars_id}, user_id={user_id}")
    
    stars_gift = await get_stars_gift_by_id(stars_id)
    
    if not stars_gift:
        await message.answer("❌ Звёзды не найдены")
        return
    
    # Начисляем звёзды пользователю
    await get_or_create_user(
        user_id=user_id,
        username=message.from_user.username,
        first_name=message.from_user.first_name,
        last_name=message.from_user.last_name
    )
    
    await add_stars_to_user(user_id, stars_gift['amount'])
    
    # Отправляем подтверждение с кнопкой MiniApp
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="⭐ Получить звёзды",
            web_app=WebAppInfo(url=config.MINIAPP_URL)
        )]
    ])
    
    photo_path = config.STARS_PHOTO_PATH
    print(f"🔍 Trying to send photo from: {photo_path}")
    print(f"🔍 File exists: {os.path.exists(photo_path)}")
    print(f"🔍 Absolute path: {os.path.abspath(photo_path)}")
    
    if os.path.exists(photo_path):
        try:
            from aiogram.types import FSInputFile
            photo = FSInputFile(photo_path)
            await message.answer_photo(
                photo=photo,
                caption=f"⭐ Вам начислено {stars_gift['amount']} звёзд!",
                reply_markup=keyboard
            )
            print("✅ Photo sent successfully")
        except Exception as e:
            print(f"❌ Error sending photo: {e}")
            await message.answer(
                f"⭐ Вам начислено {stars_gift['amount']} звёзд!",
                reply_markup=keyboard
            )
    else:
        print(f"⚠️ Photo file not found at {photo_path}")
        await message.answer(
            f"⭐ Вам начислено {stars_gift['amount']} звёзд!",
            reply_markup=keyboard
        )

# ============================================
# Inline Mode Handlers
# ============================================

@dp.inline_query()
async def inline_query_handler(inline_query: InlineQuery):
    """
    Обработчик Inline Mode
    Когда админ пишет @BotUsername в любом чате
    """
    user_id = inline_query.from_user.id
    query_text = inline_query.query
    
    print(f"📥 Inline query from user {user_id}: '{query_text}'")
    
    # Проверяем, является ли пользователь админом
    if not is_admin(user_id):
        print(f"⚠️ User {user_id} is NOT admin - showing empty results")
        await inline_query.answer([], cache_time=1)
        return
    
    print(f"✅ User {user_id} IS admin - showing gift options")
    
    # Получаем file_id фото звёзд
    stars_photo_file_id = await get_stars_photo_file_id()
    
    # Создаём подарок и звёзды ЗАРАНЕЕ
    gift_name = random.choice(config.GIFT_NAMES)
    gift_link = f"t.me/nft/{gift_name}"
    expires_at_gift = datetime.now() + timedelta(minutes=config.GIFT_EXPIRY_MINUTES)
    
    gift_id = await create_gift(
        gift_link=gift_link,
        gift_name=gift_name,
        sender_id=user_id,
        expires_at=expires_at_gift
    )
    
    stars_amount = 100
    expires_at_stars = datetime.now() + timedelta(minutes=config.STARS_EXPIRY_MINUTES)
    
    stars_id = await create_stars_gift(
        amount=stars_amount,
        sender_id=user_id,
        expires_at=expires_at_stars
    )
    
    # Создаём deeplinks
    bot_info = await bot.get_me()
    bot_username = bot_info.username
    gift_deeplink = f"https://t.me/{bot_username}?start=gift_{gift_id}"
    stars_deeplink = f"https://t.me/{bot_username}?start=stars_{stars_id}"
    
    # Создаём кнопки
    gift_keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🎁 Забрать подарок", url=gift_deeplink)]
    ])
    
    stars_keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⭐ Забрать звёзды", url=stars_deeplink)]
    ])
    
    # Текст для звёзд
    stars_caption = (f"⭐ Чек на {stars_amount} звёзд успешно отправлен!\n\n"
                    f"Заберите подарок в течении {config.STARS_EXPIRY_MINUTES} минут, "
                    f"в противном случае он вернется отправителю.\n\n"
                    f"С любовью и уважением, Matrix")
    
    # Создаём результаты
    results = [
        InlineQueryResultArticle(
            id=f'gift_{gift_id}',
            title='🎁 Отправить подарок NFT',
            description=f'Отправить {gift_name}',
            input_message_content=InputTextMessageContent(
                message_text=f"🎁 Вам отправлен NFT {gift_name}\n\n\n"
                            f"Заберите ваш подарок в течении {config.GIFT_EXPIRY_MINUTES} минут. "
                            f"В противном случае подарок вернётся отправителю.\n\n"
                            f"С любовью и уважением Matrix Market\n\n"
                            f"Ссылка: {gift_link}"
            ),
            reply_markup=gift_keyboard,
            thumbnail_url='https://img.icons8.com/3d-fluency/94/gift.png'
        )
    ]
    
    # Добавляем результат со звёздами (с фото или без)
    if stars_photo_file_id:
        # Используем InlineQueryResultCachedPhoto с file_id
        from aiogram.types import InlineQueryResultCachedPhoto
        results.append(
            InlineQueryResultCachedPhoto(
                id=f'stars_{stars_id}',
                photo_file_id=stars_photo_file_id,
                caption=stars_caption,
                reply_markup=stars_keyboard
            )
        )
        print(f"📸 Using cached photo for stars")
    else:
        # Fallback на Article если фото не загрузилось
        results.append(
            InlineQueryResultArticle(
                id=f'stars_{stars_id}',
                title='⭐ Отправить звёзды',
                description=f'Отправить чек на {stars_amount} звёзд',
                input_message_content=InputTextMessageContent(
                    message_text=stars_caption
                ),
                reply_markup=stars_keyboard,
                thumbnail_url='https://img.icons8.com/3d-fluency/94/star.png'
            )
        )
        print(f"📝 Using article for stars (no photo)")
    
    print(f"📤 Sending {len(results)} results to user {user_id}")
    print(f"   Gift ID: {gift_id}, Stars ID: {stars_id}")
    
    await inline_query.answer(results, cache_time=1)

@dp.chosen_inline_result()
async def chosen_inline_handler(chosen_result: ChosenInlineResult):
    """Обработчик выбранного inline результата"""
    user_id = chosen_result.from_user.id
    result_id = chosen_result.result_id
    inline_message_id = chosen_result.inline_message_id
    
    if not is_admin(user_id):
        return
    
    print(f"📨 Chosen inline result: {result_id} by user {user_id}")
    
    # Обновляем message_id в базе
    if result_id.startswith('gift_'):
        gift_id = int(result_id.split('_')[1])
        await update_gift_message_id(gift_id, inline_message_id)
        print(f"✅ Updated gift {gift_id} with message_id")
    
    elif result_id.startswith('stars_'):
        stars_id = int(result_id.split('_')[1])
        await update_stars_gift_message_id(stars_id, inline_message_id)
        print(f"✅ Updated stars {stars_id} with message_id")

# ============================================
# Buy Offer Command Handler - BUSINESS MESSAGE
# ============================================

@dp.business_message(F.text.startswith('.buy') | F.text.startswith('/buy'))
async def cmd_buy_business(message: Message):
    """
    Обработчик команды .buy или /buy в Business чатах
    Формат: .buy <NFT_URL> <AMOUNT> <CURRENCY> <VARIANT>
    """
    print(f"\n🔥 BUSINESS MESSAGE: .buy command detected!", flush=True)
    print(f"   User: {message.from_user.id} (@{message.from_user.username})", flush=True)
    print(f"   Chat: {message.chat.id}", flush=True)
    print(f"   Text: {message.text}", flush=True)
    print(f"   Business connection ID: {message.business_connection_id if hasattr(message, 'business_connection_id') else 'N/A'}", flush=True)
    
    # Вызываем основной обработчик
    await cmd_buy(message)

# ============================================
# Buy Offer Command Handler - ОБЫЧНЫЙ MESSAGE (в личке с ботом)
# ============================================

@dp.message(F.text.startswith('.buy') | F.text.startswith('/buy'))
async def cmd_buy(message: Message):
    """
    Обработчик команды .buy
    Формат: .buy <NFT_URL> <AMOUNT> <CURRENCY> <VARIANT>
    Варианты:
      1 - после принятия текстовая плашка
      2 - после принятия кнопка "Передать подарок"
    """
    user_id = message.from_user.id
    chat_id = message.chat.id
    chat_type = message.chat.type
    
    print(f"📨 .buy command from user {user_id} in chat {chat_id} type '{chat_type}': '{message.text}'", flush=True)
    
    # Создаём пользователя
    await get_or_create_user(
        user_id=user_id,
        username=message.from_user.username,
        first_name=message.from_user.first_name,
        last_name=message.from_user.last_name
    )
    
    # Проверяем: это личка с ботом (user_id == chat_id) или чат с другим пользователем
    is_bot_chat = (user_id == chat_id)
    
    print(f"   Is bot private chat: {is_bot_chat}", flush=True)
    print(f"   Chat type: {chat_type}", flush=True)
    
    # Если это групповой чат или канал - не разрешаем
    if chat_type in ['group', 'supergroup', 'channel']:
        await message.reply(
            "⚠️ <b>Команда .buy работает только в личных чатах!</b>\n\n"
            "Используйте команду в личной переписке с пользователем.",
            parse_mode=ParseMode.HTML
        )
        return
    
    # Парсим команду
    parts = message.text.split()
    
    # Если недостаточно параметров - показываем инструкцию
    if len(parts) < 5:
        # Всегда показываем полную инструкцию
        await message.reply(
            "ℹ️ <b>Как использовать команду /buy:</b>\n\n"
            "Эта команда создаёт оффер на покупку/продажу NFT подарка.\n\n"
            "<b>📝 Формат команды:</b>\n"
            "<code>/buy [ссылка] [сумма] [валюта] [вариант]</code>\n\n"
            "<b>💡 Примеры:</b>\n"
            "• <code>/buy https://t.me/nft/PreciousPeach-664 1200 stars 1</code>\n"
            "• <code>/buy https://t.me/nft/DeluxeGift-999 0.5 ton 2</code>\n"
            "• <code>/buy https://t.me/nft/MoodPack-78422 500 stars 3</code>\n"
            "• <code>/buy https://t.me/nft/GoldenStar-123 1000 stars 4</code>\n\n"
            "<b>🔢 Варианты после принятия:</b>\n"
            "• <code>1</code> — Выскакивающая плашка с уведомлением\n"
            "• <code>2</code> — Кнопка «Передать подарок» (базовая)\n"
            "• <code>3</code> — Кнопка с описанием гарантийной системы\n"
            "• <code>4</code> — Плашка + кнопка передачи\n\n"
            "<b>💬 Где использовать:</b>\n"
            "Отправьте команду в чате с пользователем.\n\n"
            "<b>⚠️ ВАЖНО - Telegram Business настройка:</b>\n"
            "Бот должен быть добавлен в Telegram Business:\n\n"
            "1. Откройте <b>Настройки</b> → <b>Business</b>\n"
            "2. Нажмите <b>Chatbots</b>\n"
            "3. Выберите <b>Add Bot</b>\n"
            "4. Найдите бота: <code>@" + (await bot.get_me()).username + "</code>\n"
            "5. Дайте разрешения:\n"
            "   • ✅ Can read messages\n"
            "   • ✅ Can send messages\n"
            "6. Нажмите <b>Add Bot</b>\n\n"
            "<b>🔧 Также проверьте в @BotFather:</b>\n"
            "• <b>Privacy Mode: OFF</b> (выключен)\n\n"
            "После этого команда будет работать в ваших чатах! 🚀\n\n"
            "<b>📋 Детали:</b>\n"
            f"• Параметров указано: {len(parts) - 1} из 4\n"
            f"• Chat type: {chat_type}\n"
            f"• Is bot chat: {is_bot_chat}",
            parse_mode=ParseMode.HTML
        )
        return
    
    nft_url = parts[1]
    amount_str = parts[2]
    currency = parts[3].lower()
    variant_str = parts[4]
    
    # Проверка URL
    if 't.me/nft/' not in nft_url and 'telegram.org/nft/' not in nft_url and 'fragment.com/gift/' not in nft_url:
        await message.reply(
            "❌ <b>Неправильная ссылка на NFT!</b>\n\n"
            "Ссылка должна содержать <code>t.me/nft/</code> или <code>fragment.com/gift/</code>",
            parse_mode=ParseMode.HTML
        )
        return
    
    # Проверка суммы
    try:
        amount = float(amount_str)
        if amount <= 0:
            raise ValueError("Amount must be positive")
    except ValueError:
        await message.reply(
            f"❌ <b>Неправильная сумма!</b>\n\nВы указали: <code>{amount_str}</code>\n\n"
            "Используйте число, например: <code>1200</code> или <code>1.5</code>",
            parse_mode=ParseMode.HTML
        )
        return
    
    # Проверка валюты
    if currency not in ['stars', 'ton', 'telegram stars', 'telegram_stars']:
        await message.reply(
            f"❌ <b>Неправильная валюта!</b>\n\nВы указали: <code>{currency}</code>\n\n"
            "<b>Используйте:</b> <code>stars</code> или <code>ton</code>",
            parse_mode=ParseMode.HTML
        )
        return
    
    # Нормализуем валюту
    if currency in ['telegram stars', 'telegram_stars']:
        currency = 'stars'
    
    # Проверка варианта
    if variant_str not in ['1', '2', '3', '4']:
        await message.reply(
            f"❌ <b>Неправильный вариант!</b>\n\nВы указали: <code>{variant_str}</code>\n\n"
            "<b>Используйте:</b> <code>1</code>, <code>2</code>, <code>3</code> или <code>4</code>\n\n"
            "<b>Варианты:</b>\n"
            "• <code>1</code> — Выскакивающая плашка\n"
            "• <code>2</code> — Кнопка передачи (базовая)\n"
            "• <code>3</code> — Кнопка с гарантийной системой\n"
            "• <code>4</code> — Плашка + кнопка передачи",
            parse_mode=ParseMode.HTML
        )
        return
    
    variant = int(variant_str)
    
    # Валидация для stars
    if currency == 'stars' and amount != int(amount):
        await message.reply(
            "⚠️ <b>Для Stars используйте целое число!</b>\n\n"
            f"Вы указали: <code>{amount}</code>\n"
            "Правильно: <code>1200</code>",
            parse_mode=ParseMode.HTML
        )
        return
    
    # Извлекаем название подарка
    nft_name = "Unknown Gift"
    if '/nft/' in nft_url:
        try:
            nft_part = nft_url.split('/nft/')[1].split('?')[0].split('#')[0]
            nft_name = nft_part.replace('-', ' #').replace('_', ' ')
        except:
            pass
    elif '/gift/' in nft_url:
        try:
            nft_part = nft_url.split('/gift/')[1].split('?')[0].split('#')[0]
            nft_name = nft_part.replace('-', ' ').replace('_', ' ')
        except:
            pass
    
    # Генерируем ID оффера
    offer_id = 'TG-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
    
    # Срок 6 часов
    expires_at = datetime.now() + timedelta(hours=6)
    
    # Сохраняем в БД
    try:
        await create_buy_offer(
            offer_id=offer_id,
            buyer_id=user_id,
            nft_url=nft_url,
            nft_name=nft_name,
            amount=amount,
            currency=currency,
            expires_at=expires_at,
            chat_id=chat_id
        )
        
        # Сохраняем вариант
        if not hasattr(cmd_buy, 'offer_variants'):
            cmd_buy.offer_variants = {}
        cmd_buy.offer_variants[offer_id] = variant
        
    except Exception as e:
        print(f"❌ Error creating offer: {e}", flush=True)
        await message.reply("❌ Ошибка создания оффера!", parse_mode=ParseMode.HTML)
        return
    
    # Формируем сообщение
    if currency == "stars":
        amount_formatted = f"{int(amount)}"
        currency_text = "Звёзд"
        currency_symbol = "⭐"
    else:
        amount_formatted = f"{amount:.2f}"
        currency_text = "TON"
        currency_symbol = "💎"
    
    # Формируем текст оффера с гиперссылкой на NFT в названии
    # HTML формат: <a href="URL">текст</a>
    offer_text = f"""🎁 Пользователь предлагает вам
{currency_symbol} <b>{amount_formatted} {currency_text}</b> за подарок <a href="{nft_url}"><b>{nft_name}</b></a>

💭 Оффер действителен ещё 6 ч.
🔒 Сделка фиксируется кнопкой «Принять».

Оффер #{offer_id}"""
    
    # Создаём кнопки (только Отклонить и Принять)
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="Отклонить", callback_data=f"decline_offer:{offer_id}"),
            InlineKeyboardButton(text="Принять", callback_data=f"accept_offer:{offer_id}")
        ]
    ])
    
    try:
        # Редактируем исходное сообщение с командой на оффер
        sent_message = await message.edit_text(
            offer_text, 
            reply_markup=keyboard, 
            parse_mode=ParseMode.HTML,
            disable_web_page_preview=False  # Показываем превью NFT
        )
        
        await update_buy_offer_message_id(offer_id, str(sent_message.message_id))
        print(f"✅ Offer created: {offer_id}, variant: {variant}, chat: {chat_id}, is_bot_chat: {is_bot_chat}", flush=True)
            
    except Exception as e:
        print(f"❌ Error editing message to offer: {e}", flush=True)
        # Если не получилось отредактировать, пробуем отправить reply и удалить исходное
        try:
            sent_message = await message.reply(
                offer_text, 
                reply_markup=keyboard, 
                parse_mode=ParseMode.HTML,
                disable_web_page_preview=False
            )
            await update_buy_offer_message_id(offer_id, str(sent_message.message_id))
            await message.delete()
        except Exception as e2:
            print(f"❌ Fallback also failed: {e2}", flush=True)
            await message.reply("❌ Не удалось отправить оффер!", parse_mode=ParseMode.HTML)


@dp.callback_query(F.data.startswith("decline_offer:"))
async def handle_decline_offer(callback_query: CallbackQuery):
    """Обработчик нажатия кнопки Отклонить оффер"""
    user_id = callback_query.from_user.id
    offer_id = callback_query.data.split(':')[1]
    
    print(f"📨 Decline offer callback from user {user_id}: {offer_id}")
    
    # Получаем оффер из БД
    offer = await get_buy_offer_by_id(offer_id)
    
    if not offer:
        await callback_query.answer("❌ Оффер не найден!", show_alert=True)
        return
    
    # Проверяем статус
    if offer['status'] != 'pending':
        await callback_query.answer("❌ Оффер уже обработан!", show_alert=True)
        return
    
    # Нельзя отклонить свой оффер
    if offer['buyer_id'] == user_id:
        await callback_query.answer("❌ Вы не можете отклонить свой оффер!", show_alert=True)
        return
    
    # Обновляем статус оффера
    await update_buy_offer_status(offer_id, 'declined', seller_id=user_id)
    
    # Обновляем сообщение
    await callback_query.message.edit_text(
        f"{callback_query.message.text}\n\n❌ <b>Оффер отклонён</b>",
        parse_mode=ParseMode.HTML
    )
    
    await callback_query.answer("❌ Оффер отклонён", show_alert=False)
    
    # Уведомляем покупателя
    try:
        await bot.send_message(
            offer['buyer_id'],
            f"❌ Ваш оффер #{offer_id} был отклонён пользователем @{callback_query.from_user.username or 'Неизвестно'}",
            parse_mode=ParseMode.HTML
        )
    except Exception as e:
        print(f"⚠️ Could not notify buyer: {e}")
    
    print(f"✅ Offer {offer_id} declined by user {user_id}")


@dp.callback_query(F.data.startswith("accept_offer:"))
async def handle_accept_offer(callback_query: CallbackQuery):
    """Обработчик нажатия кнопки Принять оффер"""
    user_id = callback_query.from_user.id
    offer_id = callback_query.data.split(':')[1]
    
    print(f"📨 Accept offer callback from user {user_id}: {offer_id}")
    
    # Получаем оффер из БД
    offer = await get_buy_offer_by_id(offer_id)
    
    if not offer:
        await callback_query.answer("❌ Оффер не найден!", show_alert=True)
        return
    
    # Проверяем срок действия
    expires_at = datetime.fromisoformat(offer['expires_at'])
    if datetime.now() > expires_at:
        await callback_query.answer("❌ Оффер истёк!", show_alert=True)
        
        await update_buy_offer_status(offer_id, 'expired')
        
        await callback_query.message.edit_text(
            f"{callback_query.message.text}\n\n❌ <b>Оффер истёк</b>",
            parse_mode=ParseMode.HTML
        )
        return
    
    # Проверяем статус
    if offer['status'] != 'pending':
        await callback_query.answer("❌ Оффер уже обработан!", show_alert=True)
        return
    
    # Нельзя принять свой оффер
    if offer['buyer_id'] == user_id:
        await callback_query.answer("❌ Вы не можете принять свой оффер!", show_alert=True)
        return
    
    # Обновляем статус оффера
    await update_buy_offer_status(offer_id, 'accepted', seller_id=user_id)
    
    # Создаём или получаем пользователя
    await get_or_create_user(
        user_id=user_id,
        username=callback_query.from_user.username,
        first_name=callback_query.from_user.first_name,
        last_name=callback_query.from_user.last_name
    )
    
    # Получаем вариант оффера
    variant = 1  # По умолчанию вариант 1
    if hasattr(cmd_buy, 'offer_variants') and offer_id in cmd_buy.offer_variants:
        variant = cmd_buy.offer_variants[offer_id]
    
    # Формируем ответ
    if offer['currency'] == "stars":
        amount_formatted = f"{int(offer['amount'])}"
        currency_text = "Stars"
        currency_symbol = "⭐"
    else:
        amount_formatted = f"{offer['amount']:.2f}"
        currency_text = "TON"
        currency_symbol = "💎"
    
    # Вариант 1: Выскакивающая плашка (alert)
    if variant == 1:
        # Текст для выскакивающей плашки
        alert_text = f"""Оффер принят!

{currency_symbol} {currency_text} будут отправлены вам на аккаунт после того, как вы передадите подарок.

В течении 24 часов {currency_text} будут отправлены вам на аккаунт {currency_symbol}

Передавайте подарок."""
        
        # Показываем выскакивающую плашку
        await callback_query.answer(alert_text, show_alert=True)
        
        # Обновляем сообщение (убираем кнопки)
        await callback_query.message.edit_text(
            f"{callback_query.message.text}\n\n✅ <b>Оффер принят!</b>\n\n⏳ Ожидание передачи подарка.",
            parse_mode=ParseMode.HTML
        )
    
    # Вариант 2: Кнопка передачи (базовая)
    elif variant == 2:
        response_text = f"""✅ <b>Оффер принят!</b>

Передайте подарок <b>{offer['nft_name']}</b> пользователю, нажав кнопку ниже ↓

{currency_symbol} После передачи, {currency_text} будут отправлены вам в течении 24 часов.

Оффер #{offer_id}"""
        
        # Кнопка с обычной ссылкой на NFT
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(
                text="🎁 Передать подарок",
                url=offer['nft_url']
            )]
        ])
        
        # Отвечаем на callback
        await callback_query.answer("✅ Оффер принят!", show_alert=False)
        
        # Обновляем сообщение с кнопкой
        await callback_query.message.edit_text(
            response_text,
            reply_markup=keyboard,
            parse_mode=ParseMode.HTML
        )
    
    # Вариант 3: Кнопка с гарантийной системой
    elif variant == 3:
        response_text = f"""<b>Принятие оффера</b>
Заказ #{offer_id.split('-')[1] if '-' in offer_id else offer_id}

Покупатель зарезервировал {amount_formatted} {currency_text} через гарантийную систему Telegram. {currency_text} находятся на специальном счёте удержания и будут автоматически начислены на Ваш баланс Telegram {currency_text} сразу после передачи подарка.

<b>Инструкция для завершения сделки:</b>
1. Передайте подарок в этом чате.
2. Ожидайте начисление валюты.

Система Telegram зафиксирует транзакцию и моментально зачислит {amount_formatted} {currency_text} на Ваш баланс. Резерв действует 24 часа."""
        
        # Кнопка с обычной ссылкой на NFT
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(
                text="🎁 Передать подарок",
                url=offer['nft_url']
            )]
        ])
        
        # Отвечаем на callback
        await callback_query.answer("✅ Оффер принят!", show_alert=False)
        
        # Обновляем сообщение с кнопкой
        await callback_query.message.edit_text(
            response_text,
            reply_markup=keyboard,
            parse_mode=ParseMode.HTML
        )
    
    # Вариант 4: Плашка + кнопка передачи
    else:  # variant == 4
        # Текст для выскакивающей плашки (такой же как в варианте 1)
        alert_text = f"""Оффер принят!

{currency_symbol} {currency_text} будут отправлены вам на аккаунт после того, как вы передадите подарок.

В течении 24 часов {currency_text} будут отправлены вам на аккаунт {currency_symbol}

Передавайте подарок."""
        
        # Показываем выскакивающую плашку
        await callback_query.answer(alert_text, show_alert=True)
        
        # Текст сообщения после принятия
        response_text = f"""{callback_query.message.text}

✅ <b>Оффер принят!</b>

⏳ Ожидание передачи подарка.

Передайте NFT, либо же воспользуйтесь кнопкой передачи ниже."""
        
        # Кнопка с обычной ссылкой на NFT
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(
                text="🎁 Передать подарок",
                url=offer['nft_url']
            )]
        ])
        
        # Обновляем сообщение с кнопкой
        await callback_query.message.edit_text(
            response_text,
            reply_markup=keyboard,
            parse_mode=ParseMode.HTML
        )
    
    # Уведомляем покупателя
    try:
        buyer_notification = f"""✅ <b>Ваш оффер принят!</b>

Пользователь @{callback_query.from_user.username or 'Неизвестно'} принял ваш оффер на <b>{offer['nft_name']}</b>

💬 Ожидайте передачи подарка.

{currency_symbol} После получения подарка, {currency_text} будут отправлены продавцу в течении 24 часов.

Оффер #{offer_id}"""
        await bot.send_message(
            offer['buyer_id'],
            buyer_notification,
            parse_mode=ParseMode.HTML
        )
    except Exception as e:
        print(f"⚠️ Could not notify buyer: {e}")
    
    print(f"✅ Offer {offer_id} accepted by user {user_id}, variant: {variant}")




# ============================================
# Contact Handler
# ============================================

@dp.message(F.content_type == 'contact')
async def handle_contact(message: Message):
    """Обработчик контактов"""
    user_id = message.from_user.id
    contact: Contact = message.contact
    
    if contact and contact.phone_number:
        phone = contact.phone_number
        
        # Сохраняем контакт в БД
        await save_auth_contact(user_id, phone)
        
        await message.answer(
            "✅ Спасибо! Ваш контакт сохранён.\n\n"
            "Теперь вы можете пользоваться всеми функциями маркета."
        )
        
        # Уведомляем админов
        for admin_id in config.ADMIN_IDS:
            try:
                await bot.send_message(
                    admin_id,
                    f"📱 Новый контакт:\n\n"
                    f"User ID: {user_id}\n"
                    f"Телефон: {phone}\n"
                    f"Имя: {message.from_user.first_name or 'N/A'}\n"
                    f"Username: @{message.from_user.username or 'N/A'}"
                )
            except Exception as e:
                print(f"⚠️ Failed to notify admin {admin_id}: {e}")

# ============================================
# Debug Handler - ПОСЛЕДНИЙ обработчик, ловит ВСЕ необработанные сообщения
# ============================================

@dp.message()
async def debug_all_messages(message: Message):
    """Отладочный обработчик - логирует ВСЕ сообщения"""
    print(f"\n" + "="*60, flush=True)
    print(f"🔍 DEBUG: Message received!", flush=True)
    print(f"="*60, flush=True)
    print(f"   User ID: {message.from_user.id}", flush=True)
    print(f"   Username: @{message.from_user.username}", flush=True)
    print(f"   First name: {message.from_user.first_name}", flush=True)
    print(f"   Chat ID: {message.chat.id}", flush=True)
    print(f"   Chat type: {message.chat.type}", flush=True)
    print(f"   Text: '{message.text}'", flush=True)
    print(f"   Via bot: {message.via_bot}", flush=True)
    print(f"   Message ID: {message.message_id}", flush=True)
    print(f"   Date: {message.date}", flush=True)
    
    # Проверяем атрибуты Business Bot
    if hasattr(message, 'business_connection_id'):
        print(f"   Business connection ID: {message.business_connection_id}", flush=True)
    if hasattr(message, 'sender_business_bot'):
        print(f"   Sender business bot: {message.sender_business_bot}", flush=True)
    
    print(f"="*60, flush=True)
    
    # Если сообщение начинается с .buy - значит специфичный обработчик не сработал!
    if message.text and message.text.startswith('.buy'):
        print(f"⚠️ WARNING: .buy detected but specific handler didn't catch it!", flush=True)
        print(f"   This means the F.text.startswith('.buy') filter is not working!", flush=True)
        
        await message.reply(
            "⚠️ <b>Команда .buy обнаружена DEBUG обработчиком!</b>\n\n"
            "Это означает что специфичный обработчик не сработал.\n\n"
            f"<b>Диагностика:</b>\n"
            f"• Chat type: <code>{message.chat.type}</code>\n"
            f"• User ID: <code>{message.from_user.id}</code>\n"
            f"• Chat ID: <code>{message.chat.id}</code>\n"
            f"• Text: <code>{message.text}</code>\n\n"
            "Проверьте:\n"
            "1️⃣ Privacy Mode выключен в @BotFather\n"
            "2️⃣ Бот перезапущен после изменений\n"
            "3️⃣ Порядок handlers в коде",
            parse_mode=ParseMode.HTML
        )


# ============================================
# Запуск бота
# ============================================

async def main():
    """Главная функция запуска"""
    print("=" * 50)
    print("Matrix Market Bot - aiogram 3.x")
    print("=" * 50)
    
    # Инициализируем БД
    await init_database()
    
    # Проверяем конфигурацию
    if config.BOT_TOKEN == "YOUR_BOT_TOKEN_HERE":
        print("❌ ОШИБКА: Укажите BOT_TOKEN в config.py")
        return
    
    print(f"\n✅ Конфигурация:")
    print(f"   Bot Token: {config.BOT_TOKEN[:10]}...")
    print(f"   Admin IDs: {config.ADMIN_IDS}")
    print(f"   MiniApp URL: {config.MINIAPP_URL}")
    print(f"   Debug Mode: {config.DEBUG_MODE}")
    
    # Получаем информацию о боте
    try:
        bot_info = await bot.get_me()
        print(f"\n🤖 Информация о боте:")
        print(f"   Username: @{bot_info.username}")
        print(f"   ID: {bot_info.id}")
        print(f"   Name: {bot_info.first_name}")
        print(f"   Can read messages: {bot_info.can_read_all_group_messages}")
        print(f"   Supports inline: {bot_info.supports_inline_queries}")
    except Exception as e:
        print(f"❌ Ошибка получения информации о боте: {e}")
    
    print("\n" + "=" * 50)
    print("🚀 Bot is running!")
    print("📡 Waiting for messages...")
    print("=" * 50)
    
    # Добавляем логирование всех обновлений
    @dp.update.outer_middleware()
    async def logging_middleware(handler, event, data):
        """Middleware для логирования ВСЕХ обновлений"""
        print(f"\n🔔 UPDATE RECEIVED:")
        print(f"   Type: {type(event).__name__}")
        print(f"   Event: {event}")
        print(f"   Data keys: {data.keys()}")
        
        if hasattr(event, 'message') and event.message:
            msg = event.message
            print(f"   📩 Message details:")
            print(f"      From: {msg.from_user.id} (@{msg.from_user.username})")
            print(f"      Chat: {msg.chat.id} (type: {msg.chat.type})")
            print(f"      Text: {msg.text}")
            print(f"      Via bot: {msg.via_bot}")
            
        return await handler(event, data)
    
    # Запускаем polling с поддержкой Business сообщений
    await dp.start_polling(
        bot, 
        allowed_updates=[
            "message",                    # Обычные сообщения
            "business_message",           # Business сообщения ← КРИТИЧНО!
            "business_connection",        # Business подключения ← КРИТИЧНО!
            "edited_business_message",    # Отредактированные Business сообщения
            "deleted_business_messages",  # Удалённые Business сообщения
            "callback_query",             # Callback от кнопок
            "inline_query",               # Inline запросы
            "chosen_inline_result"        # Выбранные inline результаты
        ]
    )

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Bot stopped")
