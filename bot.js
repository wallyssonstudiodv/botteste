import { default as makeWASocket, useSingleFileAuthState, DisconnectReason } from '@adiwajshing/baileys';
import fs from 'fs';
import QRCode from 'qrcode';
import schedule from 'node-schedule';
import axios from 'axios';

const { state, saveState } = useSingleFileAuthState('./auth_info.json');
let sock;

async function startBot(){
    sock = makeWASocket({ auth: state, printQRInTerminal: false });
    sock.ev.on('creds.update', saveState);

    sock.ev.on('connection.update', async (update)=>{
        const { connection, qr, lastDisconnect } = update;

        if(qr){
            const qrImg = await QRCode.toDataURL(qr);
            fs.writeFileSync('qr_code.txt', qrImg);
        }

        if(connection==='open'){
            // Listar grupos
            const chats = await sock.groupFetchAllParticipating();
            const grupos = Object.values(chats).map(g => ({ id: g.id, subject: g.subject }));
            fs.writeFileSync('grupos.json', JSON.stringify(grupos, null, 2));
        }

        if(connection==='close'){
            if((lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut){
                startBot();
            }
        }
    });

    scheduleJobs();
}

function scheduleJobs(){
    if(!fs.existsSync('anuncios.json')) return;
    const anuncios = JSON.parse(fs.readFileSync('anuncios.json', 'utf-8'));
    anuncios.forEach(anuncio=>{
        if(anuncio.active){
            schedule.scheduleJob(anuncio.schedule, async ()=>{
                const { text, images, grupos } = anuncio;
                try{
                    for(const groupId of grupos){
                        if(images && images.length>0){
                            for(const img of images){
                                const buffer = (await axios.get(img,{responseType:'arraybuffer'})).data;
                                await sock.sendMessage(groupId,{image:buffer,caption:text});
                            }
                        } else {
                            await sock.sendMessage(groupId,{text});
                        }
                    }
                    console.log('Anúncio enviado para grupos:', anuncio.id);
                }catch(err){console.log('Erro:',err)}
            });
        }
    });
}

startBot();