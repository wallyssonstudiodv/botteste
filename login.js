const { default: makeWASocket, fetchLatestBaileysVersion, DisconnectReason, useSingleFileAuthState } = require("@adiwajshing/baileys");
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const SESSION_FILE = './session.json';
const { state, saveState } = useSingleFileAuthState(SESSION_FILE);

async function start() {
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({ auth: state, version });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrcode.generate(qr, { small: true });
            console.log("Escaneie o QR Code acima com seu WhatsApp");
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error)?.output?.statusCode;
            if (statusCode !== DisconnectReason.loggedOut) {
                console.log("Reconectando...");
                start();
            } else {
                console.log('Sessão desconectada, faça login novamente.');
            }
        } else if (connection === 'open') {
            console.log('Conectado com sucesso!');
        }
    });

    sock.ev.on('creds.update', saveState);
}

start();