"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

const W = 1206;
const H = 2622;

type Layer = "island" | "dock" | "icons" | "widgets";
type Choice = { name: string; color: string; kind?: "solid" | "extended" };
type WidgetSize = "2x2" | "4x2" | "4x4";
type WidgetPlacement = { id: string; size: WidgetSize; row: number; col: number };

const choices: Record<Layer, Choice[]> = {
  island: [
    { name: "Sem moldura", color: "transparent" },
    { name: "Glass", color: "rgba(255,255,255,.28)" },
    { name: "Midnight", color: "rgba(5,8,18,.82)" },
    { name: "Aurora", color: "rgba(123,92,255,.52)" },
    { name: "Notch estendido", color: "#000000", kind: "extended" },
    { name: "Cor sólida", color: "#000000", kind: "solid" },
  ],
  dock: [
    { name: "Sem moldura", color: "transparent" },
    { name: "Frost", color: "rgba(255,255,255,.24)" },
    { name: "Smoke", color: "rgba(15,20,32,.48)" },
    { name: "Violet", color: "rgba(122,92,255,.36)" },
    { name: "Cor sólida", color: "#000000", kind: "solid" },
  ],
  icons: [
    { name: "Sem moldura", color: "transparent" },
    { name: "Outline", color: "rgba(255,255,255,.4)" },
    { name: "Dark", color: "rgba(7,10,18,.48)" },
    { name: "Lilac", color: "rgba(159,125,255,.38)" },
    { name: "Cor sólida", color: "#000000", kind: "solid" },
  ],
  widgets: [
    { name: "Sem moldura", color: "transparent" },
    { name: "Glass", color: "rgba(255,255,255,.22)" },
    { name: "Ink", color: "rgba(9,13,24,.55)" },
    { name: "Gradient", color: "rgba(103,70,255,.42)" },
    { name: "Cor sólida", color: "#000000", kind: "solid" },
  ],
};

const labels: Record<Layer, string> = {
  island: "Notch",
  dock: "Dock",
  icons: "Ícones",
  widgets: "Widget",
};

// Grade medida a partir da tela de referência: quatro colunas e seis linhas.
const ICON_X = [83.7, 360.4, 637.1, 913.8];
const ICON_Y = [271.6, 570.4, 869.2, 1168, 1466.8, 1765.6];
const ICON_SIZE = 210.6;
const ICON_RADIUS = 50.4;

const WIDGET_SIZES: Record<WidgetSize, { cols: number; rows: number }> = {
  "2x2": { cols: 2, rows: 2 },
  "4x2": { cols: 4, rows: 2 },
  "4x4": { cols: 4, rows: 4 },
};

const WIDGET_CANDIDATES: Record<WidgetSize, { row: number; col: number }[]> = {
  "2x2": [0, 2, 4].flatMap((row) => [0, 2].map((col) => ({ row, col }))),
  "4x2": [0, 2, 4].map((row) => ({ row, col: 0 })),
  "4x4": [0, 2].map((row) => ({ row, col: 0 })),
};

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stage, setStage] = useState<"home" | "editor">("home");
  const [panel, setPanel] = useState<Layer | null>(null);
  const [placing, setPlacing] = useState<"icons" | "widgets" | null>(null);
  const [selected, setSelected] = useState<Record<Layer, number>>({
    island: 0,
    dock: 0,
    icons: 0,
    widgets: 0,
  });
  const [colors, setColors] = useState<Record<Layer, string>>({
    island: "#000000",
    dock: "#FFFFFF",
    icons: "#FFFFFF",
    widgets: "#FFFFFF",
  });
  const [hues, setHues] = useState<Record<Layer, number>>({ island: 0, dock: 0, icons: 0, widgets: 0 });
  const [iconSlots, setIconSlots] = useState<Set<string>>(new Set());
  const [widgetSize, setWidgetSize] = useState<WidgetSize>("2x2");
  const [widgets, setWidgets] = useState<WidgetPlacement[]>([]);

  const occupiedByWidgets = useMemo(() => {
    const occupied = new Set<string>();
    widgets.forEach((widget) => {
      const size = WIDGET_SIZES[widget.size];
      for (let row = widget.row; row < widget.row + size.rows; row += 1) {
        for (let col = widget.col; col < widget.col + size.cols; col += 1) occupied.add(cellId(row, col));
      }
    });
    return occupied;
  }, [widgets]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scale = Math.max(W / image.width, H / image.height);
    const dw = image.width * scale;
    const dh = image.height * scale;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(image, (W - dw) / 2, (H - dh) / 2, dw, dh);
    drawFrames(ctx, selected, colors, iconSlots, widgets);
  }, [image, selected, colors, iconSlots, widgets, stage]);

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setStage("editor");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function finish() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "framemaker-iphone-17-pro.png";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    }, "image/png", 1);
  }

  function setHue(layer: Layer, hue: number) {
    setHues((value) => ({ ...value, [layer]: hue }));
    setColors((value) => ({ ...value, [layer]: hslToHex(hue, 100, 50) }));
  }

  function setHex(layer: Layer, value: string) {
    const hex = value.startsWith("#") ? value : `#${value}`;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) setColors((current) => ({ ...current, [layer]: hex.toUpperCase() }));
  }

  function selectStyle(layer: Layer, index: number, choice: Choice) {
    setSelected((current) => ({ ...current, [layer]: index }));
    if (index === 0) {
      if (layer === "icons") setIconSlots(new Set());
      if (layer === "widgets") setWidgets([]);
      setPlacing(null);
      setPanel(null);
      return;
    }
    if (!choice.kind) beginPlacement(layer);
  }

  function beginPlacement(layer: Layer) {
    setPanel(null);
    setPlacing(layer === "icons" || layer === "widgets" ? layer : null);
  }

  function toggleIcon(row: number, col: number) {
    const id = cellId(row, col);
    if (occupiedByWidgets.has(id)) return;
    setIconSlots((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function candidateCells(size: WidgetSize, row: number, col: number) {
    const cells: string[] = [];
    const dimensions = WIDGET_SIZES[size];
    for (let r = row; r < row + dimensions.rows; r += 1) {
      for (let c = col; c < col + dimensions.cols; c += 1) cells.push(cellId(r, c));
    }
    return cells;
  }

  function widgetBlocked(size: WidgetSize, row: number, col: number) {
    const cells = candidateCells(size, row, col);
    return cells.some((cell) => iconSlots.has(cell) || occupiedByWidgets.has(cell));
  }

  function addWidget(size: WidgetSize, row: number, col: number) {
    if (widgetBlocked(size, row, col)) return;
    setWidgets((current) => [...current, { id: `${size}-${row}-${col}-${Date.now()}`, size, row, col }]);
  }

  if (stage === "home") {
    return (
      <main className="home">
        <div className="homeCard">
          <div className="mark">FW</div>
          <p className="kicker">FRAMEMAKER</p>
          <h1>Crie seu wallpaper.</h1>
          <p className="subtitle">Molduras precisas para a tela do iPhone 17 Pro.</p>
          <button className="upload" onClick={() => fileRef.current?.click()}>Selecionar imagem <span>↑</span></button>
          <input ref={fileRef} hidden type="file" accept="image/*" onChange={upload} />
          <small>1206 × 2622 px · A imagem permanece no seu aparelho</small>
          <p className="signature">Marcos Pires</p>
        </div>
      </main>
    );
  }

  const current = panel ? choices[panel][selected[panel]] : null;
  const showColor = panel && (current?.kind === "solid" || current?.kind === "extended");

  return (
    <main className="editor">
      <div className="wallpaper">
        <div className="wallpaperInner">
          <canvas ref={canvasRef} width={W} height={H} />
          {placing && (
            <div className={`placementBoard ${placing}`} aria-label={`Posicionamento de ${labels[placing]}`}>
              {placing === "icons" && Array.from({ length: 6 }, (_, row) =>
                Array.from({ length: 4 }, (_, col) => {
                  const id = cellId(row, col);
                  const blocked = occupiedByWidgets.has(id);
                  return (
                    <button
                      key={id}
                      className={`iconSlot ${iconSlots.has(id) ? "placed" : ""} ${blocked ? "blocked" : ""}`}
                      style={iconSlotStyle(row, col)}
                      disabled={blocked}
                      onClick={() => toggleIcon(row, col)}
                      aria-label={`${iconSlots.has(id) ? "Remover" : "Adicionar"} moldura na linha ${row + 1}, coluna ${col + 1}`}
                    ><span>{blocked ? "×" : iconSlots.has(id) ? "✓" : "+"}</span></button>
                  );
                }))}
              {placing === "widgets" && (
                <>
                  {WIDGET_CANDIDATES[widgetSize].map(({ row, col }) => {
                    const blocked = widgetBlocked(widgetSize, row, col);
                    return (
                      <button
                        key={`${widgetSize}-${row}-${col}`}
                        className={`widgetSlot candidate ${blocked ? "blocked" : ""}`}
                        style={widgetSlotStyle(widgetSize, row, col)}
                        disabled={blocked}
                        onClick={() => addWidget(widgetSize, row, col)}
                        aria-label={`Adicionar widget ${widgetSize} na linha ${row + 1}`}
                      ><span>{blocked ? "Ocupado" : `+ ${widgetSize}`}</span></button>
                    );
                  })}
                  {widgets.map((widget) => (
                    <button
                      key={widget.id}
                      className="widgetSlot placed"
                      style={widgetSlotStyle(widget.size, widget.row, widget.col)}
                      onClick={() => setWidgets((currentWidgets) => currentWidgets.filter((item) => item.id !== widget.id))}
                      aria-label={`Remover widget ${widget.size}`}
                    ><span>✓ {widget.size}</span></button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <button className="glassCircle back" onClick={() => { setPanel(null); setPlacing(null); setStage("home"); }}>←</button>

      {placing && (
        <div className="placementHud">
          <b>{placing === "icons" ? "Escolha os espaços dos ícones" : `Posicione widgets ${widgetSize}`}</b>
          <span>Toque para adicionar ou remover. Espaços ocupados ficam bloqueados.</span>
          <button onClick={() => setPlacing(null)}>Pronto</button>
        </div>
      )}

      <div className="tools">
        {(["island", "dock", "icons", "widgets"] as Layer[]).map((layer) => (
          <button
            key={layer}
            className={`glassCircle tool ${panel === layer || placing === layer ? "active" : ""}`}
            onClick={() => { setPlacing(null); setPanel(layer); }}
          >
            <span>{layer === "island" ? "◒" : layer === "dock" ? "▱" : layer === "icons" ? "▦" : "□"}</span>
            <small>{labels[layer]}</small>
          </button>
        ))}
        <button className="glassCircle tool finish" onClick={finish}><span>↓</span><small>Concluir</small></button>
      </div>

      {panel && (
        <div className="overlay" onClick={() => setPanel(null)}>
          <section className="drawer" onClick={(event) => event.stopPropagation()}>
            <div className="handle" />
            <div className="drawerHead">
              <div><p className="drawerKicker">ESCOLHA UM ESTILO</p><h2>{labels[panel]}</h2></div>
              {showColor && <span className="colorPreview" style={{ background: colors[panel] }} />}
            </div>

            {panel === "widgets" && (
              <div className="widgetSizes" aria-label="Tamanho do widget">
                {(["2x2", "4x2", "4x4"] as WidgetSize[]).map((size) => (
                  <button key={size} className={widgetSize === size ? "selected" : ""} onClick={() => setWidgetSize(size)}>{size}</button>
                ))}
              </div>
            )}

            <div className="choiceList">
              {choices[panel].map((choice, index) => (
                <button
                  key={choice.name}
                  className={selected[panel] === index ? "selected" : ""}
                  onClick={() => selectStyle(panel, index, choice)}
                >
                  <span className="swatch" style={{ background: choice.kind ? colors[panel] : choice.color }} />
                  <b>{choice.name}</b><i>{selected[panel] === index ? "✓" : "›"}</i>
                </button>
              ))}
            </div>

            {(panel === "icons" || panel === "widgets") && selected[panel] > 0 && !showColor && (
              <button className="placeAction" onClick={() => beginPlacement(panel)}>
                {panel === "icons" ? "Escolher posições dos ícones" : `Posicionar widgets ${widgetSize}`}
              </button>
            )}

            {showColor && (
              <div className="colorPanel">
                <div className="spectrum"><input aria-label="Selecionar cor" type="color" value={colors[panel]} onChange={(event) => setColors((value) => ({ ...value, [panel]: event.target.value.toUpperCase() }))} /></div>
                <input className="hue" aria-label="Matiz" type="range" min="0" max="359" value={hues[panel]} onChange={(event) => setHue(panel, +event.target.value)} />
                <label><span>HEX</span><input value={colors[panel]} maxLength={7} onChange={(event) => setHex(panel, event.target.value)} /></label>
                <button className="applyColor" onClick={() => beginPlacement(panel)}>{panel === "icons" || panel === "widgets" ? "Aplicar e posicionar" : "Aplicar cor"}</button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function cellId(row: number, col: number) {
  return `${row}-${col}`;
}

function iconSlotStyle(row: number, col: number) {
  return {
    left: `${(ICON_X[col] / W) * 100}%`,
    top: `${(ICON_Y[row] / H) * 100}%`,
    width: `${(ICON_SIZE / W) * 100}%`,
    height: `${(ICON_SIZE / H) * 100}%`,
  };
}

function widgetGeometry(size: WidgetSize, row: number, col: number) {
  const x = col === 0 ? 66 : 639;
  const y = ICON_Y[row] - 3.6;
  if (size === "2x2") return { x, y, w: 501, h: 501, r: 72 };
  if (size === "4x2") return { x: 66, y, w: 1074, h: 501, r: 72 };
  return { x: 66, y, w: 1074, h: 1062, r: 72 };
}

function widgetSlotStyle(size: WidgetSize, row: number, col: number) {
  const geometry = widgetGeometry(size, row, col);
  return {
    left: `${(geometry.x / W) * 100}%`,
    top: `${(geometry.y / H) * 100}%`,
    width: `${(geometry.w / W) * 100}%`,
    height: `${(geometry.h / H) * 100}%`,
  };
}

function hslToHex(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${[f(0), f(8), f(4)].map((value) => Math.round(255 * value).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function continuousRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  // Curva superelíptica mais pronunciada, próxima da Dock do iOS.
  const c = r * 0.28;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.bezierCurveTo(x + w - c, y, x + w, y + c, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.bezierCurveTo(x + w, y + h - c, x + w - c, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.bezierCurveTo(x + c, y + h, x, y + h - c, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.bezierCurveTo(x, y + c, x + c, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function extendedNotch(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(48, 139);
  ctx.bezierCurveTo(58, 81, 100, 41, 160, 41);
  ctx.lineTo(1046, 41);
  ctx.bezierCurveTo(1106, 41, 1148, 81, 1158, 139);
  ctx.bezierCurveTo(1161, 151, 1152, 157, 1140, 157);
  ctx.lineTo(66, 157);
  ctx.bezierCurveTo(54, 157, 45, 151, 48, 139);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawFrames(
  ctx: CanvasRenderingContext2D,
  selected: Record<Layer, number>,
  colors: Record<Layer, string>,
  iconSlots: Set<string>,
  widgets: WidgetPlacement[],
) {
  const island = choices.island[selected.island];
  if (island.color !== "transparent") {
    ctx.fillStyle = island.kind ? colors.island : island.color;
    ctx.strokeStyle = "rgba(255,255,255,.22)";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(0,0,0,.22)";
    ctx.shadowBlur = 24;
    if (island.kind === "extended") extendedNotch(ctx);
    else { rr(ctx, 402, 41, 402, 112, 56); ctx.stroke(); }
    ctx.shadowBlur = 0;
  }

  const dock = choices.dock[selected.dock];
  if (dock.color !== "transparent") {
    ctx.fillStyle = dock.kind ? colors.dock : dock.color;
    ctx.strokeStyle = "rgba(255,255,255,.28)";
    ctx.lineWidth = 3;
    continuousRect(ctx, 54, 2261, 1098, 310, 122);
    ctx.stroke();
  }

  const icon = choices.icons[selected.icons];
  if (icon.color !== "transparent") {
    ctx.fillStyle = icon.kind ? colors.icons : icon.color;
    ctx.strokeStyle = "rgba(255,255,255,.28)";
    ctx.lineWidth = 3;
    iconSlots.forEach((id) => {
      const [row, col] = id.split("-").map(Number);
      rr(ctx, ICON_X[col], ICON_Y[row], ICON_SIZE, ICON_SIZE, ICON_RADIUS);
      ctx.stroke();
    });
  }

  const widget = choices.widgets[selected.widgets];
  if (widget.color !== "transparent") {
    ctx.fillStyle = widget.kind ? colors.widgets : widget.color;
    ctx.strokeStyle = "rgba(255,255,255,.3)";
    ctx.lineWidth = 3;
    widgets.forEach((placement) => {
      const geometry = widgetGeometry(placement.size, placement.row, placement.col);
      rr(ctx, geometry.x, geometry.y, geometry.w, geometry.h, geometry.r);
      ctx.stroke();
    });
  }
}
