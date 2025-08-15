const { 
    default: makeWASocket, 
    useSingleFileAuthState, 
    fetchLatestBaileysVersion, 
    DisconnectReason, 
    makeInMemoryStore 
} = require("@whiskeysockets/baileys");
const qrcode = require('qrcode-terminal');

const SESSION_FILE = './session.json';
const { state, saveState } = useSingleFileAuthState(SESSION_FILE);

async function start() {
    // Buscar a versão mais recente do WhatsApp Web
    const { version } = await fetchLatestBaileysVersion();

    // Criar o socket
    const sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: false
    });

    // Eventos de conexão
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrcode.generate(qr, { small: true });
            console.log("Escaneie o QR Code acima com seu WhatsApp");
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect.error)?.output?.statusCode;
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

    // Salvar credenciais sempre que forem atualizadas
    sock.ev.on('creds.update', saveState);
}

start();