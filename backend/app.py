import sqlite3
import json
import time
from threading import Lock
import datetime
import jwt
from functools import wraps
from flask import Flask, request,stream_with_context,Response, jsonify, abort, make_response, redirect, url_for, send_from_directory
import requests
from config import service_token, secure_key, app_id, website_address, JWT_SECRET, admins

app = Flask(__name__)

DATABASE = './queue.db'

connections = []  # List of active SSE connections
connections_lock = Lock()

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS queues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS queue_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            queue_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (queue_id) REFERENCES queues (id)
        )
    ''')
    conn.commit()
    conn.close()

def auth_check(token):
    response = requests.get(
        f'https://api.vk.com/method/secure.checkToken?token={token}&client_secret={secure_key}&access_token={service_token}&v=5.126'
    )
    try:
        json_response = response.json()
        if json_response.get('response'):
            return {'valid': True, 'user_id': json_response['response']['user_id']}
        else:
            return {'valid': False, 'error': json_response.get('error', 'Auth failed')}
    except requests.exceptions.RequestException as e:
        return {'valid': False, 'error': f'Network error: {e}'}
    except json.JSONDecodeError as e:
        return {'valid': False, 'error': f'JSON decoding error: {e}'}

def use_guard(f):
    @wraps(f)
    def decorated_function(*args, **kws):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Authorization token required'}), 401
        token = token.replace('Bearer ', '')
        auth_result = auth_check(token)
        if not auth_result['valid']:
            return jsonify({'error': auth_result['error']}), 401
        return f(auth_result['user_id'], *args, **kws)
    return decorated_function

def get_user_role(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT role FROM users WHERE id = ?", (user_id,))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else 0  # 0 - default role if user not found

def answer_template(data=None, error=None, meta=None, code=200):
    answer = {'data': data, 'error': error, 'meta': meta}
    return jsonify(answer), code


@app.route('/api/code', methods=['GET'])
def register():
    code = request.args.get('code')
    if code:
        response = requests.get(
            f'https://oauth.vk.com/access_token?client_id={app_id}&client_secret={secure_key}&redirect_uri={website_address}&code={code}&v=5.126'
        )
        try:
            data = response.json()
            if data.get('access_token'):
                token = data['access_token']
                user_data = requests.get(
                    f"https://api.vk.com/method/users.get?access_token={token}&fields=photo_100&v=5.126"
                ).json()
                user_id = user_data['response'][0]['id']
                jwt_token = jwt.encode({'user_id': user_id}, JWT_SECRET, algorithm='HS256')
                resp = make_response(redirect(url_for('index_page')))
                resp.set_cookie('token', jwt_token)
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("INSERT OR IGNORE INTO users (id, role) VALUES (?, ?)", (user_id, 0)) # IGNORE - для предотвращения повторной записи.
                if user_id in admins:
                    cursor.execute("UPDATE users SET role = 1 WHERE id = ?", (user_id,))
                conn.commit()
                conn.close()
                return resp
            return answer_template(error='Invalid code', code=400)
        except (requests.exceptions.RequestException, json.JSONDecodeError) as e:
            return answer_template(error=f'Error during registration: {e}', code=500)

    return answer_template(error='Code not provided', code=400)

@app.route('/api/authcheck', methods=['GET'])
@use_guard
def auth_check_api(user_id):
    return answer_template(data={'auth': True})

@app.route('/login')
def login():
    return redirect(
        f"https://oauth.vk.com/authorize?client_id={app_id}&display=page&redirect_uri={website_address}&scope=offline&response_type=code&v=5.126",
        code=302
    )


# Helper to notify SSE connections
def notify_connections(queue_id):
    with connections_lock:
        for conn in connections:
            conn.put(json.dumps({"queueId": queue_id}))

@app.route('/api/queues', methods=['POST'])
def create_queue():
    data = request.json
    name = data.get('name')
    if not name:
        return jsonify({"error": "Queue name is required"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO queues (name) VALUES (?)', (name,))
    queue_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({"data": {"queue_id": queue_id}}), 201

@app.route('/api/queues', methods=['GET'])
def list_queues():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM queues')
    queues = cursor.fetchall()
    result = []
    for queue in queues:
        cursor.execute('SELECT * FROM queue_entries WHERE queue_id = ?', (queue['id'],))
        members = cursor.fetchall()
        result.append({"id": queue['id'], "name": queue['name'], "members": [dict(member) for member in members]})
    conn.close()
    return jsonify({"data": result})

@app.route('/api/queues/<int:queue_id>/join', methods=['POST'])
def join_queue(queue_id):
    user_id = request.json.get('user_id')
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO queue_entries (queue_id, user_id) VALUES (?, ?)', (queue_id, user_id))
    entry_id = cursor.lastrowid
    conn.commit()
    conn.close()

    notify_connections(queue_id)

    return jsonify({"data": {"entry_id": entry_id}}), 201

@app.route('/api/queues/<int:queue_id>/leave', methods=['DELETE'])
def leave_queue(queue_id):
    user_id = request.json.get('user_id')
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM queue_entries WHERE queue_id = ? AND user_id = ?', (queue_id, user_id))
    conn.commit()
    conn.close()

    notify_connections(queue_id)

    return jsonify({"data": "Left queue"}), 200

@app.route('/api/queues/<int:queue_id>/skip', methods=['POST'])
def skip_turn(queue_id):
    user_id = request.json.get('user_id')
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM queue_entries WHERE queue_id = ? AND user_id = ?', (queue_id, user_id))
    entry = cursor.fetchone()
    if not entry:
        conn.close()
        return jsonify({"error": "Entry not found"}), 404

    cursor.execute('DELETE FROM queue_entries WHERE id = ?', (entry['id'],))
    cursor.execute('INSERT INTO queue_entries (queue_id, user_id, timestamp) VALUES (?, ?, ?)',
                   (queue_id, user_id, entry['timestamp']))
    conn.commit()
    conn.close()

    notify_connections(queue_id)

    return jsonify({"data": "Skipped turn"}), 200

@app.route('/api/queues/<int:queue_id>/swap', methods=['POST'])
def swap_turn(queue_id):
    user_id = request.json.get('user_id')
    target_entry_id = request.json.get('target_entry_id')

    if not user_id or not target_entry_id:
        return jsonify({"error": "Missing parameters"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM queue_entries WHERE id = ? AND queue_id = ?', (target_entry_id, queue_id))
    target_entry = cursor.fetchone()
    if not target_entry:
        conn.close()
        return jsonify({"error": "Target entry not found"}), 404

    cursor.execute('UPDATE queue_entries SET user_id = ? WHERE id = ?', (target_entry['user_id'], target_entry_id))
    cursor.execute('INSERT INTO queue_entries (queue_id, user_id, timestamp) VALUES (?, ?, ?)',
                   (queue_id, user_id, target_entry['timestamp']))
    conn.commit()
    conn.close()

    notify_connections(queue_id)

    return jsonify({"data": "Swapped places"}), 200

@app.route('/api/queue/updates', methods=['GET'])
def queue_updates():
    def stream():
        q = Queue()
        with connections_lock:
            connections.append(q)
        try:
            while True:
                update = q.get()
                yield f"data: {update}\n\n"
        finally:
            with connections_lock:
                connections.remove(q)

    return Response(stream_with_context(stream()), content_type='text/event-stream')

init_db()

if __name__ == '__main__':
    app.run(debug=True)
