const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const config = require('./config'); // 1. Ajout

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(config.SESSION_NAME); // 2. Modif
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: require('pino')({ level: 'silent' }),
        browser: [config.BOT_NAME, 'Chrome', '1.0.0'] // 3. Modif
    });

    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if(qr) {
            qrcode.generate(qr, {small: true});
            console.log(chalk.green(`Scanne le QR pour ${config.BOT_NAME} 👆`)); // 4. Modif
        }
        
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red('Connexion coupée, reconnexion...'));
            if(shouldReconnect) startBot();
        }
        
        if(connection === 'open') {
            console.log(chalk.green(`✅ ${config.BOT_NAME} connecté !`)); // 5. Modif
            console.log(chalk.yellow(`Owner: ${config.OWNER_NAME}`)); // 6. Ajout
        }
    });
}

startBot();
