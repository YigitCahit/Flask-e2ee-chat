# Flask + Socket.IO End-to-End Encrypted Chat Demo

This project enables **end-to-end encrypted (E2EE) messaging** by encrypting messages on the browser side in a web chat application. It uses **Flask** and **Flask-SocketIO** on the backend, and the **Web Crypto API** in the browser to generate RSA key pairs and encrypt/decrypt messages.

The server never sees private keys or plaintext messages — it only forwards encrypted payloads and public keys.

---

## Features

* 🔑 **Key Generation:** Each client generates an RSA keypair in the browser.
* 📡 **Registration:** Clients register their username and public key with the server.
* 👥 **User List Sync:** Server maintains and broadcasts the list of online users and their public keys.
* ✉️ **Encrypted Messaging:** Messages are encrypted with the recipient’s public key and decrypted locally.
* 🛡️ **Server as Relay:** The server only relays ciphertext and public keys — it cannot decrypt messages.

---

## Project Structure

```
.
├── app.py          # Flask + Socket.IO server
├── templates/
│   └── index.html  # Frontend UI
├── static/
│   ├── script.js   # Client-side encryption, messaging, UI logic
│   └── style.css   # Stylesheet
```

---

## Requirements

* Python 3.8+
* Node.js not required (pure Flask + vanilla JS)

### Python Dependencies

Install with:

```bash
pip install flask flask-socketio
```

---

## Running the App

1. Clone this repository.
2. Install dependencies:

   ```bash
   pip install flask flask-socketio
   ```
3. Run the Flask app:

   ```bash
   python app.py
   ```
4. Open [http://localhost:5000](http://localhost:5000) in multiple browser tabs/windows to simulate multiple users.

---

## Usage

1. Enter a **username** and click **Register / Generate Keypair**.

   * This generates an RSA keypair in your browser.
   * The public key is sent to the server.
   * The private key never leaves your browser.
2. Select a user from the **Users list**.
3. Type a message and click **Send to selected user**.

   * The message is encrypted with the recipient’s public key before being sent.
   * The server relays the ciphertext to the recipient.
   * The recipient decrypts it with their private key locally.

---

## License

MIT License — feel free to use, modify, and experiment.
