"use client";

import { useEffect, useRef } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const NODE_COUNT = 48; // Más densidad para compensar el movimiento (PC)
const MIN_LABEL_DELAY = 600;
const MAX_LABEL_DELAY = 1200;
const MAX_ACTIVE_LABELS = 5;
const EXPAND_FRAMES = 25;
const SHOWING_FRAMES = 110;
const SHRINK_FRAMES = 20;

const Z_SPEED_MIN = 0.12, Z_SPEED_MAX = 0.38;
const Z_SCALE_MIN = 0.45, Z_SCALE_MAX = 1.25;
const Z_ALPHA_MIN = 0.12, Z_ALPHA_MAX = 0.55;
const MAX_DIST = 140; // Distancia para conectar líneas (PC)
const MAX_Z_DIFF = 0.35;

// Scroll parallax (Viaje espacial)
const SCROLL_PARALLAX_MIN = 0.08;  // Fondo lejano
const SCROLL_PARALLAX_MAX = 0.55;  // Primer plano (más rápido)
const SCROLL_FRICTION = 0.92;      // Un poco más de inercia

const ACCENT_COLOR = "rgba(59,130,246,";
const ACCENT_CHANCE = 0.004;
const ACCENT_FRAMES = 40;

const LABELS = ["Evaluación", "Examen", "Tarea", "Control", "Informe", "Proyecto", "Quiz", "Prueba", "Entrega", "Presentación"];
const LINE_COLOR = "rgba(148,163,184,";
const CAL_BG = "rgba(241,245,249,";
const CAL_HEADER = "rgba(51,65,85,";
const CAL_DOT = "rgba(100,116,139,";
const CAL_DOT_HI = "rgba(51,65,85,";
const DOC_BG = "rgba(255,255,255,";
const DOC_LINE = "rgba(148,163,184,";

const CAL_W_BASE = 26, CAL_H_BASE = 24, CAL_R = 4, HEADER_H_BASE = 6;
const DOTS_COLS = 3, DOTS_ROWS = 2, DOT_R = 1.2;
const DOC_W_BASE = 20, DOC_H_BASE = 26;

const LS = { IDLE: 0, EXPANDING: 1, SHOWING: 2, SHRINKING: 3 } as const;
type LabelState = typeof LS[keyof typeof LS];

interface Highlight { col: number; row: number; }
interface Node {
    x: number; y: number; vx: number; vy: number; z: number;
    opacity: number; type: "cal" | "doc"; highlight: Highlight;
    accentTimer: number; accentActive: boolean;
    labelState: LabelState; labelProgress: number;
    labelText: string; labelTimer: number; nextLabelIn: number;
}

function randDelay() { return MIN_LABEL_DELAY + Math.floor(Math.random() * (MAX_LABEL_DELAY - MIN_LABEL_DELAY)); }
function easeOutBack(t: number) { const c = 2.4; return 1 + c * Math.pow(t - 1, 3) + (c - 1) * Math.pow(t - 1, 2); }
function easeInBack(t: number) { const c = 2.4; return c * t * t * t - (c - 1) * t * t; }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function createNode(w: number, h: number, i: number, isMobile: boolean): Node {
    const z = Math.random();
    const spd = lerp(Z_SPEED_MIN, Z_SPEED_MAX, z);
    const angle = Math.random() * Math.PI * 2;
    return {
        x: Math.random() * w, y: Math.random() * h,
        vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
        z, opacity: lerp(Z_ALPHA_MIN, Z_ALPHA_MAX, z),
        type: Math.random() < 0.5 ? "cal" : "doc",
        highlight: { col: Math.floor(Math.random() * 3), row: Math.floor(Math.random() * 2) },
        accentTimer: 0, accentActive: false,
        labelState: LS.IDLE, labelProgress: 0,
        labelText: "", labelTimer: 0,
        // En celular espaciamos más las etiquetas para que no se sature la pantalla
        nextLabelIn: MIN_LABEL_DELAY + Math.floor(Math.random() * MAX_LABEL_DELAY) + i * (isMobile ? 120 : 55),
    };
}

export default function AnimatedBackground({ opacity = 1 }: { opacity?: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let nodes: Node[] = [];
        let raf: number;

        // --- OPTIMIZACIÓN MÓVIL ---
        const isMobile = window.innerWidth < 768;
        const actualNodeCount = isMobile ? 16 : NODE_COUNT; // Bajamos de 48 a 16 en celular
        const actualMaxDist = isMobile ? 90 : MAX_DIST; // Conectamos menos líneas
        const actualMaxActiveLabels = isMobile ? 2 : MAX_ACTIVE_LABELS; // Máximo 2 etiquetas simultáneas

        // Velocidad de scroll acumulada
        const scrollVel = { y: 0 };
        let lastScrollY = window.scrollY;

        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };

        const handleScroll = () => {
            const delta = window.scrollY - lastScrollY;
            lastScrollY = window.scrollY;
            scrollVel.y += delta;
        };

        const countActive = () => nodes.filter(n => n.labelState !== LS.IDLE).length;

        const drawCalendar = (x: number, y: number, alpha: number, hl: Highlight, z: number, accentT: number) => {
            const scale = lerp(Z_SCALE_MIN, Z_SCALE_MAX, z);
            const W = CAL_W_BASE * scale, H = CAL_H_BASE * scale, hH = HEADER_H_BASE * scale, r = CAL_R * scale;
            ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y);

            // SOMBRAS APAGADAS EN CELULAR
            if (!isMobile) {
                ctx.shadowColor = "rgba(51,65,85,0.10)"; ctx.shadowBlur = 5 * scale; ctx.shadowOffsetY = 2 * scale;
            }

            ctx.beginPath(); ctx.roundRect(-W / 2, -H / 2, W, H, r); ctx.fillStyle = `${CAL_BG}1)`; ctx.fill();
            ctx.shadowColor = "transparent";
            ctx.beginPath(); ctx.roundRect(-W / 2, -H / 2, W, hH, [r, r, 0, 0]); ctx.fillStyle = `${CAL_HEADER}1)`; ctx.fill();
            [-W / 4, W / 4].forEach(rx => { ctx.beginPath(); ctx.arc(rx, -H / 2, 1.3 * scale, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.65)"; ctx.fill(); });
            const gx = -W / 2 + 4 * scale, gy = -H / 2 + hH + 3.5 * scale;
            const cw = (W - 8 * scale) / (DOTS_COLS - 1), ch = (H - hH - 7 * scale) / (DOTS_ROWS - 1);
            const dr = DOT_R * scale;
            for (let row = 0; row < DOTS_ROWS; row++) {
                for (let col = 0; col < DOTS_COLS; col++) {
                    const isHi = hl.col === col && hl.row === row;
                    const dx = gx + col * cw, dy = gy + row * ch;
                    if (isHi && accentT > 0) {
                        const t = Math.sin(accentT * Math.PI);
                        ctx.beginPath(); ctx.arc(dx, dy, dr * 1.8, 0, Math.PI * 2);
                        ctx.fillStyle = `${ACCENT_COLOR}${t * 0.9})`; ctx.fill();
                    }
                    ctx.beginPath(); ctx.arc(dx, dy, isHi ? dr * 1.6 : dr, 0, Math.PI * 2);
                    ctx.fillStyle = isHi ? (accentT > 0 ? `${ACCENT_COLOR}${lerp(0.7, 1, Math.sin(accentT * Math.PI))})` : `${CAL_DOT_HI}1)`) : `${CAL_DOT}0.5)`;
                    ctx.fill();
                }
            }
            ctx.restore();
        };

        const drawDocument = (x: number, y: number, alpha: number, z: number) => {
            const scale = lerp(Z_SCALE_MIN, Z_SCALE_MAX, z);
            const W = DOC_W_BASE * scale, H = DOC_H_BASE * scale, r = 2.5 * scale;
            const fold = W * 0.28;
            ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y);

            // SOMBRAS APAGADAS EN CELULAR
            if (!isMobile) {
                ctx.shadowColor = "rgba(51,65,85,0.10)"; ctx.shadowBlur = 5 * scale; ctx.shadowOffsetY = 2 * scale;
            }

            ctx.beginPath();
            ctx.moveTo(-W / 2 + r, -H / 2); ctx.lineTo(W / 2 - fold, -H / 2); ctx.lineTo(W / 2, -H / 2 + fold);
            ctx.lineTo(W / 2, H / 2 - r); ctx.quadraticCurveTo(W / 2, H / 2, W / 2 - r, H / 2);
            ctx.lineTo(-W / 2 + r, H / 2); ctx.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - r);
            ctx.lineTo(-W / 2, -H / 2 + r); ctx.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + r, -H / 2);
            ctx.closePath(); ctx.fillStyle = `${DOC_BG}1)`; ctx.fill();
            ctx.shadowColor = "transparent";
            ctx.beginPath(); ctx.moveTo(W / 2 - fold, -H / 2); ctx.lineTo(W / 2, -H / 2 + fold); ctx.lineTo(W / 2 - fold, -H / 2 + fold); ctx.closePath();
            ctx.fillStyle = "rgba(203,213,225,0.7)"; ctx.fill();
            const lx = -W / 2 + 4 * scale, ly = -H / 2 + 9 * scale, lg = 4.5 * scale, lh = 1.5 * scale;
            [0, 1, 2, 3].forEach(i => {
                const short = i === 3;
                ctx.beginPath(); ctx.roundRect(lx, ly + i * lg, (short ? W - 14 * scale : W - 9 * scale) - 2, lh, lh / 2);
                ctx.fillStyle = `${DOC_LINE}0.7)`; ctx.fill();
            });
            ctx.restore();
        };

        const drawLabel = (n: Node, sx: number, sy: number, ta: number) => {
            const scale = lerp(Z_SCALE_MIN, Z_SCALE_MAX, n.z);
            const FS = Math.round(9 * scale + 1), PX = 10, PY = 5;
            ctx.font = `700 ${FS}px system-ui,sans-serif`;
            const tw = ctx.measureText(n.labelText).width;
            const bw = tw + PX * 2, bh = FS + PY * 2;
            const nodeH = (n.type === "cal" ? CAL_H_BASE : DOC_H_BASE) * scale;
            const oy = nodeH / 2 + 5 + bh / 2;
            ctx.save(); ctx.translate(n.x, n.y - oy); ctx.scale(sx, sy);
            ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
            ctx.fillStyle = `rgba(51,65,85,${0.9 * ta})`; ctx.fill();
            ctx.fillStyle = `rgba(255,255,255,${ta})`;
            ctx.font = `700 ${FS}px system-ui,sans-serif`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(n.labelText, 0, 0);
            ctx.restore();
        };

        const updateNode = (n: Node, w: number, h: number) => {
            const parallaxFactor = lerp(SCROLL_PARALLAX_MIN, SCROLL_PARALLAX_MAX, n.z);
            n.y -= scrollVel.y * parallaxFactor;
            n.x += n.vx; n.y += n.vy;

            const resetNode = (node: Node) => {
                const z = Math.random();
                node.z = z;
                node.opacity = lerp(Z_ALPHA_MIN, Z_ALPHA_MAX, z);
                node.type = Math.random() < 0.5 ? "cal" : "doc";
                const spd = lerp(Z_SPEED_MIN, Z_SPEED_MAX, z);
                const angle = Math.random() * Math.PI * 2;
                node.vx = Math.cos(angle) * spd;
                node.vy = Math.sin(angle) * spd;
                node.labelState = LS.IDLE;
                node.nextLabelIn = randDelay();
            };

            const margin = 120;
            if (n.y < -margin) { n.y = h + margin; n.x = Math.random() * w; resetNode(n); }
            else if (n.y > h + margin) { n.y = -margin; n.x = Math.random() * w; resetNode(n); }

            if (n.x < -margin) { n.x = w + margin; n.y = Math.random() * h; resetNode(n); }
            else if (n.x > w + margin) { n.x = -margin; n.y = Math.random() * h; resetNode(n); }

            if (n.type === "cal") {
                if (!n.accentActive && Math.random() < ACCENT_CHANCE) { n.accentActive = true; n.accentTimer = 0; }
                if (n.accentActive) { n.accentTimer++; if (n.accentTimer >= ACCENT_FRAMES) n.accentActive = false; }
            }
            switch (n.labelState) {
                case LS.IDLE:
                    if (--n.nextLabelIn <= 0) {
                        if (countActive() < actualMaxActiveLabels) { n.labelState = LS.EXPANDING; n.labelProgress = 0; n.labelText = LABELS[Math.floor(Math.random() * LABELS.length)]; }
                        else n.nextLabelIn = 90;
                    } break;
                case LS.EXPANDING:
                    n.labelProgress += 1 / EXPAND_FRAMES;
                    if (n.labelProgress >= 1) { n.labelProgress = 1; n.labelState = LS.SHOWING; n.labelTimer = SHOWING_FRAMES; } break;
                case LS.SHOWING:
                    if (--n.labelTimer <= 0) { n.labelState = LS.SHRINKING; n.labelProgress = 0; } break;
                case LS.SHRINKING:
                    n.labelProgress += 1 / SHRINK_FRAMES;
                    if (n.labelProgress >= 1) { n.labelState = LS.IDLE; n.labelProgress = 0; n.nextLabelIn = randDelay(); } break;
            }
        };

        const renderNode = (n: Node) => {
            const accentT = n.accentActive ? n.accentTimer / ACCENT_FRAMES : 0;
            if (n.type === "cal") drawCalendar(n.x, n.y, n.opacity, n.highlight, n.z, accentT);
            else drawDocument(n.x, n.y, n.opacity, n.z);
            if (n.labelState === LS.IDLE) return;
            const p = n.labelProgress;
            let sx: number, sy: number, ta: number;
            if (n.labelState === LS.EXPANDING) { sx = easeOutBack(p); sy = easeOutBack(p); ta = p; }
            else if (n.labelState === LS.SHOWING) { sx = 1; sy = 1; ta = 1; }
            else { const q = 1 - p; sx = easeInBack(q); sy = easeInBack(q); ta = q; }
            sx = Math.max(0.01, sx); sy = Math.max(0.01, sy);
            drawLabel(n, sx, sy, ta);
        };

        const loop = () => {
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            nodes.sort((a, b) => a.z - b.z);
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    if (Math.abs(nodes[i].z - nodes[j].z) > MAX_Z_DIFF) continue;
                    const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    // Usamos el MAX_DIST reducido para celular
                    if (d < actualMaxDist) {
                        const avgZ = (nodes[i].z + nodes[j].z) * 0.5;
                        ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.strokeStyle = `${LINE_COLOR}${(1 - d / actualMaxDist) * lerp(0.06, 0.22, avgZ)})`;
                        ctx.lineWidth = lerp(0.4, 0.9, avgZ); ctx.stroke();
                    }
                }
            }
            for (const n of nodes) { updateNode(n, w, h); renderNode(n); }

            scrollVel.y *= SCROLL_FRICTION;
            if (Math.abs(scrollVel.y) < 0.01) scrollVel.y = 0;

            raf = requestAnimationFrame(loop);
        };

        resize();
        // Usamos el actualNodeCount (16 en cel, 48 en PC)
        nodes = Array.from({ length: actualNodeCount }, (_, i) => createNode(canvas.width, canvas.height, i, isMobile));
        loop();
        window.addEventListener("resize", resize);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none z-0">
            <div className="sticky top-0 w-full h-[100dvh]">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full block"
                    style={{ opacity }}
                />
            </div>
        </div>
    );

}