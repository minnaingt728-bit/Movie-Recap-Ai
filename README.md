# Movie Recap AI — Myanmar Mobile Starter

## Render တစ်နေရာတည်းမှာ Frontend + Backend Deploy လုပ်ရန်

### 1. GitHub ထဲတင်ပါ
1. https://github.com မှ account ဝင်ပါ။
2. New repository ဖန်တီးပါ (ဥပမာ `movie-recap-ai`)။
3. ZIP ကို ဖြည်ပြီး အတွင်းရှိဖိုင်အားလုံးကို repository ထဲ upload/commit လုပ်ပါ။ `.env` သို့မဟုတ် API key ကို GitHub မတင်ပါနှင့်။

### 2. OpenAI API Key ပြင်ဆင်ပါ
1. https://platform.openai.com/api-keys မှ API key အသစ်ဖန်တီးပါ။
2. API key ကို ကိုယ်ပိုင်လုံခြုံရာတွင် သိမ်းထားပါ။ Frontend code, GitHub repo သို့ မထည့်ပါနှင့်။
3. API သုံးစွဲမှုအတွက် billing/usage limits ကို စစ်ဆေးပါ။

### 3. Render မှာ Deploy လုပ်ပါ
1. https://render.com ကိုဖွင့်ပြီး GitHub account ချိတ်ပါ။
2. Dashboard → **New** → **Web Service** ကိုရွေးပြီး `movie-recap-ai` repository ကိုရွေးပါ။
3. အောက်ပါ settings ထည့်ပါ။
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
4. **Environment** ထဲမှာ အောက်ပါ variable တွေ ထည့်ပါ။
   - `OPENAI_API_KEY` = OpenAI API key
   - `JWT_SECRET` = ရှည်လျားပြီး ကျပန်းဖြစ်သော secret (ဥပမာ စကားဝှက်မဟုတ်သော 32+ character random value)
   - `DATA_DIR` = `/var/data`
5. Persistent disk ထည့်ပါ (Dashboard ရဲ့ Disk/Advanced မှာ):
   - **Mount Path:** `/var/data`
   - **Size:** လိုအပ်ချက်အတိုင်း ရွေးပါ
   - Render plan အလိုက် persistent disk ရနိုင်မှု/ကုန်ကျစရိတ်ကို စစ်ပါ။ Disk မရှိရင် user accounts နဲ့ upload files များ deploy/restart ပြီး ပျောက်နိုင်သည်။
6. Create Web Service ကိုနှိပ်ပြီး build/deploy အောင်မြင်သည်အထိ စောင့်ပါ။
7. Render ကပေးတဲ့ `https://...onrender.com` URL ကို ဖွင့်ပါ။ API health စစ်ရန် `/api/health` ကိုဖွင့်ပြီး `{"ok":true}` ပြန်လာကြောင်း စစ်ပါ။

## Local run
Node.js 20+ လိုအပ်သည်။
1. `npm install`
2. `.env.example` ကို `.env` အဖြစ်ကူးပြီး `OPENAI_API_KEY` နှင့် `JWT_SECRET` ဖြည့်ပါ။
3. Terminal 1: `npm run server`
4. Terminal 2: `npm run dev`
5. Local Vite URL ကိုဖွင့်ပါ။

## Features
- Mobile-first Myanmar UI
- Register / Login (bcrypt + JWT; demo JSON storage)
- Video upload (150 MB limit)
- AI script, summary, subtitle draft
- Browser Text-to-Speech (device/browser ပေါ်မူတည်၍ မြန်မာ voice မရနိုင်)
- TXT / SRT download

## ကန့်သတ်ချက်များနှင့် Production အတွက် လိုအပ်ချက်များ
- ဒီ project သည် starter/MVP ဖြစ်သည်။
- Movie file ကို upload လုပ်ရုံဖြင့် ဇာတ်လမ်းကို အလိုအလျောက်နားလည်ဖတ်ရှုခြင်း မပါသေးပါ။ ဇာတ်လမ်းမှတ်စုကို user က ထည့်ပေးရမည်။
- MP4 video rendering/export မပါသေးပါ။ အတွက် FFmpeg၊ TTS audio generation နှင့် render job queue ကို ထပ်တည်ဆောက်ရမည်။
- `users.json` သည် စမ်းသပ်ရန်သာဖြစ်သည်။ လူအများသုံး production service အတွက် managed database (ဥပမာ PostgreSQL)၊ storage service၊ rate limiting၊ validation၊ backup နှင့် abuse controls ထည့်ပါ။
- API usage ကုန်ကျစရိတ်ရှိနိုင်သည်။ API key ကို server-side environment variable ထဲတွင်သာထားပါ။
- ရုပ်ရှင်ဖိုင်ကို တင်ခြင်း/ပြန်လည်အသုံးပြုခြင်းတွင် မူပိုင်ခွင့်နှင့် သက်ဆိုင်ရာခွင့်ပြုချက်များကို လိုက်နာပါ။

## Structure
```
movie-recap-ai/
├── index.html
├── package.json
├── .env.example
├── README.md
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   └── style.css
└── server/
    └── index.js
```
