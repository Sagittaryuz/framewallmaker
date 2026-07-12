"use client";
import { ChangeEvent, useEffect, useRef, useState } from "react";

const W=1206,H=2622;
type Layer="island"|"dock"|"icons"|"widgets";
type Choice={name:string;color:string;kind?:"extended"};
const choices:Record<Layer,Choice[]>={
 island:[{name:"Sem moldura",color:"transparent"},{name:"Glass",color:"rgba(255,255,255,.28)"},{name:"Midnight",color:"rgba(5,8,18,.82)"},{name:"Aurora",color:"rgba(123,92,255,.52)"},{name:"Glass estendido",color:"rgba(255,255,255,.28)",kind:"extended"}],
 dock:[{name:"Sem moldura",color:"transparent"},{name:"Frost",color:"rgba(255,255,255,.24)"},{name:"Smoke",color:"rgba(15,20,32,.48)"},{name:"Violet",color:"rgba(122,92,255,.36)"}],
 icons:[{name:"Sem moldura",color:"transparent"},{name:"Outline",color:"rgba(255,255,255,.4)"},{name:"Dark",color:"rgba(7,10,18,.48)"},{name:"Lilac",color:"rgba(159,125,255,.38)"}],
 widgets:[{name:"Sem moldura",color:"transparent"},{name:"Glass",color:"rgba(255,255,255,.22)"},{name:"Ink",color:"rgba(9,13,24,.55)"},{name:"Gradient",color:"rgba(103,70,255,.42)"}]
};
const labels:Record<Layer,string>={island:"Notch",dock:"Dock",icons:"Ícones",widgets:"Widget"};

export default function Home(){
 const canvasRef=useRef<HTMLCanvasElement>(null),fileRef=useRef<HTMLInputElement>(null);
 const[image,setImage]=useState<HTMLImageElement|null>(null),[stage,setStage]=useState<"home"|"editor">("home"),[panel,setPanel]=useState<Layer|null>(null),[selected,setSelected]=useState<Record<Layer,number>>({island:0,dock:0,icons:0,widgets:0});
 useEffect(()=>{const c=canvasRef.current;if(!c||!image)return;const ctx=c.getContext("2d");if(!ctx)return;const scale=Math.max(W/image.width,H/image.height),dw=image.width*scale,dh=image.height*scale;ctx.clearRect(0,0,W,H);ctx.drawImage(image,(W-dw)/2,(H-dh)/2,dw,dh);drawFrames(ctx,selected)},[image,selected,stage]);
 function upload(e:ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];if(!file)return;const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{setImage(img);setStage("editor");URL.revokeObjectURL(url)};img.src=url}
 function finish(){const c=canvasRef.current;if(!c)return;c.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="framewallmaker-iphone-17-pro.png";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)},"image/png",1)}
 if(stage==="home")return <main className="home"><div className="homeCard"><div className="mark">FW</div><p className="kicker">FRAMEWALLMAKER</p><h1>Crie seu wallpaper.</h1><p className="subtitle">Molduras precisas para a tela do iPhone 17 Pro.</p><button className="upload" onClick={()=>fileRef.current?.click()}>Selecionar imagem <span>↑</span></button><input ref={fileRef} hidden type="file" accept="image/*" onChange={upload}/><small>1206 × 2622 px · A imagem permanece no seu aparelho</small></div></main>;
 return <main className="editor">
  <div className="wallpaper"><canvas ref={canvasRef} width={W} height={H}/></div>
  <button className="glassCircle back" aria-label="Retornar" onClick={()=>{setPanel(null);setStage("home")}}>←</button>
  <div className="tools">{(["island","dock","icons","widgets"] as Layer[]).map(x=><button key={x} className={`glassCircle tool ${panel===x?"active":""}`} onClick={()=>setPanel(x)}><span>{x==="island"?"◒":x==="dock"?"▱":x==="icons"?"▦":"□"}</span><small>{labels[x]}</small></button>)}<button className="glassCircle tool finish" onClick={finish}><span>↓</span><small>Concluir</small></button></div>
  {panel&&<div className="overlay" onClick={()=>setPanel(null)}><section className="drawer" onClick={e=>e.stopPropagation()}><div className="handle"/><p className="drawerKicker">ESCOLHA UM ESTILO</p><h2>{labels[panel]}</h2><div className="choiceList">{choices[panel].map((x,i)=><button key={x.name} className={selected[panel]===i?"selected":""} onClick={()=>{setSelected(s=>({...s,[panel]:i}));setPanel(null)}}><span className="swatch" style={{background:x.color}}/><b>{x.name}</b><i>{selected[panel]===i?"✓":"›"}</i></button>)}</div></section></div>}
 </main>
}
function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function drawFrames(ctx:CanvasRenderingContext2D,s:Record<Layer,number>){const island=choices.island[s.island];if(island.color!=="transparent"){ctx.fillStyle=island.color;ctx.strokeStyle="rgba(255,255,255,.25)";ctx.lineWidth=3;ctx.shadowColor="rgba(0,0,0,.22)";ctx.shadowBlur=24;if(island.kind==="extended")rr(ctx,48,48,W-96,112,56);else rr(ctx,402,48,402,112,56);ctx.stroke();ctx.shadowBlur=0}const dock=choices.dock[s.dock].color;if(dock!=="transparent"){ctx.fillStyle=dock;ctx.strokeStyle="rgba(255,255,255,.28)";ctx.lineWidth=3;rr(ctx,54,2268,1098,270,86);ctx.stroke()}const icon=choices.icons[s.icons].color;if(icon!=="transparent"){ctx.fillStyle=icon;ctx.strokeStyle="rgba(255,255,255,.28)";ctx.lineWidth=3;for(const x of [72,348,624,900])for(const y of [342,630,918,1206,1494,1782]){rr(ctx,x,y,234,234,56);ctx.stroke()}}const widget=choices.widgets[s.widgets].color;if(widget!=="transparent"){ctx.fillStyle=widget;ctx.strokeStyle="rgba(255,255,255,.3)";ctx.lineWidth=3;rr(ctx,66,330,501,501,72);ctx.stroke();rr(ctx,66,876,1074,501,72);ctx.stroke();rr(ctx,66,1422,1074,1062,72);ctx.stroke()}}
