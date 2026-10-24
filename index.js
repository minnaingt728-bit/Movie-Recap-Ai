import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
dotenv.config();
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();app.use(cors());app.use(express.json({limit:'2mb'}));
const root=path.resolve(__dirname,'..');
const dataDir=process.env.DATA_DIR || path.join(root,'data');
const uploadDir=path.join(dataDir,'uploads');
fs.mkdirSync(uploadDir,{recursive:true});
fs.mkdirSync(dataDir,{recursive:true});
const usersFile=path.join(dataDir,'users.json');if(!fs.existsSync(usersFile))fs.writeFileSync(usersFile,'[]');
app.use(express.static(path.join(root,'dist')));
const storage=multer.diskStorage({destination:(_,__,cb)=>cb(null,uploadDir),filename:(_,file,cb)=>cb(null,Date.now()+'-'+file.originalname.replace(/[^a-zA-Z0-9._-]/g,'_'))});
const upload=multer({storage,limits:{fileSize:150*1024*1024},fileFilter:(_,f,cb)=>cb(null,f.mimetype.startsWith('video/'))});
const secret=process.env.JWT_SECRET||'development-only-change-me';
function readUsers(){return JSON.parse(fs.readFileSync(usersFile,'utf8'))}function writeUsers(u){fs.writeFileSync(usersFile,JSON.stringify(u,null,2))}
function auth(req,res,next){try{const h=req.headers.authorization||'';req.user=jwt.verify(h.replace(/^Bearer /,''),secret);next()}catch{return res.status(401).json({error:'ဆက်လက်လုပ်ဆောင်ရန် အကောင့်ဝင်ပါ။'})}}
app.post('/api/auth/register',async(req,res)=>{const {email,password}=req.body||{};if(!email||!password||password.length<6)return res.status(400).json({error:'Email နှင့် Password အနည်းဆုံး ၆ လုံး ထည့်ပါ။'});const users=readUsers();if(users.some(u=>u.email===email.toLowerCase()))return res.status(409).json({error:'ဒီ Email ဖြင့် အကောင့်ရှိပြီးသားပါ။'});const user={id:Date.now().toString(),email:email.toLowerCase(),password:await bcrypt.hash(password,10)};users.push(user);writeUsers(users);res.json({token:jwt.sign({id:user.id,email:user.email},secret,{expiresIn:'7d'})})});
app.post('/api/auth/login',async(req,res)=>{const {email,password}=req.body||{};const user=readUsers().find(u=>u.email===String(email||'').toLowerCase());if(!user||!await bcrypt.compare(password||'',user.password))return res.status(401).json({error:'Email သို့မဟုတ် Password မှားနေပါတယ်။'});res.json({token:jwt.sign({id:user.id,email:user.email},secret,{expiresIn:'7d'})})});
app.post('/api/upload',auth,(req,res)=>upload.single('movie')(req,res,err=>{if(err)return res.status(400).json({error:err.code==='LIMIT_FILE_SIZE'?'ဖိုင်အရွယ်အစား 150MB ထက်မကျော်ရပါ။':'Video ဖိုင်တင်ရာတွင် အမှားရှိပါသည်။'});if(!req.file)return res.status(400).json({error:'Video ဖိုင်ကို ရွေးချယ်ပါ။'});res.json({filename:req.file.filename,size:req.file.size,message:'Uploaded'})}));
app.post('/api/generate',auth,async(req,res)=>{const {kind,title='ရုပ်ရှင်',language='မြန်မာဘာသာ',tone='စိတ်ဝင်စားဖွယ်',minutes='3',source=''}=req.body||{};if(!['script','summary','subtitle'].includes(kind))return res.status(400).json({error:'မသိသောအလုပ်အမျိုးအစား'});if(process.env.OPENAI_API_KEY){try{const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});const task=kind==='script'?'You are a movie recap scriptwriter. Write an original recap narration; do not reproduce dialogue or large copyrighted passages.':kind==='summary'?'Summarize the supplied movie information accurately. Do not invent plot details not provided.':'Create a short sample SRT subtitle from the supplied narration. Use simple sequential timestamps and label it as a draft.';const prompt=`Language: ${language}. Movie: ${title}. Tone: ${tone}. Target length: ${minutes} minutes. User-provided plot notes/source: ${source||'(not supplied)'}. If plot information is missing, ask for it instead of fabricating specific events. Output only the requested ${kind}.`;const out=await client.chat.completions.create({model:'gpt-4o-mini',messages:[{role:'system',content:task},{role:'user',content:prompt}]});return res.json({text:out.choices[0]?.message?.content||''})}catch(e){console.error(e.message);return res.status(502).json({error:'AI ဝန်ဆောင်မှု ချိတ်ဆက်မရပါ။ API Key ကိုစစ်ပါ။'})}}
const safeTitle=String(title).trim()||'ရုပ်ရှင်';
let text='';
if(kind==='script')text=`[Demo Script — ဇာတ်လမ်းအချက်အလက်ကို ပြန်စစ်ပါ]\n\n${safeTitle} အကြောင်းကို စိတ်ဝင်စားဖွယ် ပြန်လည်တင်ဆက်သွားမှာ ဖြစ်ပါတယ်။\n\n${source?'သင်ပေးထားသော အချက်အလက်များအရ '+source:'ဇာတ်လမ်းအကျဉ်း၊ အဓိကဇာတ်ကောင်များနှင့် အရေးကြီးဖြစ်ရပ်များကို ထည့်သွင်းပေးပါ။'}\n\nမှတ်ချက် - ဒီစာသားသည် Demo Template ဖြစ်ပြီး ဇာတ်ကားအကြောင်းအရာအမှန်ကို ကိုယ်တိုင်ဖြည့်စွက်စစ်ဆေးပါ။`;
else if(kind==='summary')text=`${safeTitle} — အကျဉ်းချုပ်\n\n${source||'ဇာတ်လမ်းအကျဉ်းကို မထည့်ရသေးပါ။ ဇာတ်လမ်းအချက်အလက်ကို ထည့်ပြီး ပြန်လည်ဖန်တီးပါ။'}\n\nမှတ်ချက် - ပေးထားသောအချက်အလက်ကို အခြေခံထားသော Draft ဖြစ်သည်။`;
else text=`1\n00:00:00,000 --> 00:00:04,000\n${safeTitle} အကြောင်းကို စိတ်ဝင်စားဖွယ် ပြန်လည်တင်ဆက်သွားမှာ ဖြစ်ပါတယ်။\n\n2\n00:00:04,000 --> 00:00:08,000\n${source?'ဇာတ်လမ်းအချက်အလက်: '+source:'သင့်ဇာတ်ကြောင်းနှင့် ကိုက်ညီအောင် ဒီစာတန်းကို ပြင်ဆင်ပါ။'}\n`;
res.json({text})});
app.get('/api/health',(_,res)=>res.json({ok:true}));
app.get(/.*/, (req,res,next)=> {
  if (req.path.startsWith('/api/')) return next();
  const indexFile=path.join(root,'dist','index.html');
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  return res.status(404).send('Frontend build not found. Run npm run build.');
});
const port=process.env.PORT||10000;app.listen(port,'0.0.0.0',()=>console.log(`Movie Recap app listening on port ${port}`));