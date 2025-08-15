const { 
    default: makeWASocket, 
    useSingleFileAuthState, 
    fetchLatestBaileysVersion, 
    DisconnectReason 
} = require("@whiskeysockets/baileys");
const fs = require('fs');

const SESSION_FILE = './session.json';
const ANUNCIOS_FILE = './anuncios.json';
const GRUPOS_FILE = './grupos.json';
const INTERVALO = 2 * 60 * 60 * 1000; // 2 horas

const { state, saveState } = useSingleFileAuthState(SESSION_FILE);
let ultimoEnvio = {}; // { "grupoId": timestamp }

async function start() {
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({ auth: state, version });

    // Conexão
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === 'close'){
            const statusCode = (lastDisconnect.error)?.output?.statusCode;
            if(statusCode !== DisconnectReason.loggedOut){
                console.log("Reconectando...");
                start();
            } else {
                console.log('Sessão desconectada, faça login novamente.');
            }
        } else if(connection === 'open'){
            console.log('Conectado ao WhatsApp');
        }
    });

    // Salvar credenciais
    sock.ev.on('creds.update', saveState);

    // Receber mensagens e disparar anúncios
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if(!msg.message || msg.key.fromMe) return; // Ignorar mensagens próprias

            const from = msg.key.remoteJid;

            const grupos = JSON.parse(fs.readFileSync(GRUPOS_FILE));
            const anuncios = JSON.parse(fs.readFileSync(ANUNCIOS_FILE));

            const grupoAtivo = grupos.find(g => g.id === from);
            if(!grupoAtivo) return;

            const agora = Date.now();
            if(ultimoEnvio[from] && (agora - ultimoEnvio[from] < INTERVALO)){
                console.log(`Grupo ${from} aguardando intervalo para enviar anúncios`);
                return;
            }

            for(let a of anuncios){
                if(a.ativo != 1) continue;

                let text = a.mensagem || '';
                if(a.link_midia){
                    if(a.link_midia.match(/\.(jpg|jpeg|png|gif)$/i)){
                        await sock.sendMessage(from, { image: { url: a.link_midia }, caption: text });
                    } else if(a.link_midia.match(/\.(mp4|mov|webm)$/i)){
                        await sock.sendMessage(from, { video: { url: a.link_midia }, caption: text });
                    } else {
                        await sock.sendMessage(from, { text: text + "\n" + a.link_midia });
                    }
                } else {
                    await sock.sendMessage(from, { text });
                }
                console.log(`Anúncio "${a.titulo}" enviado para ${from}`);
            }

            ultimoEnvio[from] = agora;

        } catch(e){
            console.log('Erro ao enviar anúncio: ', e);
        }
    });
}

start();