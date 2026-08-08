const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const chalk = require('chalk');
const config = require('./config');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(config.SESSION_NAME);
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: require('pino')({ level: 'silent' }),
        browser: [config.BOT_NAME, 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);
    
    // DEMANDE LE CODE SI PAS ENCORE CONNECTE
    if (!sock.authState.creds.registered) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const code = await sock.requestPairingCode(config.OWNER_NUMBER);
        console.log(chalk.green(`TON CODE DE COUPLAGE : ${code}`));
        console.log(chalk.yellow(`Va dans WhatsApp > Appareils liés > Lier avec le numéro de téléphone`));
    }
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red('Connexion coupée, reconnexion...'));
            if(shouldReconnect) startBot();
        }
        
        if(connection === 'open') {
            console.log(chalk.green(`✅ ${config.BOT_NAME} connecté !`));
            console.log(chalk.yellow(`Owner: ${config.OWNER_NAME} | ${config.OWNER_NUMBER}`));
        }
    });
}

startBot();
