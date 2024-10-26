
const pino = require('pino');
const {
  default: makeWASocket,
  downloadContentFromMessage,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
    useMultiFileAuthState, 
    delay
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

var socket;




function gettype(m) {
    if (m.key) {
        if (m.remoteJid === 'status@broadcast') {
            return ('status');
        }
        if (m.message) {
            if (m.message.imageMessage) {
                return ('imageMessage');
            }
            if (m.message?.conversation || m.message?.extendedTextMessage?.text) {
                return ('textMessage');
            }
            if (m.message.videoMessage) {
                return ('video msg');
            }
            if (m.message.stickerMessage) {
                return 0;
            }
        }
    }
    return 0;
}


async function connectWhatsApp() {
    
    const auth = await useMultiFileAuthState('session');
    socket = makeWASocket({
        printQRInTerminal: true,
        browser: ["thilina", 'safari', "1.0.0"],
        auth: auth.state,
        logger: pino({ level: 'silent' })
    });
    socket.ev.on('creds.update', auth.saveCreds);
    socket.ev.on('connection.update', async ({ connection }) => {
        if (connection === 'open') {

            
            

            
           
        
            
            await socket.sendMessage('94719036042@s.whatsapp.net', { text: "\n\nBot is connected👋\n\n" });
            await socket.sendPresenceUpdate("unavailable");
            console.log('bot start');
        } else if (connection === 'close') {
            await connectWhatsApp();
        }
    });
    

    socket.ev.on('messages.upsert', async ({ messages, type }) => {
        try {
            delete require.cache[require.resolve('./plugins/alive.js')];
            let helder = require('./plugins/alive.js');
            const msgType = gettype(messages[0]);
            let d = {
                jid: messages[0].key.remoteJid,
                formMe: messages[0].key.fromMe
            };
            if (msgType === 'textMessage') {
                d.text = messages[0].message?.conversation || messages[0].message?.extendedTextMessage?.text;
            }
            if (messages[0].key.participant) {
                d.group = messages[0].key.remoteJid;
                d.uid = messages[0].key.participant;
            } else {
                d.group = false;
                d.uid = messages[0].key.remoteJid;
            }
            try {
                console.log(messages[0].key.remoteJid);
                if (true || helder.user.includes(messages[0].key.remoteJid)) {
                  if(d.text !== null){
                    helder(socket, messages[0], d);}
                }

                
            } catch (error) {
                console.error('An error occurred:', error);
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
    });
    //get file. button sender
    
    //button sender
    socket.sendButton = async function(jid, text = '', footer = '', buffer, buttons, quoted, options) {
        let img, video;
        const fetch = (await import('node-fetch')).default;

        // Usage example

        if (/^https?:\/\//i.test(buffer)) {
          try {
            const response = await fetch(buffer);
            const contentType = response.headers.get('content-type');
            if (/^image\//i.test(contentType)) {
              img = await prepareWAMessageMedia({ image: { url: buffer } }, { upload: socket.waUploadToServer });
            } else if (/^video\//i.test(contentType)) {
              video = await prepareWAMessageMedia({ video: { url: buffer } }, { upload: socket.waUploadToServer });
            } else {
              console.error("Filetype not supported", contentType);
            }
          } catch (error) {
            console.error("Failed to detect file type", error);
          }
        } else {
          try {
            const type = await socket.getFile(buffer);
            if (/^image\//i.test(type.mime)) {
              img = await prepareWAMessageMedia({ image: { url: buffer } }, { upload: socket.waUploadToServer });
            } else if (/^video\//i.test(type.mime)) {
              video = await prepareWAMessageMedia({ video: { url: buffer } }, { upload: socket.waUploadToServer });
            }
          } catch (error) {
            console.error("Error getting file type", error);
          }
        }


        const interactiveMessage = {
          body: { text: text },
          footer: { text: footer },
          header: {
            hasMediaAttachment: !!img || !!video,
            imageMessage: img ? img.imageMessage : null,
            videoMessage: video ? video.videoMessage : null
          },
          nativeFlowMessage: {
            buttons: buttons,
            messageParamsJson: ''
          }
        };

        let msgL = generateWAMessageFromContent(jid, { viewOnceMessage: { message: { interactiveMessage } } }, { userJid: jid, quoted });
        socket.relayMessage(jid, msgL.message, { messageId: msgL.key.id, ...options });
      };

    
    
}

connectWhatsApp();
