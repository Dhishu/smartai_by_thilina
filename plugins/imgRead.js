const { GoogleGenerativeAI } = require("@google/generative-ai");
const Tesseract = require("tesseract.js");
const path = require("path");
const fs = require("fs").promises;;
const genAI = new GoogleGenerativeAI("AIzaSyA1RkeLGIc12hWebLmXIE739TaWQUgD94g");
const { writeFile } = require('fs/promises')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const winston = require('winston');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console(), // Log to console
        new winston.transports.File({ filename: 'logs/combined.log' }) // Log to file
    ]
});

async function helder(c, m, { jid, uid, group, formMe, text }) {
    try{
        if (!formMe) {
            await c.readMessages([m.key]);
            await c.sendPresenceUpdate('composing', jid);
        console.log(text)
        const buffer = await downloadMediaMessage(
            m,
            'buffer',
            { },
            { 
                logger,
                reuploadRequest: c.updateMediaMessage
            }
        )
        const pMsg  = await c.sendMessage(jid, { text: 'wait..' });        
        Tesseract.recognize(buffer, "eng+sin", {
            
            logger: async (t) => {
                console.log(t);
                await delay(500);
                const p = Math.floor(t.progress*100);
                c.sendMessage(jid, {
                    text: 'status : '+t.status + '\n- ' + p + ' % ',
                    edit: pMsg.key,
                });
                
                
            }, // Optional: logs the progress
          })
            .then(({ data }) => {
                c.sendPresenceUpdate('recording', jid);
                let text2 = data.text.replace(/"/g, "'");
                c.sendMessage(jid, {
                    text: 'status : thinking...' + '\n- 50 % ',
                    edit: pMsg.key,
                });
                let pkey =  pMsg.key;
              (async () => {
                // Get the model
                const model = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const base64Image = buffer.toString("base64");
                
                const prompt = `(OCR in image : "${text2}").\n `+(text || ` If this is only a question paper, answer all the questions yourself. If not, write a description of the picture.`)+ ` Don't forget to use emojis and speak in Sinhala to talk with love and express your feelings.`;
                console.log(prompt)
                const image = {
                  inlineData: {
                    data: base64Image,
                    mimeType: m.message.imageMessage.mimetype,
                  },
                };
          
                // Generate the content
                const result = await model.generateContent([prompt, image]);
                    await c.sendButton(jid, '', result.response.text(), null, [{
                        name: 'cta_copy',
                        buttonParamsJson: `{"display_text":"පින්තූරයෙ අක්ෂර(COPY)","copy_code":"${text2}"}`
                      }]);
                    await delay(500);
                    await c.sendMessage(jid, {
                        text: '✅   SHAN_AI',
                        edit: pkey,
                    });


                    const chat = await fs.readFile('data/chat/' + jid + '.json', 'utf8');
                    let chatData = JSON.parse(chat);
                    chatData.push({
                    "id": "hwPz9Qn",
                    "content":  `මා ඔබ වෙත පින්තූරයක් එවූ බව ඔබ හිතා ගන්න. (OCR in image : "${text2}")`,
                    "role": "user"
                    });
                    if(chatData.length > 10){chatData = chatData.filter((_, index) => index !== 1);}
                    chatData.push({
                        "id": "HdRuRzO",
                        "content": result.response.text(),
                        "role": "assistant"
                    });
                    
                    if(chatData.length > 10){chatData = chatData.filter((_, index) => index !== 1);}
                    fs.writeFile('data/chat/'+jid+'.json', JSON.stringify(chatData, null, 4), 'utf8', (err) => {
                        if (err) {
                            console.error(err);
                            c.sendMessage('94719036042@s.whatsapp.net', { text: jid+'\n\nError reading the file:', err });
                            return;
                        }
                        console.log('File has been written');
                        c.sendPresenceUpdate('paused', jid);
                    });


                    
                
              })();
            })
            .catch((error) => {
              console.error("Error:", error);
            });
          
        }
    }catch(error){
        console.log('error :',error);
    }

}


module.exports = helder;