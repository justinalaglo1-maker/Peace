const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: require('pino')({ level: 'silent' }),
        browser: ['PEACE’s DARK BOT', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if(qr) {
            qrcode.generate(qr, {small: true});
            console.log(chalk.green('Scanne le QR avec ton WhatsApp 👆'));
        }
        
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red('Connexion coupée, reconnexion...'));
            if(shouldReconnect) startBot();
        }
        
        if(connection === 'open') {
            console.log(chalk.green('✅ PEACE’s DARK BOT connecté !'));
        }
    });
}

startBot();
