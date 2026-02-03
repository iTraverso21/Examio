"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Evento {
  titulo: string;
  fecha: string;
  descripcion: string;
}

export default function ResultPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [descargado, setDescargado] = useState(false);
  const [editandoEventoIdx, setEditandoEventoIdx] = useState<number | null>(null);
  const [nuevoEvento, setNuevoEvento] = useState({ titulo: "", fecha: "", descripcion: "" });
  const [mostrarAgregarRamo, setMostrarAgregarRamo] = useState<string | null>(null);
  const [ramosNoAnalizados, setRamosNoAnalizados] = useState<string[]>([]);

  const persistEventos = (next: Evento[]) => {
    setEventos(next);
    localStorage.setItem("eventos", JSON.stringify(next));
  };

  const actualizarEvento = (index: number, datos: Partial<Evento>) => {
    const next = eventos.map((e, i) => (i === index ? { ...e, ...datos } : e));
    next.sort((a, b) => (new Date(a.fecha).getTime()) - (new Date(b.fecha).getTime()));
    persistEventos(next);
    setEditandoEventoIdx(null);
  };

  const agregarEvento = (ramo: string) => {
    const { titulo, fecha } = nuevoEvento;
    if (!titulo.trim() || !fecha) return;
    const tituloConRamo = titulo.trim().startsWith("[") ? titulo.trim() : `[${ramo}] ${titulo.trim()}`;
    const ev: Evento = {
      titulo: tituloConRamo,
      fecha,
      descripcion: nuevoEvento.descripcion.trim() || "",
    };
    const next = [...eventos, ev].sort((a, b) => (new Date(a.fecha).getTime()) - (new Date(b.fecha).getTime()));
    persistEventos(next);
    setNuevoEvento({ titulo: "", fecha: "", descripcion: "" });
    setMostrarAgregarRamo(null);
  };

  const LINK_DONACION = "https://link.mercadopago.cl/examio"; 

  useEffect(() => {
    const permitido = typeof window !== "undefined" && sessionStorage.getItem("result_ok");
    const data = typeof window !== "undefined" ? localStorage.getItem("eventos") : null;
    if (!permitido || !data) {
      router.replace("/scan");
      return;
    }
    try {
      const eventosData = JSON.parse(data);
      if (!Array.isArray(eventosData) || eventosData.length === 0) {
        sessionStorage.setItem("error_ok", "1");
        router.replace("/error?message=" + encodeURIComponent("No se encontraron eventos. Revisa que los archivos tengan un calendario de evaluaciones."));
        return;
      }
      eventosData.sort((a: Evento, b: Evento) => {
        const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
        const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
        return fechaA - fechaB;
      });
      setEventos(eventosData);
      const ramosRaw = sessionStorage.getItem("ramos_no_analizados");
      if (ramosRaw) {
        try {
          const lista = JSON.parse(ramosRaw);
          setRamosNoAnalizados(Array.isArray(lista) ? lista : []);
        } catch {
          setRamosNoAnalizados([]);
        }
      }
    } catch (e) {
      console.error(e);
      sessionStorage.setItem("error_ok", "1");
      router.replace("/error?message=" + encodeURIComponent("Error al cargar el calendario."));
    }
  }, [router]);

  const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return { dia: "?", mes: "???", anio: "----" };
    const parts = fechaStr.split('-');
    if (parts.length !== 3) return { dia: "?", mes: "???", anio: "----" };
    const [anio, mes, dia] = parts;
    const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
    const nombreMes = meses[parseInt(mes) - 1] || "???";
    return { dia, mes: nombreMes, anio };
  };

  const descargarICS = () => {
    if (eventos.length === 0) return;
    
    const escaparTexto = (texto: string) => {
      return texto
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };
    
    const generarUID = () => {
      return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@examio.cl`;
    };
    
    const ahora = new Date();
    const timestampCreacion = ahora.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    let icsContent = "BEGIN:VCALENDAR\r\n";
    icsContent += "VERSION:2.0\r\n";
    icsContent += "PRODID:-//Examio//Calendario Académico//ES\r\n";
    icsContent += "CALSCALE:GREGORIAN\r\n";
    icsContent += "METHOD:PUBLISH\r\n";
    icsContent += "X-WR-CALNAME:Calendario Examio\r\n";
    icsContent += "X-WR-TIMEZONE:America/Santiago\r\n";
    icsContent += "X-WR-CALDESC:Calendario de evaluaciones y entregas\r\n";
    
    eventos.forEach((evt) => {
      const fechaBase = evt.fecha || new Date().toISOString().split('T')[0];
      const fechaClean = fechaBase.replace(/-/g, "");
      const tituloEscapado = escaparTexto(evt.titulo || "Evento sin título");
      const descripcionEscapada = escaparTexto(evt.descripcion || "");
      
      icsContent += "BEGIN:VEVENT\r\n";
      icsContent += `UID:${generarUID()}\r\n`;
      icsContent += `DTSTAMP:${timestampCreacion}\r\n`;
      icsContent += `DTSTART;VALUE=DATE:${fechaClean}\r\n`;
      icsContent += `SUMMARY:${tituloEscapado}\r\n`;
      icsContent += `DESCRIPTION:${descripcionEscapada}\r\n`;
      icsContent += `STATUS:CONFIRMED\r\n`;
      icsContent += `SEQUENCE:0\r\n`;
      icsContent += `TRANSP:TRANSPARENT\r\n`;
      icsContent += `BEGIN:VALARM\r\n`;
      icsContent += `TRIGGER:-P1D\r\n`;
      icsContent += `ACTION:DISPLAY\r\n`;
      icsContent += `DESCRIPTION:Recordatorio: ${tituloEscapado}\r\n`;
      icsContent += `END:VALARM\r\n`;
      icsContent += "END:VEVENT\r\n";
    });
    
    icsContent += "END:VCALENDAR";
    
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "examio_calendario.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
    
    setDescargado(true);
  };

  const agruparPorRamo = (): Record<string, (Evento & { _idx: number })[]> => {
    const grupos: Record<string, (Evento & { _idx: number })[]> = {};
    eventos.forEach((e, idx) => {
      const titulo = e.titulo || "Sin Título";
      const match = titulo.match(/^\[(.*?)\]/);
      const ramo = match ? match[1] : "General";
      if (!grupos[ramo]) grupos[ramo] = [];
      grupos[ramo].push({ ...e, _idx: idx });
    });
    return grupos;
  };

  const grupos = agruparPorRamo();

  // --- PANTALLA POST-DESCARGA (ÉXITO) ---
  if (descargado) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center animate-in zoom-in duration-300">
          
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          
          <h2 className="text-2xl font-bold text-[#0F172A] mb-2">¡Archivo descargado!</h2>
          <p className="text-sm text-[#64748B] mb-6">Si no se abrió automáticamente, descárgalo de nuevo</p>

          <div className="space-y-3">
            
            {/* Botón para descargar de nuevo */}
            <button
              onClick={descargarICS}
              className="w-full bg-[#0F172A] text-white font-bold py-4 rounded-xl text-base shadow-lg hover:bg-[#1E293B] transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>🔄</span> Descargar de nuevo
            </button>


            <button
              onClick={() => { sessionStorage.removeItem("result_ok"); router.push("/scan"); }}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              Escanear otros ramos
            </button>

            {/* Donación */}
            <div className="pt-6 border-t border-gray-100 mt-6">
              <p className="text-xs text-gray-400 mb-3">¿Te sirvió la app?</p>
              <a 
                href={LINK_DONACION}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all text-sm shadow-sm active:scale-95"
              >
                ☕ Invítame una energética
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --- PANTALLA PRINCIPAL DE RESULTADOS ---
  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 pb-8">
      <div className="max-w-2xl mx-auto pt-4">
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Tu Calendario</h1>
          <span className="text-xs font-medium bg-white px-3 py-1 rounded-full border border-gray-200 text-gray-500">
            {eventos.length} eventos
          </span>
        </div>

        {ramosNoAnalizados.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm font-semibold text-amber-800 mb-1">No se pudo analizar bien:</p>
            <p className="text-sm text-amber-700">{ramosNoAnalizados.join(", ")}</p>
            <p className="text-xs text-amber-600 mt-2">Revisa que los archivos no estén vacíos o dañados. Puedes volver a escanear y subir de nuevo solo ese ramo.</p>
          </div>
        )}

        {/* Lista de Eventos por ramo */}
        <div className="space-y-6 mb-8">
          {Object.entries(grupos).map(([ramo, eventosRamo]) => (
            <div key={ramo} className="animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3 ml-1">{ramo}</h2>
              
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
                {eventosRamo.map((evento) => {
                  const idx = evento._idx;
                  const { dia, mes } = formatearFecha(evento.fecha);
                  const editando = editandoEventoIdx === idx;
                  const tituloSinRamo = (evento.titulo || "Evento").replace(/^\[.*?\]\s*/, "");
                  return (
                    <div key={idx} className="flex items-center gap-4 p-4 border-b border-[#F1F5F9] last:border-0">
                      {/* Fecha o formulario de edición */}
                      <div className="flex flex-col items-center justify-center bg-slate-50 text-slate-700 rounded-xl w-16 h-16 flex-shrink-0 border border-slate-200">
                        {editando ? (
                          <input
                            type="date"
                            defaultValue={evento.fecha}
                            id={`fecha-${idx}`}
                            className="w-14 text-[0.65rem] border border-slate-300 rounded px-1 py-0.5 bg-white"
                          />
                        ) : (
                          <>
                            <span className="text-xl font-bold leading-none">{dia}</span>
                            <span className="text-[0.65rem] font-bold uppercase mt-1">{mes}</span>
                          </>
                        )}
                      </div>
                      
                      {/* Contenido o formulario */}
                      <div className="flex-1 min-w-0">
                        {editando ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              defaultValue={tituloSinRamo}
                              id={`titulo-${idx}`}
                              placeholder="Título"
                              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm font-bold text-[#0F172A]"
                            />
                            <input
                              type="text"
                              defaultValue={evento.descripcion}
                              id={`desc-${idx}`}
                              placeholder="Descripción (opcional)"
                              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#64748B]"
                            />
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const tituloInput = document.getElementById(`titulo-${idx}`) as HTMLInputElement;
                                  const fechaInput = document.getElementById(`fecha-${idx}`) as HTMLInputElement;
                                  const descInput = document.getElementById(`desc-${idx}`) as HTMLInputElement;
                                  const match = evento.titulo.match(/^\[(.*?)\]/);
                                  const prefijo = match ? match[0] : `[${ramo}] `;
                                  const titulo = (tituloInput?.value?.trim() || "").startsWith("[") ? tituloInput.value.trim() : prefijo + (tituloInput?.value?.trim() || "");
                                  if (titulo && fechaInput?.value) actualizarEvento(idx, { titulo, fecha: fechaInput.value, descripcion: descInput?.value?.trim() || "" });
                                }}
                                className="text-sm font-medium text-[#0F172A] hover:underline"
                              >
                                Guardar
                              </button>
                              <button type="button" onClick={() => setEditandoEventoIdx(null)} className="text-sm text-[#64748B] hover:underline">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-base font-bold text-[#0F172A] mb-1">{tituloSinRamo}</h3>
                            <p className="text-sm text-[#64748B]">{evento.descripcion}</p>
                          </>
                        )}
                      </div>
                      
                      {/* Botón editar a la derecha */}
                      {!editando && (
                        <button
                          type="button"
                          onClick={() => setEditandoEventoIdx(idx)}
                          className="flex-shrink-0 p-2 rounded-lg text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
                          title="Editar evento"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Agregar evento por ramo */}
              <div className="mt-3">
                {mostrarAgregarRamo !== ramo ? (
                  <button
                    type="button"
                    onClick={() => setMostrarAgregarRamo(ramo)}
                    className="w-full py-2.5 border border-dashed border-[#CBD5E1] rounded-lg text-[#64748B] text-sm font-medium hover:border-[#94A3B8] hover:text-[#475569] transition-colors"
                  >
                    + Agregar evento a {ramo}
                  </button>
                ) : (
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm space-y-3">
                    <h3 className="text-sm font-bold text-[#0F172A]">Nuevo evento en {ramo}</h3>
                    <input
                      type="text"
                      placeholder="Título (ej: Examen parcial)"
                      value={nuevoEvento.titulo}
                      onChange={(e) => setNuevoEvento((p) => ({ ...p, titulo: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm"
                    />
                    <input
                      type="date"
                      value={nuevoEvento.fecha}
                      onChange={(e) => setNuevoEvento((p) => ({ ...p, fecha: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Descripción (opcional)"
                      value={nuevoEvento.descripcion}
                      onChange={(e) => setNuevoEvento((p) => ({ ...p, descripcion: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => agregarEvento(ramo)}
                        disabled={!nuevoEvento.titulo.trim() || !nuevoEvento.fecha}
                        className="flex-1 bg-[#0F172A] text-white font-medium py-2 rounded-lg text-sm disabled:opacity-50 hover:bg-[#1E293B]"
                      >
                        Agregar
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMostrarAgregarRamo(null); setNuevoEvento({ titulo: "", fecha: "", descripcion: "" }); }}
                        className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#64748B] hover:bg-[#F8FAFC]"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botones */}
        <div className="space-y-4 max-w-md mx-auto">
          
          <button 
            onClick={descargarICS} 
            className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-base font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Descargar Calendario
          </button>

          <button 
            onClick={() => { sessionStorage.removeItem("result_ok"); router.push("/scan"); }} 
            className="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-sm"
          >
            Escanear otros ramos
          </button>

          {/* Donación */}
          <div className="text-center pt-4">
            <a 
              href={LINK_DONACION}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-3 rounded-xl text-sm shadow-sm active:scale-95 transition-all"
            >
              ☕ Apoya al creador
            </a>
            <p className="text-xs text-gray-400 mt-2">
              Si esta app te ayudó, invítame una energética 😊
            </p>
          </div>

        </div>

      </div>
    </main>
  );
}