function ab2b64(buf) {
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

function b642ab(b64) {
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

const socket = io();
let privateKey = null;
let publicKeyB64 = null;
let myName = null;
let selectedUser = null;
let userList = {};

function log(msg) {
    const el = document.getElementById('log');
    el.textContent += msg + '\n';
    el.scrollTop = el.scrollHeight;
}

async function generateKeypair() {
    const keyPair = await window.crypto.subtle.generateKey(
        { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
        true,
        ['encrypt', 'decrypt']
    );
    privateKey = keyPair.privateKey;
    const spki = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    publicKeyB64 = ab2b64(spki);
}

async function importPublicKeyFromB64(spki_b64) {
    const ab = b642ab(spki_b64);
    return await window.crypto.subtle.importKey('spki', ab, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
}

async function encryptForUser(pubkey_b64, plainText) {
    const pubKey = await importPublicKeyFromB64(pubkey_b64);
    const enc = new TextEncoder().encode(plainText);
    const cipher = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, pubKey, enc);
    return ab2b64(cipher);
}

async function decryptMessage(cipher_b64) {
    if (!privateKey) throw new Error('No private key');
    const cipherAb = b642ab(cipher_b64);
    const plainAb = await window.crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, cipherAb);
    return new TextDecoder().decode(plainAb);
}

document.getElementById('btnRegister').addEventListener('click', async () => {
    const name = document.getElementById('username').value.trim();
    if (!name) { alert('Enter username'); return; }
    myName = name;
    await generateKeypair();
    socket.emit('register', { username: myName, public_key: publicKeyB64 });
    log('Generated keypair and registered as: ' + myName);
});

socket.on('connect', () => { log('Connected to server'); });

socket.on('user_list', (list) => {
    userList = {};
    const usersDiv = document.getElementById('users');
    usersDiv.innerHTML = '';
    list.forEach(u => {
        if (u.username === myName) return;
        userList[u.username] = { public_key: u.public_key };
        const d = document.createElement('div');
        d.textContent = u.username;
        d.className = 'user';
        d.onclick = () => {
            document.querySelectorAll('.user').forEach(x => x.classList.remove('selected'));
            d.classList.add('selected');
            selectedUser = u.username;
            log('Selected user: ' + selectedUser);
        };
        usersDiv.appendChild(d);
    });
});

socket.on('private_message', async (data) => {
    try {
        const decrypted = await decryptMessage(data.payload);
        log('[Encrypted message] from ' + data.from + ': ' + decrypted);
    } catch (e) {
        log('Failed to decrypt message from ' + data.from);
        console.error(e);
    }
});

async function sendMessage() {
    const messageInput = document.getElementById('message');
    const msg = messageInput.value;
    if (!msg) return;
    
    if (!selectedUser) { alert('Select a recipient'); return; }
    const recipient = userList[selectedUser];
    if (!recipient) { alert('Recipient public key not found'); return; }
    
    try {
        const cipherB64 = await encryptForUser(recipient.public_key, msg);
        socket.emit('send_message', { to: selectedUser, payload: cipherB64, from: myName });
        log('[You -> ' + selectedUser + ']: ' + msg + ' (sent encrypted)');
        messageInput.value = '';
    } catch (e) {
        console.error(e);
        alert('Encryption failed');
    }
}

document.getElementById('btnSend').addEventListener('click', sendMessage);

document.getElementById('message').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});