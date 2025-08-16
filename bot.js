const { default: makeWASocket, fetchLatestBaileysVersion, DisconnectReason, useSingleFileAuthState, MessageType } = require("@adiwajshing/baileys");
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

    sock.ev.on('creds.update', saveState);

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if(!msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const grupos = JSON.parse(fs.readFileSync(GRUPOS_FILE, 'utf-8'));
            const anuncios = JSON.parse(fs.readFileSync(ANUNCIOS_FILE, 'utf-8'));

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
                    const url = a.link_midia;
                    if(url.match(/\.(jpg|jpeg|png|gif)$/i)){
                        await sock.sendMessage(from, { image: { url }, caption: text });
                    } else if(url.match(/\.(mp4|mov|webm)$/i)){
                        await sock.sendMessage(from, { video: { url }, caption: text });
                    } else {
                        await sock.sendMessage(from, { text: text + "\n" + url });
                    }
                } else {
                    await sock.sendMessage(from, { text });
                }

                console.log(`Anúncio "${a.titulo}" enviado para ${from}`);
            }

            ultimoEnvio[from] = agora;

        } catch(e){
            console.error('Erro ao enviar anúncio: ', e);
        }
    });
}

start();