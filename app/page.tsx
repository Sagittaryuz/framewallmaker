"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

const W = 1206, H = 2622;
type Layer = "island" | "dock" | "icons" | "widgets";

const choices: Record<Layer, {name:string; color:string}[]> = {
  island: [
    { name: "Nenhum", color: "transparent" }, { name: "Glass", color: "rgba(255,255,255,.28)" },
    { name: "Midnight", color: "rgba(5,8,18,.82)" }, { name: "Aurora", color: "rgba(123,92,255,.52)" },
  ],
  dock: [
    { name: "Nenhum", color: "transparent" }, { name: "Frost", color: "rgba(255,255,255,.24)" },
    { name: "Smoke", color: "rgba(15,20,32,.48)" }, { name: "Violet", color: "rgba(122,92,255,.36)" },
  ],
  icons: [
    { name: "Nenhum", color: "transparent" }, { name: "Outline", color: "rgba(255,255,255,.4)" },
    { name: "Dark", color: "rgba(7,10,18,.48)" }, { name: "Lilac", color: "rgba(159,125,255,.38)" },
  ],
  widgets: [
    { name: "Nenhum", color: "transparent" }, { name: "Glass", color: "rgba(255,255,255,.22)" },
    { name: "Ink", color: "rgba(9,13,24,.55)" }, { name: "Gradient", color: "rgba(103,70,255,.42)" },
  ],
};

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [active, setActive] = useState<Layer>("island");
  const [selected, setSelected] = useState<Record<Layer,number>>({ island:1, dock:1, icons:0, widgets:0 });
  const [zoom, setZoom] = useState(1);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0,0,W,H);
    if (image) {
      const s = Math.max(W/image.width,H/image.height)*zoom;
      const dw=image.width*s, dh=image.height*s;
      ctx.drawImage(image,(W-dw)/2,(H-dh)/2,dw,dh);
    } else {
      const g=ctx.createLinearGradient(0,0,W,H); g.addColorStop(0,"#17122c"); g.addColorStop(.48,"#5341b8"); g.addColorStop(1,"#f09aaa");
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      ctx.fillStyle="rgba(255,255,255,.18)"; ctx.beginPath(); ctx.arc(220,650,480,0,Math.PI*2);ctx.fill();
    }
    drawFrames(ctx, selected);
  },[image,selected,zoom]);

  function upload(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file)return;
    const img=new Image(); img.onload=()=>{setImage(img);URL.revokeObjectURL(img.src)}; img.src=URL.createObjectURL(file);
  }
  function choose(i:number){setSelected(s=>({...s,[active]:i}));setDone(false)}
  function download(){const a=document.createElement("a");a.download="framewallmaker-iphone-17-pro.png";a.href=canvasRef.current!.toDataURL("image/png");a.click()}

  return <main>
    <nav><a className="brand" href="#">framewall<span>maker</span></a><div className="navMeta"><b>iPhone 17 Pro</b><span>1206 × 2622 px</span></div></nav>
    <section className="hero">
      <div className="copy"><span className="eyebrow">WALLPAPER STUDIO</span><h1>Seu wallpaper.<br/><em>Perfeitamente enquadrado.</em></h1><p>Envie uma imagem, escolha os frames e exporte no tamanho exato do seu iPhone 17 Pro.</p><button className="primary" onClick={()=>fileRef.current?.click()}>Carregar imagem <span>↗</span></button><input ref={fileRef} hidden type="file" accept="image/*" onChange={upload}/><small>JPG, PNG ou HEIC · Processamento no seu aparelho</small></div>
      <div className="editorShell">
        <button className="side left" aria-label="Voltar" onClick={()=>setDone(false)}>←<small>Voltar</small></button>
        <div className={`phone ${done?"finished":""}`}>
          <canvas ref={canvasRef} width={W} height={H}/>
          <div className="phoneLabel"><i/> PRÉ-VISUALIZAÇÃO</div>
        </div>
        <button className="side right" aria-label="Concluir" onClick={()=>setDone(true)}>✓<small>Concluir</small></button>
        <div className="zoom"><span>−</span><input aria-label="Zoom" type="range" min="1" max="2" step=".05" value={zoom} onChange={e=>setZoom(+e.target.value)}/><span>+</span></div>
      </div>
    </section>
    <section className="studio">
      <div className="tabs">{(["island","dock","icons","widgets"] as Layer[]).map(x=><button key={x} className={active===x?"active":""} onClick={()=>setActive(x)}>{x==="island"?"Notch":x==="dock"?"Dock":x==="icons"?"Ícones":"Widgets"}</button>)}</div>
      <div className="styles">{choices[active].map((x,i)=><button key={x.name} className={selected[active]===i?"chosen":""} onClick={()=>choose(i)}><span style={{background:x.color}}/><b>{x.name}</b>{selected[active]===i&&<i>✓</i>}</button>)}</div>
      <button className="download" disabled={!done} onClick={download}>{done?"Baixar wallpaper em alta resolução":"Conclua as edições para baixar"}<span>↓</span></button>
    </section>
    <footer><b>Feito para iPhone 17 Pro</b><span>As molduras seguem a grade visual do iOS 26. A posição pode variar conforme o layout dos ícones.</span></footer>
  </main>
}

function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function drawFrames(ctx:CanvasRenderingContext2D,s:Record<Layer,number>){
  const island=choices.island[s.island].color; if(island!=="transparent"){ctx.fillStyle=island;ctx.shadowColor="rgba(0,0,0,.25)";ctx.shadowBlur=25;rr(ctx,402,48,402,112,58);ctx.shadowBlur=0}
  const dock=choices.dock[s.dock].color; if(dock!=="transparent"){ctx.fillStyle=dock;ctx.strokeStyle="rgba(255,255,255,.28)";ctx.lineWidth=3;rr(ctx,54,2268,1098,270,86);ctx.stroke()}
  const icon=choices.icons[s.icons].color; if(icon!=="transparent"){ctx.fillStyle=icon;ctx.strokeStyle="rgba(255,255,255,.28)";ctx.lineWidth=3;for(const x of [72,348,624,900])for(const y of [342,630,918,1206,1494,1782]){rr(ctx,x,y,234,234,56);ctx.stroke()}}
  const widget=choices.widgets[s.widgets].color; if(widget!=="transparent"){ctx.fillStyle=widget;ctx.strokeStyle="rgba(255,255,255,.3)";ctx.lineWidth=3;rr(ctx,66,330,501,501,72);ctx.stroke();rr(ctx,66,876,1074,501,72);ctx.stroke();rr(ctx,66,1422,1074,1062,72);ctx.stroke()}
}
