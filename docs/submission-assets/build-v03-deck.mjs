import fs from "node:fs/promises";
import { Presentation, PresentationFile } from "file:///C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const OUT = "C:/Users/user/Documents/New project/arc-creator-settlement/docs/submission-assets";
const receipt = "C:/Users/user/Documents/New project/arc-creator-settlement/docs/evidence/arc-creator-settlement-receipt.png";
const scan = "C:/Users/user/Documents/New project/arc-creator-settlement/docs/evidence/arcscan-payment-release.png";
const W=1280,H=720,M=58, BLACK="#111111", MUTED="#69645B", LINE="#D7D2C9", PANEL="#F3F1EC", GREEN="#9CFF2E", PURPLE="#6E2AE6", CYAN="#32E6C3";

async function img(path){ const b=await fs.readFile(path); return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength); }
function box(s,x,y,w,h,fill=PANEL,line="none",r="rounded-xl") { const cfg={geometry:r==="none"?"rect":"roundRect",position:{left:x,top:y,width:w,height:h},fill,line:{style:"solid",fill:line,width:line==="none"?0:1}}; if(r!=="none") cfg.borderRadius=r; return s.shapes.add(cfg); }
function txt(s,text,x,y,w,h,size=22,bold=false,color=BLACK,align="left") { const z=s.shapes.add({geometry:"textbox",position:{left:x,top:y,width:w,height:h},fill:"none",line:{style:"solid",fill:"none",width:0}}); z.text=text; z.text.style={fontFamily:"Arial",fontSize:size,bold,color,alignment:align}; return z; }
function line(s,x,y,w,color=LINE,width=2){ return s.shapes.add({geometry:"rect",position:{left:x,top:y,width:w,height:width},fill:color,line:{style:"solid",fill:"none",width:0}}); }
function base(p,title,kicker="ARC CREATOR SETTLEMENT · V0.3") { const s=p.slides.add(); s.background.fill="#FFFFFF"; txt(s,kicker,M,30,700,25,15,true,MUTED); txt(s,title,M,68,1164,72,42,true); line(s,M,148,1164); return s; }
function notes(s,body){ s.speakerNotes.textFrame.setText(body+"\n\n[Sources]\n- https://github.com/3624341/arc-creator-settlement\n- https://arc-creator-settlement-v0-2.vercel.app\n- https://testnet.arcscan.app/tx/0xdf8a7711dcbe31f07bc1f61d1492d07a0b490f45dd3b0566eaddce5deb6eb856\n[/Sources]"); }

const p=Presentation.create({slideSize:{width:W,height:H}});

{
 const s=p.slides.add(); s.background.fill="#FFFFFF";
 box(s,0,0,18,H,GREEN,"none","none");
 txt(s,"ARC · CIRCLE · USDC",M,58,500,28,17,true,PURPLE);
 txt(s,"Creator payments,\nsettled by milestone.",M,145,760,190,64,true);
 txt(s,"Arc Creator Settlement v0.3",M,380,600,40,25,true);
 txt(s,"A working Arc Testnet escrow with Circle Wallets, programmable USDC releases, and public onchain receipts.",M,430,740,95,24,false,MUTED);
 box(s,860,95,330,500,BLACK,"none","rounded-2xl"); txt(s,"LIVE PROOF",900,135,240,25,16,true,CYAN); txt(s,"0.25",900,210,250,90,70,true,"#FFFFFF"); txt(s,"USDC released",900,300,240,32,24,true,"#FFFFFF"); line(s,900,365,240,"#444444",1); txt(s,"Arc Testnet\nBlock 59,934,707\nReceipt verified",900,405,240,120,21,false,"#DDDDDD");
 notes(s,"Open with the shipped result: the product is live on Arc Testnet and a milestone payment has been verified onchain.");
}
{
 const s=base(p,"Cross-border project work still settles outside the agreement");
 txt(s,"The contract, delivery approval, payment rail, and proof of payment usually live in separate systems.",M,178,1120,58,25,false,MUTED);
 const items=[["01","Agreement","Terms live in chat, docs, or a marketplace database."],["02","Delivery","Milestones are approved manually and inconsistently."],["03","Payment","Bank rails add delay, FX friction, and reconciliation."],["04","Proof","Receipts are platform records—not independently verifiable."]];
 items.forEach((a,i)=>{const y=275+i*82; txt(s,a[0],M,y,55,38,23,true,PURPLE); txt(s,a[1],130,y,220,36,25,true); txt(s,a[2],365,y,800,50,21,false,MUTED); if(i<3)line(s,130,y+60,1030);});
 notes(s,"Frame the problem as operational fragmentation, not only payment speed.");
}
{
 const s=base(p,"One escrow makes milestone releases verifiable");
 const steps=[["1","Create","Client defines creator, value, and four milestones."],["2","Fund","USDC moves into the Arc escrow."],["3","Submit","Creator marks a milestone delivered."],["4","Release","Client approves; USDC transfers onchain."],["5","Verify","A public receipt reads the confirmed transaction."]];
 steps.forEach((a,i)=>{const x=M+i*232; box(s,x,215,205,330,i===3?"#EDE4FF":PANEL); txt(s,a[0],x+20,235,55,44,34,true,i===3?PURPLE:BLACK); txt(s,a[1],x+20,305,165,35,25,true); txt(s,a[2],x+20,360,165,125,19,false,MUTED); if(i<4){txt(s,"→",x+203,345,30,40,28,true,PURPLE,"center");}});
 txt(s,"The same state powers settlement operations and the public receipt.",M,600,1120,40,23,true);
 notes(s,"Walk through the end-to-end product flow shown in the live demo.");
}
{
 const s=base(p,"Arc settles; Circle authorizes the wallet");
 const cols=[["CLIENT","Circle user-owned wallet\nApproves USDC operations"],["APPLICATION","Next.js + API routes\nContract and receipt UX"],["ARC TESTNET","EscrowFactory + Escrow\nUSDC milestone state"],["PUBLIC PROOF","ArcScan + receipt URL\nIndependent verification"]];
 cols.forEach((a,i)=>{const x=M+i*292; box(s,x,225,258,280,i===2?"#E5FFF8":PANEL); txt(s,a[0],x+22,250,210,25,15,true,i===2?"#007C68":MUTED); txt(s,a[1],x+22,310,210,100,23,true); if(i<3)txt(s,"→",x+255,335,38,45,30,true,PURPLE,"center");});
 txt(s,"No seed phrase is handled by the app. The server uses Circle credentials; secrets never enter the browser bundle.",M,570,1120,58,21,false,MUTED);
 notes(s,"Explain the actual architecture and the boundary between user authorization, server credentials, and Arc contracts.");
}
{
 const s=base(p,"The v0.3 path is deployed and exercised end to end","VERIFIED IMPLEMENTATION");
 const stats=[["1 USDC","Escrow funded"],["0.25 USDC","Milestone released"],["4","Milestones encoded"],["19 + 2","Web + Solidity tests"]];
 stats.forEach((a,i)=>{const x=M+(i%2)*575,y=200+Math.floor(i/2)*195; box(s,x,y,540,160,i===1?"#EDE4FF":PANEL); txt(s,a[0],x+26,y+28,480,58,43,true,i===1?PURPLE:BLACK); txt(s,a[1],x+26,y+102,480,30,20,false,MUTED);});
 notes(s,"Use only verified project facts: deployed escrow, funded amount, released milestone, and passing tests.");
}
{
 const s=base(p,"A confirmed Arc transaction becomes a readable public receipt","ONCHAIN EVIDENCE");
 s.images.add({blob:await img(receipt),contentType:"image/png",alt:"Arc Creator Settlement public receipt showing a confirmed 0.25 USDC milestone payment",fit:"contain",position:{left:70,top:175,width:650,height:475}});
 box(s,760,180,455,430,BLACK); txt(s,"PAYMENT RELEASED",795,215,350,25,16,true,CYAN); txt(s,"0.25 USDC",795,265,370,60,45,true,"#FFFFFF"); txt(s,"Transaction",795,370,160,24,16,true,"#AAAAAA"); txt(s,"0xdf8a7711…eb856",795,400,370,34,21,true,"#FFFFFF"); txt(s,"Escrow",795,465,160,24,16,true,"#AAAAAA"); txt(s,"0x22De463e…D81Df",795,495,370,34,21,true,"#FFFFFF"); txt(s,"Block 59,934,707",795,555,350,30,20,true,GREEN);
 notes(s,"Show the public receipt. Amount, milestone, recipient, block, escrow, and transaction hash are read from confirmed Arc data.");
}
{
 const s=base(p,"ArcScan independently confirms the USDC transfer","CHAIN-LEVEL PROOF");
 s.images.add({blob:await img(scan),contentType:"image/png",alt:"ArcScan transaction details confirming a 0.25 USDC transfer",fit:"contain",position:{left:55,top:170,width:790,height:500}});
 txt(s,"SUCCESS",900,220,260,42,34,true,"#149A55"); txt(s,"0.25 USDC",900,300,270,52,40,true); txt(s,"to creator wallet",900,355,270,30,21,false,MUTED); line(s,900,420,250); txt(s,"Transaction fee\n0.004082715 USDC",900,455,270,80,21,true); txt(s,"Confirmed in <0.52 sec",900,565,270,32,19,true,PURPLE);
 notes(s,"Use ArcScan as independent confirmation. The screenshot shows success, token transfer, block, timestamp, and fee.");
}
{
 const s=base(p,"The MVP is a product surface, not a contract-only demo");
 const items=[["Circle Wallet","Reload or create a user-owned Arc wallet and display USDC balance."],["Settlement dashboard","Approve, deposit, submit, and release each milestone."],["Public receipts","Share a read-only link that anyone can verify against ArcScan."],["Recovery-safe setup","Entity-secret recovery workflow is tested and excluded from Git."]];
 items.forEach((a,i)=>{const x=M+(i%2)*575,y=200+Math.floor(i/2)*190; txt(s,`0${i+1}`,x,y,60,35,20,true,PURPLE); txt(s,a[0],x+75,y,440,36,25,true); txt(s,a[1],x+75,y+50,440,80,20,false,MUTED);});
 notes(s,"Summarize the working surfaces demonstrated in the video and repository.");
}
{
 const s=base(p,"The next grant phase converts proof into reusable infrastructure");
 const ms=[["0–4 weeks","Harden settlement","Role checks, state validation, failure UX, deterministic deployment."],["4–10 weeks","Add observability","Indexed events, operational views, reusable marketplace APIs."],["10–18 weeks","Prototype funding","Circle Gateway exploration for cross-chain USDC entry."],["18–30 weeks","Review + pilot","Focused security review and controlled creator marketplace pilot."]];
 ms.forEach((a,i)=>{const x=M+i*292; txt(s,a[0],x,205,250,28,17,true,PURPLE); line(s,x,252,250,i===0?PURPLE:LINE,4); txt(s,a[1],x,285,250,55,24,true); txt(s,a[2],x,360,245,120,19,false,MUTED);});
 txt(s,"Outcome: a settlement primitive that marketplaces can integrate—not another closed payment ledger.",M,590,1120,42,23,true);
 notes(s,"Close the roadmap with concrete post-v0.3 work. Gateway is planned, not claimed as implemented.");
}
{
 const s=p.slides.add(); s.background.fill=BLACK; txt(s,"The proof exists.\nNow make it reusable.",M,95,850,150,58,true,"#FFFFFF"); txt(s,"Arc Creator Settlement v0.3",M,295,600,38,26,true,GREEN); line(s,M,360,1140,"#3A3A3A",2); txt(s,"Live demo",M,405,180,26,16,true,"#AAAAAA"); txt(s,"arc-creator-settlement-v0-2.vercel.app",M,440,560,38,22,true,"#FFFFFF"); txt(s,"GitHub",M,515,180,26,16,true,"#AAAAAA"); txt(s,"github.com/3624341/arc-creator-settlement",M,550,600,38,22,true,"#FFFFFF"); txt(s,"Arc Testnet · Chain ID 5042002",860,570,340,30,18,true,CYAN,"right"); notes(s,"End with the requested decision: support the hardening, observability, Gateway prototype, and pilot phase.");
}

await fs.mkdir(OUT,{recursive:true});
for (const [i,s] of p.slides.items.entries()) { const png=await p.export({slide:s,format:"png",scale:1}); await fs.writeFile(`${OUT}/deck-slide-${String(i+1).padStart(2,"0")}.png`,new Uint8Array(await png.arrayBuffer())); const lay=await s.export({format:"layout"}); await fs.writeFile(`${OUT}/deck-slide-${String(i+1).padStart(2,"0")}.layout.json`,await lay.text()); }
const montage=await p.export({format:"webp",montage:true,scale:1}); await fs.writeFile(`${OUT}/Arc-Creator-Settlement-v0.3-deck-montage.webp`,new Uint8Array(await montage.arrayBuffer()));
const pptx=await PresentationFile.exportPptx(p); await pptx.save(`${OUT}/Arc-Creator-Settlement-v0.3-Investor-Deck.pptx`);
