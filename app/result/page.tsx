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

  const LINK_DONACION = "https://link.mercadopago.cl/examio"; 

  useEffect(() => {
    const data = sessionStorage.getItem('eventos');
    if (!data) {
      router.push('/scan');
      return;
    }
    
    try {
      const eventosData = JSON.parse(data);
      eventosData.sort((a: Evento, b: Evento) => {
        const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
        const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
        return fechaA - fechaB;
      });
      setEventos(eventosData);
    } catch (e) {
      console.error(e);
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

  const agruparPorRamo = () => {
    const grupos: Record<string, Evento[]> = {};
    eventos.forEach(e => {
      const titulo = e.titulo || "Sin Título";
      const match = titulo.match(/^\[(.*?)\]/);
      const ramo = match ? match[1] : "General";
      if (!grupos[ramo]) grupos[ramo] = [];
      grupos[ramo].push(e);
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
              onClick={() => { sessionStorage.clear(); router.push('/scan'); }}
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

        {/* Lista de Eventos */}
        <div className="space-y-6 mb-8">
          {Object.entries(grupos).map(([ramo, eventosRamo]) => (
            <div key={ramo} className="animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3 ml-1">{ramo}</h2>
              
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
                {eventosRamo.map((evento, i) => {
                  const { dia, mes } = formatearFecha(evento.fecha);
                  return (
                    <div key={i} className="flex items-center gap-4 p-4 border-b border-[#F1F5F9] last:border-0">
                      {/* Fecha más grande */}
                      <div className="flex flex-col items-center justify-center bg-slate-50 text-slate-700 rounded-xl w-16 h-16 flex-shrink-0 border border-slate-200">
                        <span className="text-xl font-bold leading-none">{dia}</span>
                        <span className="text-[0.65rem] font-bold uppercase mt-1">{mes}</span>
                      </div>
                      
                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-[#0F172A] mb-1">
                          {(evento.titulo || "Evento").replace(/^\[.*?\]\s*/, '')}
                        </h3>
                        <p className="text-sm text-[#64748B]">{evento.descripcion}</p>
                      </div>
                    </div>
                  );
                })}
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
            onClick={() => { sessionStorage.clear(); router.push('/scan'); }} 
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