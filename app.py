from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*')

users = {}

@app.route('/')
def index():
    return render_template("index.html")

@socketio.on('register')
def handle_register(data):
    username = data.get('username')
    public_key = data.get('public_key')
    sid = request.sid
    if not username or not public_key:
        emit('error', {'msg': 'username and public_key required'})
        return
    users[username] = {'sid': sid, 'public_key': public_key}
    user_list = [{'username': u, 'public_key': users[u]['public_key']} for u in users]
    socketio.emit('user_list', user_list)
    print(f"Registered user: {username} (sid={sid})")

@socketio.on('send_message')
def handle_send_message(data):
    to = data.get('to')
    payload = data.get('payload')
    frm = data.get('from')
    if not to or not payload:
        emit('error', {'msg': 'to and payload required'})
        return
    if to not in users:
        emit('error', {'msg': 'recipient not found'})
        return
    target_sid = users[to]['sid']
    socketio.emit('private_message', {'from': frm, 'payload': payload}, room=target_sid)
    print(f"Forwarded message from {frm} to {to}")

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    to_remove = None
    for u, info in list(users.items()):
        if info['sid'] == sid:
            to_remove = u
            del users[u]
            break
    if to_remove:
        print(f"User disconnected: {to_remove}")
        user_list = [{'username': u, 'public_key': users[u]['public_key']} for u in users]
        socketio.emit('user_list', user_list)

if __name__ == '__main__':
    print('Starting app on http://localhost:5000')
    socketio.run(app, host='0.0.0.0', port=5000)
