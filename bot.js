const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    jidNormalizedUser,
    delay
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuração otimizada para Termux
const logger = pino({ 
    level: 'warn', // Reduzir logs para economizar recursos
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: false // Desabilitar cores para compatibilidade
        }
    }
});

// Interface para entrada do usuário no terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let sock;
let isConnected = false;
let messageCount = 0;
let userStats = {};

// Função para exibir QR Code no terminal (compatível com Termux)
function displayQR(qr) {
    console.clear();
    console.log('╔════════════════════════════════════════╗');
    console.log('║        BOT WHATSAPP - TERMUX           ║');
    console.log('╠════════════════════════════════════════╣');
    console.log('║                                        ║');
    console.log('║  📱 Abra o WhatsApp no seu celular     ║');
    console.log('║  📷 Vá em Configurações > Aparelhos    ║');
    console.log('║  🔗 Toque em "Conectar um aparelho"    ║');
    console.log('║  📸 Escaneie o QR Code abaixo:         ║');
    console.log('║                                        ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('\n' + qr + '\n');
    console.log('⏳ Aguardando escaneamento...\n');
}

async function connectToWhatsApp() {
    try {
        // Buscar versão mais recente (otimizado para Termux)
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`📱 Usando versão do WhatsApp: ${version}, é a mais recente: ${isLatest}`);

        // Configurar autenticação
        const { state, saveCreds } = await useMultiFileAuthState('./auth_session');
        
        // Configuração do socket otimizada para Termux
        sock = makeWASocket({
            version,
            logger,
            printQRInTerminal: false, // Customizado para Termux
            auth: state,
            browser: ['Termux Bot', 'Android', '1.0.0'],
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: false, // Economizar recursos
            getMessage: async (key) => {
                return { conversation: 'Bot Message' };
            },
            defaultQueryTimeoutMs: 60000, // Timeout maior para conexões lentas
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
            // Configurações específicas para ambiente limitado
            shouldSyncHistoryMessage: false,
            emitOwnEvents: false,
            fireInitQueries: true,
            shouldIgnoreJid: jid => jid === 'status@broadcast'
        });

        // Salvar credenciais
        sock.ev.on('creds.update', saveCreds);

        // Gerenciar estados de conexão
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                displayQR(qr);
            }
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                
                console.log('\n🔌 Conexão fechada:', lastDisconnect?.error?.output?.statusCode);
                
                if (shouldReconnect) {
                    console.log('🔄 Tentando reconectar em 5 segundos...');
                    await delay(5000);
                    connectToWhatsApp();
                } else {
                    console.log('❌ Bot desconectado. Execute novamente para reconectar.');
                    process.exit(0);
                }
            } else if (connection === 'open') {
                isConnected = true;
                console.clear();
                displayWelcomeMessage();
                startInteractiveMode();
            }
        });

        // Processar mensagens recebidas
        sock.ev.on('messages.upsert', async (m) => {
            try {
                const msg = m.messages[0];
                
                if (!msg.message || msg.key.fromMe || !isConnected) return;
                
                // Filtrar tipos de mensagem suportados
                const messageType = Object.keys(msg.message)[0];
                if (!['conversation', 'extendedTextMessage'].includes(messageType)) return;
                
                await handleIncomingMessage(msg);
                
            } catch (error) {
                console.log('❌ Erro ao processar mensagem:', error.message);
            }
        });

    } catch (error) {
        console.error('❌ Erro ao conectar:', error.message);
        console.log('🔄 Tentando novamente em 10 segundos...');
        setTimeout(connectToWhatsApp, 10000);
    }
}

// Exibir mensagem de boas-vindas
function displayWelcomeMessage() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║     ✅ BOT CONECTADO COM SUCESSO!      ║');
    console.log('╠════════════════════════════════════════╣');
    console.log('║                                        ║');
    console.log('║  🤖 Bot WhatsApp está online!          ║');
    console.log('║  📱 Pronto para receber mensagens      ║');
    console.log('║  💬 Envie uma mensagem para testar     ║');
    console.log('║                                        ║');
    console.log('║  Comandos do terminal:                 ║');
    console.log('║  • help - Ver comandos                 ║');
    console.log('║  • status - Ver status                 ║');
    console.log('║  • stats - Estatísticas                ║');
    console.log('║  • clear - Limpar tela                 ║');
    console.log('║  • users - Ver usuários                ║');
    console.log('║  • restart - Reiniciar                 ║');
    console.log('║  • quit - Sair do bot                  ║');
    console.log('║                                        ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('\n📊 Status: ONLINE | Aguardando mensagens...\n');
}

// Modo interativo no terminal
function startInteractiveMode() {
    rl.setPrompt('Bot> ');
    rl.prompt();
    
    rl.on('line', async (input) => {
        const command = input.trim().toLowerCase();
        
        switch (command) {
            case 'help':
                console.log('\n📋 COMANDOS DISPONÍVEIS:');
                console.log('• help - Mostrar esta ajuda');
                console.log('• status - Ver status da conexão');
                console.log('• stats - Estatísticas detalhadas');
                console.log('• users - Ver usuários ativos');
                console.log('• clear - Limpar a tela');
                console.log('• restart - Reiniciar conexão');
                console.log('• memory - Ver uso de memória');
                console.log('• test - Testar bot');
                console.log('• quit - Sair do bot\n');
                break;
                
            case 'status':
                console.log(`\n📊 STATUS: ${isConnected ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
                console.log(`💾 Memória: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
                console.log(`⏱️ Uptime: ${formatUptime(process.uptime())}`);
                console.log(`💬 Mensagens processadas: ${messageCount}`);
                console.log(`👥 Usuários únicos: ${Object.keys(userStats).length}\n`);
                break;
                
            case 'stats':
                console.log('\n📈 ESTATÍSTICAS DETALHADAS:');
                console.log(`• Status: ${isConnected ? 'Online' : 'Offline'}`);
                console.log(`• Mensagens: ${messageCount}`);
                console.log(`• Usuários: ${Object.keys(userStats).length}`);
                console.log(`• Uptime: ${formatUptime(process.uptime())}`);
                console.log(`• Memória heap: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
                console.log(`• Memória total: ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`);
                console.log(`• RSS: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
                console.log(`• PID: ${process.pid}\n`);
                break;
                
            case 'users':
                console.log('\n👥 USUÁRIOS ATIVOS:');
                if (Object.keys(userStats).length === 0) {
                    console.log('Nenhum usuário interagiu ainda.\n');
                } else {
                    Object.entries(userStats).forEach(([user, data], index) => {
                        console.log(`${index + 1}. ${data.name} - ${data.messages} mensagens`);
                    });
                    console.log('');
                }
                break;
                
            case 'clear':
                console.clear();
                displayWelcomeMessage();
                break;
                
            case 'memory':
                const mem = process.memoryUsage();
                console.log('\n💾 USO DE MEMÓRIA:');
                console.log(`• RSS: ${Math.round(mem.rss / 1024 / 1024)}MB`);
                console.log(`• Heap Used: ${Math.round(mem.heapUsed / 1024 / 1024)}MB`);
                console.log(`• Heap Total: ${Math.round(mem.heapTotal / 1024 / 1024)}MB`);
                console.log(`• External: ${Math.round(mem.external / 1024 / 1024)}MB\n`);
                break;
                
            case 'test':
                console.log('\n🧪 TESTE DO SISTEMA:');
                console.log(`• Node.js: ${process.version} ✓`);
                console.log(`• Plataforma: ${process.platform} ✓`);
                console.log(`• Arquitetura: ${process.arch} ✓`);
                console.log(`• Diretório: ${process.cwd()} ✓`);
                console.log('• Baileys: Carregado ✓');
                console.log(`• Status: ${isConnected ? 'Conectado ✓' : 'Desconectado ✗'}\n`);
                break;
                
            case 'restart':
                console.log('🔄 Reiniciando conexão...');
                await sock?.end();
                setTimeout(connectToWhatsApp, 2000);
                break;
                
            case 'quit':
            case 'exit':
                console.log('👋 Encerrando bot...');
                await sock?.end();
                process.exit(0);
                break;
                
            default:
                if (input.trim()) {
                    console.log('❓ Comando não reconhecido. Digite "help" para ver os comandos.\n');
                }
        }
        
        rl.prompt();
    });
}

// Processar mensagens recebidas
async function handleIncomingMessage(msg) {
    try {
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const pushName = msg.pushName || 'Usuário';
        
        // Atualizar estatísticas
        messageCount++;
        if (!userStats[from]) {
            userStats[from] = { name: pushName, messages: 0 };
        }
        userStats[from].messages++;
        userStats[from].name = pushName; // Atualizar nome se mudou
        
        // Log otimizado para Termux
        const time = new Date().toLocaleTimeString('pt-BR');
        console.log(`[${time}] 📨 ${pushName}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
        
        // Processar comando
        const response = await processCommand(text.toLowerCase().trim(), pushName, from);
        
        if (response) {
            // Simular digitação de forma otimizada
            await sock.sendPresenceUpdate('composing', from);
            await delay(Math.min(response.length * 10, 3000)); // Delay proporcional ao tamanho
            
            await sock.sendMessage(from, { text: response });
            console.log(`[${time}] 📤 Resposta enviada para ${pushName}`);
        }
        
    } catch (error) {
        console.log('❌ Erro ao processar mensagem:', error.message);
    }
}

// Processar comandos (otimizado para Termux)
async function processCommand(text, userName, userJid) {
    const comando = text.replace(/[^\w\s]/gi, '').trim();
    
    switch (comando) {
        case 'oi':
        case 'ola':
        case 'hey':
        case 'start':
            return `👋 Olá, *${userName}*!\n\nSou um bot rodando no Termux! 📱\n\n` +
                   `🤖 Estou aqui para ajudar você.\n\n` +
                   `Digite *menu* para ver todos os comandos disponíveis.`;
            
        case 'menu':
        case 'ajuda':
        case 'help':
            return `📋 *MENU - BOT TERMUX*\n\n` +
                   `🔹 *oi* - Saudação inicial\n` +
                   `🔹 *menu* - Este menu\n` +
                   `🔹 *info* - Informações do bot\n` +
                   `🔹 *hora* - Horário atual\n` +
                   `🔹 *data* - Data de hoje\n` +
                   `🔹 *sistema* - Info do sistema\n` +
                   `🔹 *piada* - Piada aleatória\n` +
                   `🔹 *dica* - Dica útil\n` +
                   `🔹 *motivacao* - Frase motivacional\n` +
                   `🔹 *calc [expressão]* - Calculadora\n` +
                   `🔹 *perfil* - Seu perfil\n` +
                   `🔹 *ping* - Testar velocidade\n` +
                   `🔹 *contato* - Falar com admin\n\n` +
                   `_Bot rodando 24/7 no Termux! 🚀_`;
                   
        case 'info':
        case 'sobre':
            return `🤖 *BOT TERMUX INFO*\n\n` +
                   `📱 Plataforma: Android (Termux)\n` +
                   `⚡ Node.js: ${process.version}\n` +
                   `💾 Memória: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n` +
                   `⏱️ Uptime: ${formatUptime(process.uptime())}\n` +
                   `🔧 PID: ${process.pid}\n` +
                   `📊 Mensagens: ${messageCount}\n` +
                   `👥 Usuários: ${Object.keys(userStats).length}\n\n` +
                   `_Otimizado para dispositivos móveis!_`;
                   
        case 'hora':
            const agora = new Date();
            return `🕐 *Horário Atual*\n\n` +
                   `⏰ ${agora.toLocaleTimeString('pt-BR')}\n` +
                   `📍 Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}\n` +
                   `🌐 UTC: ${agora.toISOString()}`;
            
        case 'data':
            const hoje = new Date();
            return `📅 *Data de Hoje*\n\n` +
                   `${hoje.toLocaleDateString('pt-BR', {
                       weekday: 'long',
                       year: 'numeric',
                       month: 'long',
                       day: 'numeric'
                   })}\n\n` +
                   `📊 Dia do ano: ${getDayOfYear(hoje)}\n` +
                   `📝 Semana: ${getWeekNumber(hoje)}`;
                   
        case 'sistema':
            return `📊 *INFORMAÇÕES DO SISTEMA*\n\n` +
                   `🏗️ Arquitetura: ${process.arch}\n` +
                   `💻 Plataforma: ${process.platform}\n` +
                   `📁 Diretório: ${process.cwd().split('/').pop()}\n` +
                   `🔋 CPU Usage: ${process.cpuUsage().user}μs\n` +
                   `💾 RAM Usada: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n` +
                   `📈 RAM Total: ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB\n` +
                   `🎯 RSS: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`;
                   
        case 'perfil':
            const userMessages = userStats[userJid]?.messages || 0;
            return `👤 *SEU PERFIL*\n\n` +
                   `📛 Nome: ${userName}\n` +
                   `📱 Número: ${userJid.split('@')[0]}\n` +
                   `💬 Mensagens enviadas: ${userMessages}\n` +
                   `🏆 Nível: ${Math.floor(userMessages / 10) + 1}\n` +
                   `⭐ XP: ${userMessages * 10}\n` +
                   `📊 Ranking: ${getRanking(userJid)}\n\n` +
                   `_Continue conversando para subir de nível!_`;
                   
        case 'ping':
            const start = Date.now();
            return `🏓 *Pong!*\n\n` +
                   `⚡ Velocidade: ${Date.now() - start}ms\n` +
                   `📡 Status: Online\n` +
                   `🔄 Última reconexão: ${formatUptime(process.uptime())} atrás`;
                   
        case 'piada':
            const piadas = [
                '😄 Por que o Termux é tão legal?\nPorque roda Linux no Android! 🐧',
                '🤣 O que o bot falou pro Termux?\n"Você é meu terminal favorito!" 💚',
                '😂 Por que o programador usa Termux?\nPorque smartphone sem terminal é só... phone! 📱',
                '🤪 O que o Android falou pro iOS?\n"Pelo menos eu tenho Termux!" 🔥',
                '😆 Por que o bot nunca dorme?\nPorque tem wake-lock! ⏰'
            ];
            return piadas[Math.floor(Math.random() * piadas.length)];
            
        case 'dica':
            const dicas = [
                '💡 *Dica Termux:* Use "pkg update && pkg upgrade" regularmente para manter tudo atualizado!',
                '🔋 *Dica de Bateria:* Execute "termux-wake-lock" para evitar que o Android suspenda o bot.',
                '📁 *Dica de Armazenamento:* Use "termux-setup-storage" para acessar arquivos do celular.',
                '🌐 *Dica de Rede:* Instale curl e wget: "pkg install curl wget" para downloads.',
                '⚡ *Dica de Performance:* Use "top" para monitorar processos e "free -h" para ver RAM.',
                '🛡️ *Dica de Segurança:* Sempre mantenha backups dos seus scripts importantes!'
            ];
            return dicas[Math.floor(Math.random() * dicas.length)];
            
        case 'motivacao':
            const frases = [
                '🌟 "O código que você escreve hoje é o futuro que você constrói amanhã."',
                '🚀 "Cada bug resolvido é um passo mais próximo da perfeição."',
                '💎 "No Termux, você carrega o poder de um servidor no bolso."',
                '🌅 "Programar é transformar café em soluções, uma linha por vez."',
                '⭐ "Seu smartphone é pequeno, mas seus sonhos de código podem ser infinitos."',
                '🔥 "Termux: onde a criatividade encontra a mobilidade."'
            ];
            return frases[Math.floor(Math.random() * frases.length)];
                   
        case 'contato':
            return `📞 *CONTATO DO ADMINISTRADOR*\n\n` +
                   `👨‍💻 Para suporte técnico ou dúvidas:\n\n` +
                   `📧 Email: admin@meubot.com\n` +
                   `📱 WhatsApp: +55 11 99999-9999\n` +
                   `🌐 GitHub: github.com/meuusuario\n` +
                   `💬 Telegram: @meuusuario\n\n` +
                   `⏰ Horário de atendimento:\n` +
                   `Segunda à Sexta: 9h às 18h\n` +
                   `🚀 Resposta em até 2 horas úteis!`;
                   
        default:
            // Verificar se é comando de cálculo
            if (text.startsWith('calc ')) {
                return calcular(text.substring(5));
            }
            
            // Auto-resposta inteligente
            const autoResponse = getAutoResponse(text);
            if (autoResponse) return autoResponse;
            
            return `❓ *Comando não reconhecido*\n\n` +
                   `O comando "${text}" não foi encontrado.\n\n` +
                   `💡 Digite *menu* para ver todos os comandos disponíveis!\n\n` +
                   `_Ou descreva o que precisa que eu tento ajudar_ 😊`;
    }
}

// Função auxiliar para calcular
function calcular(expressao) {
    try {
        // Substituir vírgulas por pontos para decimais
        expressao = expressao.replace(/,/g, '.');
        
        // Validar expressão (apenas números, operadores básicos e parênteses)
        if (!/^[0-9+\-*/().\s]+$/.test(expressao)) {
            return '❌ *Erro na Calculadora*\n\nUse apenas números e operadores: +, -, *, /, ( )';
        }
        
        const resultado = eval(expressao);
        
        if (isNaN(resultado) || !isFinite(resultado)) {
            return '❌ *Erro na Calculadora*\n\nResultado inválido. Verifique a expressão.';
        }
        
        return `🧮 *CALCULADORA*\n\n` +
               `📝 Expressão: ${expressao}\n` +
               `✅ Resultado: ${resultado}\n\n` +
               `💡 _Exemplo: calc 10 + 5 * 2_`;
               
    } catch (error) {
        return '❌ *Erro na Calculadora*\n\nExpressão inválida. Tente novamente.\n\n💡 _Exemplo: calc 10 + 5 * 2_';
    }
}

// Auto-resposta inteligente
function getAutoResponse(text) {
    // Saudações por período
    const hora = new Date().getHours();
    if (/\b(bom dia|good morning)\b/i.test(text)) {
        if (hora >= 6 && hora < 12) {
            return '🌅 Bom dia! Como está seu dia hoje?';
        } else {
            return '😊 Obrigado! Mas aqui já passou da manhã. Como posso ajudar?';
        }
    }
    
    if (/\b(boa tarde|good afternoon)\b/i.test(text)) {
        if (hora >= 12 && hora < 18) {
            return '☀️ Boa tarde! Espero que esteja tendo um ótimo dia!';
        }
    }
    
    if (/\b(boa noite|good evening|good night)\b/i.test(text)) {
        if (hora >= 18 || hora < 6) {
            return '🌙 Boa noite! Tenha um descanso tranquilo!';
        }
    }
    
    // Agradecimentos
    if (/\b(obrigad[oa]|thanks|thank you|vlw|valeu|brigadão)\b/i.test(text)) {
        return '😊 Por nada! Fico feliz em ajudar! Se precisar de mais alguma coisa, é só chamar!';
    }
    
    // Despedidas
    if (/\b(tchau|bye|até logo|fui|flw|falou)\b/i.test(text)) {
        return '👋 Até logo! Volte sempre que precisar! Estarei aqui 24/7!';
    }
    
    return null;
}

// Funções utilitárias
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}

function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getRanking(userJid) {
    const sortedUsers = Object.entries(userStats)
        .sort(([,a], [,b]) => b.messages - a.messages);
    
    const userIndex = sortedUsers.findIndex(([jid]) => jid === userJid);
    return userIndex + 1;
}

// Tratamento de sinais para encerramento gracioso
process.on('SIGINT', async () => {
    console.log('\n\n👋 Encerrando bot graciosamente...');
    rl.close();
    if (sock) {
        await sock.end();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Recebido SIGTERM, encerrando...');
    rl.close();
    if (sock) {
        await sock.end();
    }
    process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error.message);
    console.log('🔄 Tentando continuar...');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada:', reason);
    console.log('🔄 Tentando continuar...');
});

// Inicializar o bot
console.log('🚀 Iniciando Bot WhatsApp para Termux...');
console.log('📱 Otimizado para dispositivos Android\n');

connectToWhatsApp();