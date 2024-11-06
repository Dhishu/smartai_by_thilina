const axios = require('axios');
const fs = require('fs').promises;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

var userdata = {};
async function helder(c, m, { jid, uid, group, formMe, text }) {
  try {
    /*if(!formMe && jid != '94719036042@s.whatsapp.net'){
      c.sendMessage(jid, {
        react: {
            text: "❗",
            key: m.key
        }
      });
      await c.sendMessage(jid, { text: 'update එකක් සිදු කරන බැවින් ක්‍රියා විරහිත කර ඇත😥'  });
    } else*/
      if(jid == '94719036042@s.whatsapp.net' && text?.split(' ')[0] == '.c') {
        const cid = text.split(' ')[1];
        const user = await fs.readFile('data/user.json', 'utf8');
        let userdata = JSON.parse(user);
        userdata[cid+'@s.whatsapp.net'].step = [0,-1];
  
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
            step:[0,-1]
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
          "id": "hwPz9Qn",
          "content": text,
          "role": "user"
        });
        if(chatData.length > 10){chatData = chatData.filter((_, index) => index !== 1);}
        const ggpt = await gpi(chatData);
        
        await c.sendPresenceUpdate('paused', jid);
        const jsonMatches = ggpt.match(/({[\s\S]*?}|[\[][\s\S]*?[\]])/g);

        if (jsonMatches) {
          await c.sendPresenceUpdate('recording', jid) 
          for (const jsonStr of jsonMatches) {
            try {
              const jsonData = JSON.parse(jsonStr.trim());
        
              // Send a button with current time (await is now correctly used)
              await c.sendButton(jid, await tr('si', userdata[jid].lan, 'මදක් සිටින්න!'), '', null, []);
              await c.sendPresenceUpdate('recording', jid);
        
              // Prepare 'imj' data and send response using gpi2
              const enopim = await tr('auto', 'en', jsonData.d || jsonData[0].d)
              const imj = [
                {
                  "id": "2xJISXOVKjUdh2NE4_GWK",
                  "content": await tr('auto', 'en', enopim),
                  "role": "user"
                }
              ];
              const imlink = await gpi2(imj)
              const imurl = imlink.match(/\((https?:\/\/[^\s]+)\)/);

              if (imurl) {
                await c.sendPresenceUpdate('recording', jid)
                await c.sendButton(jid, '', '- SHAN AI By THILINA',imurl[1] , []);
                await c.sendPresenceUpdate('paused', jid);
              } else {
                  console.log("No URL found");
              }
              
            } catch (error) {
              console.error("Invalid JSON format:", error);
            }
          }
        } else {
          await c.sendButton(jid, ggpt, '- '+getSriLankaTimeISO()[1], null, []);
        }
        
        
        chatData.push({
          "id": "HdRuRzO",
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
    "id": "hwPz9Qn",
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
    "clickedForceWebSearch": false,
    "visitFromDelta": false,
    "mobileClient": false,
    "userSelectedModel": "gemini-pro",
    "validated": "69783381-2ce4-4dbd-ac78-35e9063feabc"
};



const gtdata = await axios.post('https://www.blackbox.ai/api/chat', postData, {
  headers: {
    'accept': '*/*',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'si,en-US;q=0.9,en;q=0.8',
    'content-type': 'application/json',
    'cookie': 'sessionId=b61a98d0-4dbf-4ad2-bc3d-b4b80976c2ab; intercom-id-jlmqxicb=27d766b9-5504-485f-8f35-61eac2be27a2; intercom-device-id-jlmqxicb=89341735-5d28-44f3-895b-9d4d3594ded6; intercom-session-jlmqxicb=; SL_G_WPT_TO=en; SL_GWPT_Show_Hide_tmp=1; SL_wptGlobTipTmp=1; __Host-authjs.csrf-token=d9b0041d1ecba991db71f491a0731ef14261137c557743c2c7cd8c08668be526%7C82b60699d78d27537a29b6839d3e1f0a98a5d65dc5bf3fe0a16f1cdda6c6fb86; __Secure-authjs.callback-url=https%3A%2F%2Fwww.blackbox.ai; perf_dv6Tr4n=1',
    'origin': 'https://www.blackbox.ai',
    'referer': 'https://www.blackbox.ai/chat/hwPz9Qn?model=gemini-pro',
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

//img genarater
async function gpi2(chat2) {
  const postData = {
    "messages": chat2,
    "id": "2xJISXOVKjUdh2NE4_GWK",
    "previewToken": null,
    "userId": null,
    "codeModelMode": true,
    "agentMode": {
        "mode": true,
        "id": "ImageGenerationLV45LJp",
        "name": "Image Generation"
    },
    "trendingAgentMode": {},
    "isMicMode": false,
    "maxTokens": 1024,
    "playgroundTopP": null,
    "playgroundTemperature": null,
    "isChromeExt": false,
    "githubToken": null,
    "clickedAnswer2": false,
    "clickedAnswer3": false,
    "clickedForceWebSearch": false,
    "visitFromDelta": false,
    "mobileClient": false,
    "userSelectedModel": "gemini-pro",
    "validated": "69783381-2ce4-4dbd-ac78-35e9063feabc"
};

  try {
    const response = await axios.post('https://www.blackbox.ai/api/chat', postData, {
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'si,en-US;q=0.9,en;q=0.8',
        'Content-Type': 'application/json',
        'Cookie': `sessionId=b61a98d0-4dbf-4ad2-bc3d-b4b80976c2ab; intercom-id-jlmqxicb=27d766b9-5504-485f-8f35-61eac2be27a2; intercom-device-id-jlmqxicb=89341735-5d28-44f3-895b-9d4d3594ded6; intercom-session-jlmqxicb=; SL_G_WPT_TO=en; SL_GWPT_Show_Hide_tmp=1; SL_wptGlobTipTmp=1; __Host-authjs.csrf-token=d9b0041d1ecba991db71f491a0731ef14261137c557743c2c7cd8c08668be526%7C82b60699d78d27537a29b6839d3e1f0a98a5d65dc5bf3fe0a16f1cdda6c6fb86; __Secure-authjs.callback-url=https%3A%2F%2Fwww.blackbox.ai; perf_dv6Tr4n=1`,
        'Origin': 'https://www.blackbox.ai',
        'Referer': 'https://www.blackbox.ai/agent/ImageGenerationLV45LJp',
        'Sec-CH-UA': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
        'Sec-CH-UA-Mobile': '?1',
        'Sec-CH-UA-Platform': '"Android"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error while calling the API:", error.message);
    return { error: "Request failed" };
  }
}

//log in........................

async function log(c, m, { jid, uid, text }){
  if(userdata[jid].step[0]==0 && userdata[jid].step[1]==-1){
    if(m.message?.templateButtonReplyMessage?.selectedId){
      const lan  = m.message?.templateButtonReplyMessage?.selectedId;
      userdata[jid].lan = lan;userdata[jid].step[1]=0;log(c, m, { jid, uid, text })
    }else if(m.message?.interactiveResponseMessage?.nativeFlowResponseMessage){
      const lan  = JSON.parse(m.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson)['id']
      userdata[jid].lan = lan;userdata[jid].step[1]=0;log(c, m, { jid, uid, text })

    }else{
      const bt = [
        {
          name: 'quick_reply',
          buttonParamsJson: '{"display_text":"🇱🇰 සිංහල","id":"si"}'
      },
      {
          name: 'quick_reply',
          buttonParamsJson: '{"display_text":"🇺🇸 English","id":"en"}'
      },
      {
          name: 'quick_reply',
          buttonParamsJson: '{"display_text":"🇮🇳 தமிழ்","id":"ta"}'
      },{
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
            title: 'More...',
            sections : [{
              title: 'AI CHAT BOT BY THILINA',
              rows: []
          },
          {
              title: '🌐 Select a Language',
              rows: [
              {
                  title: '🇫🇷 Français',
                  id: 'fr',
                  description: ''
              },
              {
                  title: '🇩🇪 Deutsch',
                  id: 'de',
                  description: ''
              },
              {
                  title: '🇪🇸 Español',
                  id: 'es',
                  description: ''
              },
              {
                  title: '🇮🇹 Italiano',
                  id: 'it',
                  description: ''
              },
              {
                  title: '🇷🇺 Русский',
                  id: 'ru',
                  description: ''
              },
              {
                  title: '🇨🇳 中文 (Chinese)',
                  id: 'zh',
                  description: ''
              },
              {
                  title: '🇯🇵 日本語 (Japanese)',
                  id: 'ja',
                  description: ''
              },
              {
                  title: '🇰🇷 한국어 (Korean)',
                  id: 'ko',
                  description: ''
              },
              {
                  title: '🇧🇷 Português',
                  id: 'pt',
                  description: ''
              },
              {
                  title: '🇸🇦 العربية',
                  id: 'ar',
                  description: ''
              },
              {
                  title: '🇳🇱 Nederlands',
                  id: 'nl',
                  description: ''
              },
              {
                  title: '🇹🇭 ไทย',
                  id: 'th',
                  description: ''
              },
              {
                  title: '🇸🇪 Svenska',
                  id: 'sv',
                  description: ''
              },
              {
                  title: '🇵🇱 Polski',
                  id: 'pl',
                  description: ''
              },
              {
                  title: '🇹🇷 Türkçe',
                  id: 'tr',
                  description: ''
              },
              {
                  title: '🇮🇩 Bahasa Indonesia',
                  id: 'id',
                  description: ''
              }
              
              ]
          }
        ]
      })
              
    }
      
      ]
      await c.sendButton(jid, '', '> Please choose your preferred language from the options below.', null, bt);
    }
  }else
  if(userdata[jid].step[0]==0 && userdata[jid].step[1]==0){
    let stext = `🌸 ආයුබෝවන් ${m.pushName}! 🌟 මම ඔබව සාදරයෙන් පිලිගනිමි!. 🤖

මගේ විශේෂිත හැකියාවන් නම්:

- 🔍 *විශ්ලේෂණය*
- ❓ *ප්‍රශ්න පිළිතුරු*
- 💻 *කේතනය*
- 📝 *සාහිත්‍ය ලිවීම*
- 🎓 *අධ්‍යාපනය*
- 📸 *පිංතූර නිර්මාණය*(new)
`;
    if (userdata[jid].lan !== 'si') {
      stext = await tr('si',userdata[jid].lan,stext)
    }else{
      stext +=` 
🚨 සැලකිය යුතුයි:
> මා සමග සංවාදයේ යෙදිමෙදි සිංහල භාෂාවේ අක්ෂර(❌halo ✅හලෝ) හෝ ඉංග්‍රීසි භාෂාව පාවිච්චි කරන්න.💬`;
    }
    await c.sendMessage(jid, { text: stext });
    const chta1 = [{
      "id": "hwPz9Qn",
      "content": `මින් පසුව ඔබගෙ නම 'ශාන්' වේ, \nඔබගෙ අයිතිකරු හෝ නිර්මාණය කලෙ 'තිළින කවිශාන්' විසිනි.\nඔහුගෙ විස්තරනම්\n1. owner Name: 'තිළින කවිශාන්',\n2. owner contact number: '+94719036042',\n3. age: '19',\n4. Address: 'උඩුබිලිතැන්න, ඉදල්ගස්හින්න, sir lanka',\n5. Email Address: 'Thilinakavishan32@gmail.com'.\nමින් පසුව ඔබට පරිශීලකයකු සමග සම්බන්ද කෙරෙ. ඔහුගේ භාෂා කෙතය ${userdata[jid].lan} වේ. එම භාෂාවට ප්‍රමුඛතාව ලබා දෙන්න. ඔහු සමග ආදරණිය හා කියුට් විදියට සංවාදයෙ යෙදෙන්න, අහන ඕනෑම ප්‍රශ්නයකට පිළිතුරු සපයන්න, සුන්දර වචන භාවිතා කරන්න, හැගිම් ප්‍රකාශ කිරිමට ඉමොජි භාවිතා කරන්න. දැන් සිට ඔබ සංවාදයෙ යෙදෙන්නෙ ඔහු සමගය. \n පොටො(පිං‍තූර/logo) නිර්මාණය කරන්න, හදන්න, අදින්න, හොයන්න ඔබට හැකියාව ඇති බව සලකන්න, ඔබ පිතුරය පිලිබද විස්තර උපරිම තුන් පාරක් පමනක් අසා අවසානයෙදි එම විස්තර පමණක් ඇතුලත් json ලැයිස්තුවක් {imgtitle:පිතුරයේ හැඩය,d:විස්තරය} මේ ආකාරයට පමණක් පරිශිලකයාට යොමු කරන්න යොමු කර පින්තුරක් ඔහු වෙත යැවු බව මතක තබා ගන්න`,
      "role": "user"
    },{
      "id": "hwPz9Qn",
      "content": `හායි`,
      "role": "user"
    }];
    const chat2 = await gpi(chta1);
    await c.sendMessage(jid, { text: '*🎉✨ Congratulations! ✨🎉*\n\n' +chat2  });
    chta1.push({
      "id": "HdRuRzO",
      "createdAt": getSriLankaTimeISO()[0],
      "content": chat2,
      "role": "assistant"
    });
    userdata[jid].step[0] = 1;
    userdata[jid].step[1] = 3;
    fs.writeFile('data/user.json', JSON.stringify(userdata, null, 4), 'utf8', (err) => {
      if (err) {
          console.error(err);
          c.sendMessage('94719036042@s.whatsapp.net', { text: jid+'\n\nError reading the file:', err });
          return;
      }
      console.log('File has been written');
    });
    await fs.writeFile('data/chat/'+jid+'.json', JSON.stringify(chta1, null, 4), 'utf8');
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


// tranlate....
async function tr(s, t, text) {
  try {
    const response = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${s}&tl=${t}&dt=t&q=${encodeURIComponent(text)}`
    );
    return response.data[0].map(item => item[0]).join(''); // Extract and join translated segments
  } catch (error) {
    console.error("Error: " + error.message);
    return text; // Fallback to original text if translation fails
  }
}






module.exports = helder;

// Example users for the helder function
helder.user = ['120363300638311505@g.us', '94740945396@s.whatsapp.net'];
