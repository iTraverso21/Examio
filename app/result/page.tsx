"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Smartphone, Monitor } from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";

interface Evento {
  titulo: string;
  fecha: string;
  descripcion: string;
}

type DeviceType = "ios" | "android" | "desktop";

const DEVICE_HINT: Record<DeviceType, { icon: React.ReactNode; text: string; color: string; border: string; textColor: string }> = {
  ios: {
    icon: <Smartphone className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />,
    text: "Pulsa el archivo descargado y elige «Añadir todos» para importarlo a Apple Calendar.",
    color: "bg-slate-100",
    border: "border-slate-200",
    textColor: "text-slate-700",
  },
  android: {
    icon: (
      <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7" y1="4" x2="9" y2="7" /><line x1="17" y1="4" x2="15" y2="7" />
        <path d="M4 15h16c0-4.4-3.6-8-8-8s-8 3.6-8 8" />
        <line x1="9" y1="11" x2="9.01" y2="11" /><line x1="15" y1="11" x2="15.01" y2="11" />
      </svg>
    ),
    text: "Abre el archivo .ics con Google Calendar para importarlo a tu agenda.",
    color: "bg-slate-100",
    border: "border-slate-200",
    textColor: "text-slate-700",
  },
  desktop: {
    icon: <Monitor className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />,
    text: "Haz doble clic en el .ics descargado o impórtalo desde Google Calendar, Outlook o iCal.",
    color: "bg-slate-100",
    border: "border-slate-200",
    textColor: "text-slate-700",
  },
};

export default function ResultPage() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="w-20 h-20 border-[3px] border-slate-200 border-t-slate-700 rounded-full animate-spin"></div>
      </main>
    }>
      <ResultContent />
    </Suspense>
  );
}

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawDevice = searchParams.get("device");
  const device: DeviceType = (rawDevice && rawDevice in DEVICE_HINT) ? rawDevice as DeviceType : "desktop";
  const hint = DEVICE_HINT[device];

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [descargado, setDescargado] = useState(false);
  const [editandoEventoIdx, setEditandoEventoIdx] = useState<number | null>(null);
  const [nuevoEvento, setNuevoEvento] = useState({ titulo: "", fecha: "", descripcion: "" });
  const [mostrarAgregarRamo, setMostrarAgregarRamo] = useState<string | null>(null);
  const [ramosNoAnalizados, setRamosNoAnalizados] = useState<string[]>([]);
  const [mostrarHint, setMostrarHint] = useState(true);

  const hayEventosTBD = eventos.some(e => !e.fecha || e.fecha === "TBD" || e.fecha === "Pendiente");

  const LINK_DONACION = "https://link.mercadopago.cl/examio";

  const ordenarEventos = (lista: Evento[]) =>
    lista.sort((a, b) => {
      const tA = !a.fecha || a.fecha === "TBD" || a.fecha === "Pendiente";
      const tB = !b.fecha || b.fecha === "TBD" || b.fecha === "Pendiente";
      if (tA && tB) return 0;
      if (tA) return 1;
      if (tB) return -1;
      return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    });

  const persistEventos = (next: Evento[]) => {
    setEventos(next);
    localStorage.setItem("eventos", JSON.stringify(next));
  };

  const actualizarEvento = (index: number, datos: Partial<Evento>) => {
    const nuevosDatos = { ...datos };
    if (nuevosDatos.fecha === "") nuevosDatos.fecha = "TBD";
    const updated = eventos.map((e, i) => (i === index ? { ...e, ...nuevosDatos } : e));
    persistEventos(ordenarEventos(updated));
    setEditandoEventoIdx(null);
  };

  const agregarEvento = (ramo: string) => {
    const { titulo, fecha } = nuevoEvento;
    if (!titulo.trim()) return;
    const tituloConRamo = titulo.trim().startsWith("[") ? titulo.trim() : `[${ramo}] ${titulo.trim()}`;
    const ev: Evento = { titulo: tituloConRamo, fecha: fecha || "TBD", descripcion: nuevoEvento.descripcion.trim() };
    persistEventos(ordenarEventos([...eventos, ev]));
    setNuevoEvento({ titulo: "", fecha: "", descripcion: "" });
    setMostrarAgregarRamo(null);
  };

  useEffect(() => {
    const permitido = typeof window !== "undefined" && sessionStorage.getItem("result_ok");
    const data = typeof window !== "undefined" ? localStorage.getItem("eventos") : null;
    if (!permitido || !data) { router.replace("/scan"); return; }
    try {
      const eventosData = JSON.parse(data);
      if (!Array.isArray(eventosData) || eventosData.length === 0) {
        sessionStorage.setItem("error_ok", "1");
        router.replace("/error?message=" + encodeURIComponent("No se encontraron eventos."));
        return;
      }
      setEventos(ordenarEventos(eventosData));
      const ramosRaw = sessionStorage.getItem("ramos_no_analizados");
      if (ramosRaw) {
        try { const lista = JSON.parse(ramosRaw); setRamosNoAnalizados(Array.isArray(lista) ? lista : []); } catch { setRamosNoAnalizados([]); }
      }
    } catch (e) {
      console.error(e);
      sessionStorage.setItem("error_ok", "1");
      router.replace("/error?message=" + encodeURIComponent("Error al cargar el calendario."));
    }
  }, [router]);

  const formatearFecha = (fechaStr: string) => {
    if (!fechaStr || fechaStr === "TBD" || fechaStr === "Pendiente") return { dia: "?", mes: "TBD", anio: "----", esTBD: true };
    const parts = fechaStr.split("-");
    if (parts.length !== 3) return { dia: "?", mes: "???", anio: "----", esTBD: false };
    const [anio, mes, dia] = parts;
    const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
    return { dia, mes: meses[parseInt(mes) - 1] || "???", anio, esTBD: false };
  };

  const descargarICS = () => {
    const eventosValidos = eventos.filter(e =>
      e.fecha && e.fecha !== "TBD" && e.fecha !== "Pendiente" && /^\d{4}-\d{2}-\d{2}$/.test(e.fecha)
    );
    if (eventosValidos.length === 0) {
      alert("No tienes eventos con fecha confirmada. Edita los eventos 'TBD' y asígnales una fecha.");
      return;
    }
    const escapar = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    const uid = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@examio.cl`;
    const ts = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    let ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Examio//Calendario Académico//ES\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:Calendario Examio\r\nX-WR-TIMEZONE:America/Santiago\r\nX-WR-CALDESC:Calendario de evaluaciones y entregas\r\n";
    eventosValidos.forEach(evt => {
      ics += `BEGIN:VEVENT\r\nUID:${uid()}\r\nDTSTAMP:${ts}\r\nDTSTART;VALUE=DATE:${evt.fecha.replace(/-/g, "")}\r\nSUMMARY:${escapar(evt.titulo || "Evento sin título")}\r\nDESCRIPTION:${escapar(evt.descripcion || "")}\r\nSTATUS:CONFIRMED\r\nSEQUENCE:0\r\nTRANSP:TRANSPARENT\r\nBEGIN:VALARM\r\nTRIGGER:-P1D\r\nACTION:DISPLAY\r\nDESCRIPTION:Recordatorio: ${escapar(evt.titulo || "")}\r\nEND:VALARM\r\nEND:VEVENT\r\n`;
    });
    ics += "END:VCALENDAR";

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.setAttribute("download", "examio_calendario.ics");
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(url), 100);

    setDescargado(true);
    // Mostrar hint con pequeño delay para que se sienta natural
    setTimeout(() => setMostrarHint(true), 400);
  };

  const agruparPorRamo = (): Record<string, (Evento & { _idx: number })[]> => {
    const grupos: Record<string, (Evento & { _idx: number })[]> = {};
    eventos.forEach((e, idx) => {
      const match = (e.titulo || "").match(/^\[(.*?)\]/);
      const ramo = match ? match[1] : "General";
      if (!grupos[ramo]) grupos[ramo] = [];
      grupos[ramo].push({ ...e, _idx: idx });
    });
    return grupos;
  };

  const grupos = agruparPorRamo();

  // ─── Botones de descarga compartidos ────────────────────────────────────────
  const DownloadButtons = () => (
    <div className="space-y-3">
      <button
        onClick={descargarICS}
        className="w-full bg-[#334155] hover:bg-[#1e293b] text-white font-bold py-5 rounded-[24px] shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {descargado ? "Descargar de nuevo" : "Descargar Calendario"}
      </button>

      {/* ── Hint de dispositivo ── aparece suave tras la primera descarga */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${mostrarHint ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className={`flex items-start gap-2.5 px-4 py-3 rounded-2xl border ${hint.color} ${hint.border}`}>
          <span className={hint.textColor}>{hint.icon}</span>
          <p className={`text-xs leading-relaxed ${hint.textColor}`}>{hint.text}</p>
        </div>
      </div>
    </div>
  );

  // ─── Pantalla post-descarga ──────────────────────────────────────────────────
  if (descargado) {
    return (
      <main className="relative min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 animate-slide-down">
        <AnimatedBackground opacity={0.25} />

        <div className="max-w-md w-full text-center relative z-10">
          <div className="w-24 h-24 bg-emerald-100 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-100/50">
            <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">¡Archivo descargado!</h2>
          <p className="text-base text-slate-500 mb-8 max-w-xs mx-auto">Ahora solo sigue los pasos de tu dispositivo.</p>

          <div className="space-y-4">
            <DownloadButtons />
            <button
              onClick={() => { sessionStorage.removeItem("result_ok"); router.push("/scan"); }}
              className="w-full bg-white border border-slate-200 text-slate-700 font-semibold py-4 rounded-[24px] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              Escanear otros ramos
            </button>
            <div className="pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-500 mb-4 font-medium">¿Te sirvió la app?</p>
              <a href={LINK_DONACION} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all text-sm"
              >
                Apoyar Examio
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ─── Pantalla principal de resultados ───────────────────────────────────────
  return (
    <main className="relative min-h-screen bg-[#F8FAFC] p-4 pb-8 animate-slide-down">
      <AnimatedBackground opacity={0.25} />
      <div className="max-w-2xl mx-auto pt-4 relative z-10">

        {/* Logo */}
        <div className="mb-6 flex justify-start">
          <button onClick={() => router.push("/")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-lg shadow-slate-200 border border-slate-100">
              <Image src="/examio_logo.png" alt="Logo Examio" fill className="object-cover" />
            </div>
            <span className="text-[#0f172a] font-bold text-2xl tracking-tighter">Examio</span>
          </button>
        </div>

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Tu Calendario</h1>
            <p className="text-sm text-slate-500">Eventos ordenados cronológicamente</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-[16px] border border-slate-200 shadow-sm">
            <span className="text-lg font-bold text-slate-900">{eventos.length}</span>
            <span className="text-xs text-slate-500 ml-1">eventos</span>
          </div>
        </div>

        {ramosNoAnalizados.length > 0 && (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-[24px] shadow-sm">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-bold text-amber-900 mb-1">No se pudo analizar bien:</p>
                <p className="text-sm text-amber-800 font-medium">{ramosNoAnalizados.join(", ")}</p>
                <p className="text-xs text-amber-700 mt-2">Revisa que los archivos no estén vacíos o dañados. Puedes volver a escanear solo ese ramo.</p>
              </div>
            </div>
          </div>
        )}

        {/* Eventos por ramo */}
        <div className="space-y-8 mb-10">
          {Object.entries(grupos).map(([ramo, eventosRamo]) => (
            <div key={ramo} className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em] px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm">{ramo}</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              </div>

              <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100">
                {eventosRamo.map((evento) => {
                  const idx = evento._idx;
                  const { dia, mes, esTBD } = formatearFecha(evento.fecha);
                  const editando = editandoEventoIdx === idx;
                  const tituloSinRamo = (evento.titulo || "Evento").replace(/^\[.*?\]\s*/, "");

                  return (
                    <div key={idx} className="flex items-center gap-4 p-5 border-b border-slate-50 last:border-0 group hover:bg-slate-50/50 transition-colors">
                      <div className={`flex flex-col items-center justify-center rounded-[18px] w-[70px] h-[70px] flex-shrink-0 border transition-colors
                        ${esTBD ? "bg-amber-100 border-amber-200 text-amber-700" : "bg-slate-100 border-slate-200 text-slate-700 group-hover:border-slate-300"}
                      `}>
                        {editando ? (
                          <input type="date" defaultValue={esTBD ? "" : evento.fecha} id={`fecha-${idx}`} className="w-16 text-[0.65rem] border border-slate-300 rounded-lg px-2 py-1 bg-white" />
                        ) : (
                          <><span className="text-2xl font-black leading-none">{dia}</span><span className="text-[0.65rem] font-bold uppercase mt-1.5 tracking-wider">{mes}</span></>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {editando ? (
                          <div className="space-y-2.5">
                            <input type="text" defaultValue={tituloSinRamo} id={`titulo-${idx}`} placeholder="Título" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-slate-400 focus:outline-none transition-colors" />
                            <input type="text" defaultValue={evento.descripcion} id={`desc-${idx}`} placeholder="Descripción (opcional)" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 focus:border-slate-400 focus:outline-none transition-colors" />
                            <div className="flex gap-2 pt-1">
                              <button type="button" onClick={() => {
                                const t = document.getElementById(`titulo-${idx}`) as HTMLInputElement;
                                const f = document.getElementById(`fecha-${idx}`) as HTMLInputElement;
                                const d = document.getElementById(`desc-${idx}`) as HTMLInputElement;
                                const match = evento.titulo.match(/^\[(.*?)\]/);
                                const prefijo = match ? match[0] : `[${ramo}] `;
                                const titulo = (t?.value?.trim() || "").startsWith("[") ? t.value.trim() : prefijo + (t?.value?.trim() || "");
                                if (titulo) actualizarEvento(idx, { titulo, fecha: f?.value || "", descripcion: d?.value?.trim() || "" });
                              }} className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors">Guardar</button>
                              <button type="button" onClick={() => setEditandoEventoIdx(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-base font-bold text-slate-900 mb-1.5 leading-tight">{tituloSinRamo}</h3>
                            {evento.descripcion && <p className="text-sm text-slate-500 leading-relaxed">{evento.descripcion}</p>}
                            {esTBD && <p className="text-[10px] text-amber-600 font-bold mt-1 bg-amber-50 inline-block px-2 py-0.5 rounded-full border border-amber-100">Fecha por definir</p>}
                          </>
                        )}
                      </div>

                      {!editando && (
                        <button type="button" onClick={() => setEditandoEventoIdx(idx)}
                          className="flex-shrink-0 p-2.5 rounded-xl text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all" title="Editar evento"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Agregar evento */}
              <div className="mt-4">
                {mostrarAgregarRamo !== ramo ? (
                  <button type="button" onClick={() => setMostrarAgregarRamo(ramo)}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[20px] text-slate-500 text-sm font-semibold hover:border-slate-300 hover:text-slate-700 hover:bg-white transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    Agregar evento a {ramo}
                  </button>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Nuevo evento en {ramo}</h3>
                    <input type="text" placeholder="Título (ej: Examen parcial)" value={nuevoEvento.titulo} onChange={e => setNuevoEvento(p => ({ ...p, titulo: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:border-slate-400 focus:outline-none transition-colors" />
                    <input type="date" value={nuevoEvento.fecha} onChange={e => setNuevoEvento(p => ({ ...p, fecha: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:border-slate-400 focus:outline-none transition-colors" />
                    <input type="text" placeholder="Descripción (opcional)" value={nuevoEvento.descripcion} onChange={e => setNuevoEvento(p => ({ ...p, descripcion: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:border-slate-400 focus:outline-none transition-colors" />
                    <div className="flex gap-2.5 pt-2">
                      <button type="button" onClick={() => agregarEvento(ramo)} disabled={!nuevoEvento.titulo.trim()} className="flex-1 bg-slate-900 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 hover:bg-slate-800 transition-colors">Agregar</button>
                      <button type="button" onClick={() => { setMostrarAgregarRamo(null); setNuevoEvento({ titulo: "", fecha: "", descripcion: "" }); }} className="px-5 py-3 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botones finales */}
        <div className="space-y-4 max-w-md mx-auto">
          {hayEventosTBD && (
            <p className="text-center text-[10px] text-amber-600 font-medium">
              ⚠️ Al descargar se ignorarán los eventos sin fecha (TBD). <span className="font-bold underline cursor-pointer">¡EDÍTALAS!</span>
            </p>
          )}

          <DownloadButtons />

          <button
            onClick={() => { sessionStorage.removeItem("result_ok"); router.push("/scan"); }}
            className="w-full bg-white border border-slate-200 text-slate-700 font-semibold py-4 rounded-[24px] hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all shadow-sm"
          >
            Escanear otros ramos
          </button>

          <div className="text-center pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500 mb-4 font-medium">¿Te sirvió la app?</p>
            <a href={LINK_DONACION} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all text-sm"
            >
              Apoyar Examio
            </a>
            <p className="text-xs text-slate-400 mt-3">Si esta app te ayudó, apoya al creador 😊</p>
          </div>
        </div>

      </div>

      <style jsx>{`
        @keyframes slide-in-from-bottom-4 { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes zoom-in { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
        .animate-in { animation-fill-mode: both; }
        .slide-in-from-bottom-4 { animation: slide-in-from-bottom-4 0.5s ease-out; }
        .zoom-in { animation: zoom-in 0.5s ease-out; }
      `}</style>
    </main>
  );
}