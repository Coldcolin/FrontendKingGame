// Builds the sandboxed render frame. Mirrors backend/src/grading/document.ts
// (same reset, same CSP, same Tailwind runtime) so live scores track the
// official grader. The frame runs in an opaque origin (sandbox without
// allow-same-origin) and only talks to the parent through postMessage.

const RESET = `*,*::before,*::after{box-sizing:border-box}
html,body{margin:0!important;padding:0!important;width:600px!important;height:400px!important;overflow:hidden!important;background:#fff!important}
#root{position:relative!important;width:600px!important;height:400px!important;overflow:hidden!important}`;

// Runs inside the frame. Kept as a plain string: it cannot import modules.
const RUNNER = `
const BLOCKED_TAGS=/<\\s*\\/?\\s*(script|iframe|object|embed|link|meta|base|frame|frameset)\\b[^>]*>/gi;
const SCRIPT_BLOCKS=/<\\s*script\\b[\\s\\S]*?<\\s*\\/\\s*script\\s*>/gi;
const EVENT_ATTRS=/\\s+on[a-z]+\\s*=\\s*("[^"]*"|'[^']*'|[^\\s>]+)/gi;
const JS_URLS=/(href|src|xlink:href)\\s*=\\s*("|')\\s*javascript:[^"']*\\2/gi;
const clean=(c)=>c.replace(SCRIPT_BLOCKS,"").replace(BLOCKED_TAGS,"").replace(EVENT_ATTRS,"").replace(JS_URLS,"");
const root=document.getElementById("root");
const wait=(ms)=>new Promise((r)=>setTimeout(r,ms));
let seq=0;
async function render(code,id){
  root.innerHTML=clean(code);
  await wait(120);
  if(id!==seq)return;
  try{
    const png=await htmlToImage.toPng(root,{width:600,height:400,pixelRatio:1,skipFonts:true,cacheBust:false,backgroundColor:"#ffffff"});
    if(id===seq)parent.postMessage({type:"render",id,png},"*");
  }catch(e){parent.postMessage({type:"render-error",id,message:String(e)},"*");}
}
addEventListener("message",(e)=>{
  if(e.source!==parent||!e.data||e.data.type!=="code")return;
  seq=e.data.id;render(String(e.data.code),seq);
});
parent.postMessage({type:"ready"},"*");
`;

export function sandboxDocument(origin: string, nonce: string) {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; font-src data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'">
<style>${RESET}</style>
<script nonce="${nonce}" src="${origin}/sandbox/tailwind.js"></script>
<script nonce="${nonce}" src="${origin}/sandbox/html-to-image.js"></script>
</head><body><div id="root"></div><script nonce="${nonce}">${RUNNER}</script></body></html>`;
}
