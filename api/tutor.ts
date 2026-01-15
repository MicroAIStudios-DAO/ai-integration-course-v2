import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

function cosine(a: number[], b: number[]) {
  let dot=0,na=0,nb=0; for (let i=0;i<Math.min(a.length,b.length);i++){ dot+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; }
  return dot/(Math.sqrt(na)*Math.sqrt(nb)+1e-9);
}
function chunkText(s: string, size=900, overlap=100){ const out: {text:string,start:number,end:number,idx:number}[]=[]; let i=0,idx=0; const n=s.length; while(i<n){ const end=Math.min(i+size,n); out.push({text:s.slice(i,end),start:i,end,idx:idx++}); if(end===n)break; i=end-overlap;} return out; }

async function openaiEmbeddings(input: string[], key: string){
  const res = await fetch('https://api.openai.com/v1/embeddings', { method: 'POST', headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${key}` }, body: JSON.stringify({ model:'text-embedding-3-small', input })});
  if (!res.ok) throw new Error('Embedding error');
  const j:any = await res.json();
  return j.data.map((d:any)=>d.embedding as number[]);
}

async function* openaiStream(messages:any[], key:string, modelCandidates:string[]){
  const tryModels = [...modelCandidates, 'gpt-4o-mini', 'gpt-3.5-turbo'].filter((v,i,a)=>a.indexOf(v)===i);
  let lastErr:any=null;
  for(const model of tryModels){
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', { method:'POST', headers:{ 'Content-Type':'application/json','Authorization':`Bearer ${key}`}, body: JSON.stringify({ model, messages, temperature:0.2, stream:true, max_tokens:800 })});
      if (!res.ok || !res.body) throw new Error(`Chat error ${res.status}`);
      const reader = res.body.getReader(); const decoder = new TextDecoder('utf-8'); let buf='';
      while(true){ const {done,value}=await reader.read(); if(done) break; buf+=decoder.decode(value,{stream:true}); const lines=buf.split(/\n/); buf=lines.pop()||''; for(const line of lines){ if(!line.startsWith('data: ')) continue; const payload=line.slice(6).trim(); if(payload==='[DONE]') return; try { const j=JSON.parse(payload); const delta=j.choices?.[0]?.delta?.content; if(delta) yield delta as string; } catch{} } }
      return;
    } catch(e){ lastErr=e; continue; }
  }
  throw lastErr||new Error('All model candidates failed');
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') { res.setHeader('Allow',['POST']); res.status(405).end('Method Not Allowed'); return; }
  try{
    const { lessonId, question } = req.body || {};
    if(!lessonId || !question){ res.status(400).send('Missing lessonId/question'); return; }
    // If a Firebase Function endpoint is provided, proxy to it (preferred in production)
    const tutorUrl = process.env.FIREBASE_TUTOR_URL || 'https://us-central1-ai-integra-course-v2.cloudfunctions.net/tutor';
    try {
      const upstream = await fetch(tutorUrl, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ lessonId, question }) });
      res.setHeader('Content-Type','text/plain; charset=utf-8');
      if (upstream.ok && upstream.body) {
        const reader = (upstream.body as any).getReader?.();
        const decoder = new TextDecoder('utf-8');
        if (reader) {
          while (true) { const { done, value } = await reader.read(); if (done) break; res.write(decoder.decode(value, { stream: true })); }
          res.end();
          return;
        }
        const text = await upstream.text();
        res.status(upstream.status).send(text);
        return;
      }
    } catch { /* fall back to local mode below */ }

    // Fallback when Firebase Function is not reachable: lightweight local response
    const key = process.env.OPENAI_API_KEY;
    if(!key){ res.status(500).send('Missing OPENAI_API_KEY'); return; }
    const lessonText = (process.env.TUTOR_FAKE_LESSON || '').toString();
    if(!lessonText){
      res.setHeader('Content-Type','text/plain; charset=utf-8');
      res.write('The AI Tutor backend is configured. Firestore access will be wired on deployment.');
      res.end();
      return;
    }

    const chunks = chunkText(lessonText);
    const inputs = [question, ...chunks.map(c=>c.text)];
    const embs = await openaiEmbeddings(inputs, key);
    const qv = embs[0]; const cv = embs.slice(1);
    const ranked = chunks.map((c,i)=>({c,score:cosine(qv,cv[i])})).sort((a,b)=>b.score-a.score).slice(0,4).map(x=>x.c);

    const sysPath = path.join(process.cwd(),'prompts','tutor_system.txt');
    const systemPrompt = fs.existsSync(sysPath) ? fs.readFileSync(sysPath,'utf-8') : 'You are an AI Tutor.';
    let context = ranked.map((r,idx)=>`[Section ${idx+1} :: ${r.start}-${r.end}]\n${r.text}`).join('\n\n');
    const messages = [ { role:'system', content: systemPrompt }, { role:'user', content: `Lesson Context:\n${context}\n\nQuestion: ${question}` } ];
    const modelPref = process.env.OPENAI_TUTOR_MODEL || 'o3-mini';
    res.setHeader('Content-Type','text/plain; charset=utf-8');
    const stream = openaiStream(messages, key, [modelPref]);
    for await (const token of stream) { res.write(token); }
    res.end();
  } catch(e:any){
    res.status(500).send(e?.message||'Tutor error');
  }
}
