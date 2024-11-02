const axios = require('axios');
const fs = require('fs').promises;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

var userdata = {};
async function helder(c, m, { jid, uid, group, formMe, text }) {
  try {
    if(!formMe && jid != '94719036042@s.whatsapp.net'){
      c.sendMessage(jid, {
        react: {
            text: "❗",
            key: m.key
        }
      });
      await c.sendMessage(jid, { text: 'update එකක් සිදු කරන බැවින් ක්‍රියා විරහිත කර ඇත😥'  });
    }else
      if(jid == '94719036042@s.whatsapp.net' && text?.split(' ')[0] == '.c') {
        const cid = text.split(' ')[1];
        const user = await fs.readFile('data/user.json', 'utf8');
        let userdata = JSON.parse(user);
        userdata[cid+'@s.whatsapp.net'].step = [0,0];
  
        fs.writeFile('data/user.json', JSON.stringify(userdata, null, 4), 'utf8', (err) => {
          if (err) {
              console.error(err);
              return;
          }
        });
          c.sendMessage(jid,{text: 'done'});
  
  
      }else
    if (!formMe) {
      await c.readMessages([m.key]);
      await c.sendPresenceUpdate('composing', jid);
      try {
        const data = await fs.readFile('data/user.json', 'utf8');
        userdata = JSON.parse(data);

        if (!(jid in userdata)) {
          userdata[jid] ={
            step:[0,0]
          }
        }


      } catch (err) {
          console.error('Error reading the file:', err);
          await c.sendMessage('94719036042@s.whatsapp.net', { text: jid+'\n\nError reading the file:', err });
      }
      if(userdata[jid].step[0] == 0){
        await log(c, m, { jid, uid, text })
      }else{
        const chat = await fs.readFile('data/chat/' + jid + '.json', 'utf8');
        let chatData = JSON.parse(chat);
        chatData.push({
          "id": "W00SXcD",
          "content": text,
          "role": "user"
        });
        if(chatData.length > 10){chatData = chatData.filter((_, index) => index !== 1);}
        const ggpt = await gpi(chatData);
        
        await c.sendPresenceUpdate('paused', jid);
        await c.sendButton(jid, ggpt, '- '+getSriLankaTimeISO()[1], null, []);
        
        chatData.push({
          "id": "UIucdaF",
          "createdAt": getSriLankaTimeISO()[0],
          "content": ggpt,
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
        });
        
      }




      fs.writeFile('data/user.json', JSON.stringify(userdata, null, 4), 'utf8', (err) => {
        if (err) {
            console.error(err);
            c.sendMessage('94719036042@s.whatsapp.net', { text: jid+'\n\nError reading the file:', err });
            return;
        }
        console.log('File has been written');
      });
      await c.sendPresenceUpdate('paused', jid);
    }
  } catch (error) {
    c.sendMessage('94719036042@s.whatsapp.net', { text: jid+'\n\n*main*  An error occurred:'+ error.message});
    console.error("An error occurred:", error.message);
  }
}




//gpi............................
async function gpi(chat2){
  const postData = {
    "messages": chat2,
    "id": "W00SXcD",
    "previewToken": null,
    "userId": null,
    "codeModelMode": true,
    "agentMode": {},
    "trendingAgentMode": {},
    "isMicMode": false,
    "userSystemPrompt": null,
    "maxTokens": 1024,
    "playgroundTopP": 0.9,
    "playgroundTemperature": 0.5,
    "isChromeExt": false,
    "githubToken": null,
    "clickedAnswer2": false,
    "clickedAnswer3": false,
    "clickedForceWebSearch": true,
    "visitFromDelta": false,
    "mobileClient": false,
    "userSelectedModel": "gemini-pro"
};



const gtdata = await axios.post('https://www.blackbox.ai/api/chat', postData, {
  headers: {
    'accept': '*/*',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'si,en-US;q=0.9,en;q=0.8',
    'content-type': 'application/json',
    'cookie': 'sessionId=fe49991b-bf35-4573-874d-fddb850f3ad0; SL_G_WPT_TO=en; SL_GWPT_Show_Hide_tmp=1; SL_wptGlobTipTmp=1; __Host-authjs.csrf-token=d64e69aa7d5ad8ccbd556975ca67d67234c32fb49e0bd784254573350f20f214%7C14586639eae102e5d4aba1a0c4fca604846c2e5a1e10d36feb024d032ff7dee4; __Secure-authjs.callback-url=https%3A%2F%2Fwww.blackbox.ai; intercom-id-jlmqxicb=fbc67918-4528-4d81-90a4-b073658634f9; intercom-session-jlmqxicb=; intercom-device-id-jlmqxicb=2fb4f76d-c375-45bb-9b11-f66f7cfa9cc1',
    'origin': 'https://www.blackbox.ai',
    'referer': 'https://www.blackbox.ai/chat/W00SXcD?model=gemini-pro',
    'sec-ch-ua': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
  }
});
return gtdata.data
}


//log in........................

async function log(c, m, { jid, uid, text }){
  if(userdata[jid].step[0]==0 && userdata[jid].step[1]==0){
    const stext = `🌸 ආයුබෝවන් ${m.pushName}! 🌟 මම ඔබව සාදරයෙන් පිලිගනිමි!. 🤖

මගේ විශේෂිත හැකියාවන් නම්:

- 🔍 *විශ්ලේෂණය*
- ❓ *ප්‍රශ්න පිළිතුරු*
- 💻 *කේතනය*
- 📝 *සාහිත්‍ය ලිවීම*
- 🎓 *අධ්‍යාපනය*

🚨 සැලකිය යුතුයි:
> මා සමග සංවාදයේ යෙදිමෙදි සිංහල භාෂාවේ අක්ෂර(❌halo ✅හලෝ) හෝ ඉංග්‍රීසි භාෂාව පාවිච්චි කරන්න.💬
`;

    await delay(500);
    await c.sendMessage(jid, { text: stext });
    await delay(5000);
    await c.sendMessage(jid, { text: `\n\n👇👇👇👇👇👇👇\nඔබේ නම කුමක්ද? 🤔💬\n👆👆👆👆👆👆👆\n\n` })
    userdata[jid].step[1] = 2;
  }else if(userdata[jid].step[0]==0 && userdata[jid].step[1]==2){
    await namev(c,jid,text)
    
  }else if(userdata[jid].step[0]==0 && userdata[jid].step[1]==3){
    if(m.message?.templateButtonReplyMessage?.selectedId){
      const gen2 = m.message.templateButtonReplyMessage.selectedId
      userdata[jid].gen = gen2;
      let gen1 = 'යාලුවා'
      if(gen2 == 'Girl'){gen1 = 'අක්කා'}else if(gen2 == 'Boy'){gen1 = 'අයියා'}
      const chta1 = [{
        "id": "W00SXcD",
        "content": `මින් පසුව ඔබගෙ නම 'ශාන්' වේ, 
ඔබගෙ අයිතිකරු හෝ නිර්මාණය කලෙ 'තිළින කවිශාන්' විසිනි.
ඔහුගෙ විස්තරනම්
  1. owner Name: 'තිළින කවිශාන්',
  2. owner contact number: '+94719036042',
  3. age: '19',
  4. Address: 'උඩුබිලිතැන්න, ඉදල්ගස්හින්න, sir lanka',
  5. Email Address: 'Thilinakavishan32@gmail.com'.
  මින් පසුව ඔබට පරිශීලකයකු සමග සම්බන්ද කෙරෙ. ඔහුගේ නම ${userdata[jid].name} වේ. ඔහුට ${userdata[jid].name} ${gen1} / ${gen1} / යාලුවා / සහොදරිය හෝ සහොදරයා / කොල්ලා හො කෙල්ල වහේ ඒවා කියලා ආදරයෙන් කතා කරන්න. ඔහු සමග සහොදරකු(නංගි) ලෙස ආදරණිය හා කියුට් විදියට වගෙම විහිලුවෙන් සංවාදයෙ යෙදෙන්න. හැගිම් ප්‍රකාශ කිරිමට ඉමොජි භාවිතා කරන්න. දැන් සිට ඔබ සංවාදයෙ යෙදෙන්නෙ ${userdata[jid].name} සමගය..`,
        "role": "user"
      },{
        "id": "W00SXcD",
        "content": `හායි මම ${userdata[jid].name}`,
        "role": "user"
      }];
      const chat2 = await gpi(chta1);
      await c.sendMessage(jid, { text: '*🎉✨ Congratulations '+userdata[jid].name+'! ✨🎉*\n\n' +chat2  });
      chta1.push({
        "id": "UIucdaF",
        "createdAt": getSriLankaTimeISO()[0],
        "content": chat2,
        "role": "assistant"
      });
      await fs.writeFile('data/chat/'+jid+'.json', JSON.stringify(chta1, null, 4), 'utf8');
      userdata[jid].step[0] = 1;
    }else{
      const bt = [
        {
          name: 'quick_reply',
          buttonParamsJson: '{"display_text":"👩Girl","id":"Girl"}'
        },{
          name: 'quick_reply',
          buttonParamsJson: '{"display_text":"👨Boy","id":"Boy"}'
        }
      ]
      await c.sendButton(jid, 'නම අනුව නම් ඔබ '+userdata[jid].gen+' කෙනෙකු බව පෙනෙ, තහවුරු කරන්න', '\n select gender', null, bt);
    }
  }
}

async function namev(c,jid,text){
  const rn = await gpi([{
    "id": "W00SXcD",
    "content": `පරිශිල්කයකු ඇතුලත් කරන ඔහුගෙ නම '${text}' විය. එය පිළිගත හැකි නමක් නම් '1' ද, නැතහොත් '0'ද ප්‍රතිදානය කරන්න. 1 හෝ 0 පමණක් ලබා දෙන්න`,
    "role": "user"
  }])
  if(rn==1){
    const rgen = await gpi([{
      "id": "W00SXcD",
      "content": `පරිශිල්කයකු ඇතුලත් කරන ඔහුගෙ නම '${text}' විය. එය පිරිමි නමක් නම් 1ද, ගැහැණූ නමක් නම් '0'ද ප්‍රතිදානය කරන්න. 1 හෝ 0 පමණක් ලබා දෙන්න`,
      "role": "user"
    }]);
    let g;
    if(rgen==0){g='👩Girl'}else{g='👨Boy'}
    userdata[jid].name = text;
    userdata[jid].gen = g;
      const bt = [
      {
        name: 'quick_reply',
        buttonParamsJson: '{"display_text":"👩Girl","id":"Girl"}'
      },{
        name: 'quick_reply',
        buttonParamsJson: '{"display_text":"👨Boy","id":"Boy"}'
      }
    ]
    await c.sendButton(jid, '😮 ඔහ්.. එය ලස්සන නමක්! 🌸✨, නම අනුව නම් ඔබ '+g+' කෙනෙකු බව පෙනෙ, තහවුරු කිරිමට ඔබගෙ gender එක තෝරන්න ♂️♀️', '\n- ♂️♀️select gender', null, bt);
    userdata[jid].step[1] = 3;
  }else{
    await c.sendMessage(jid, { text: '⚠️ ඔබගේ නාමය පිළිගත නොහැක 🚫, කරුණාකර වෙනත් නමක් යොමු කරන්න. 📝'  });
    userdata[jid].step[1] = 2;
  }
}


//get time ...................
const getSriLankaTimeISO = () => {
  const options = {
      timeZone: 'Asia/Colombo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      hour12: false,
  };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(new Date());

  // Extract the components
  const year = parts.find(part => part.type === 'year').value;
  const month = parts.find(part => part.type === 'month').value;
  const day = parts.find(part => part.type === 'day').value;
  const hour = parts.find(part => part.type === 'hour').value.padStart(2, '0');
  const minute = parts.find(part => part.type === 'minute').value.padStart(2, '0');
  const second = parts.find(part => part.type === 'second').value.padStart(2, '0');
  
  // Create the ISO string
  const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
  const isoString2 = `${hour}:${minute}:${second} | ${year}-${month}-${day}`;
  
  return [isoString,isoString2];
};









module.exports = helder;

// Example users for the helder function
helder.user = ['120363300638311505@g.us', '94740945396@s.whatsapp.net'];
