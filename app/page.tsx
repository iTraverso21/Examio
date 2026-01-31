"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC]">
      <div className="max-w-md w-full text-center">
        
        {/* LOGO/NOMBRE */}
        <div className="mb-10 animate-in fade-in zoom-in duration-500">
          <h1 className="text-6xl font-extrabold text-[#0F172A] mb-4 tracking-tight">
            Examio
          </h1>
          <p className="text-lg text-[#64748B] font-medium leading-relaxed">
            Organiza tu vida académica en segundos.<br/>
            Sube tu PDF y crea tu calendario.
          </p>
        </div>

        {/* BOTÓN PRINCIPAL (CTA) */}
        <button
          onClick={() => router.push('/scan')}
          className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xl font-bold py-6 px-8 rounded-2xl shadow-xl shadow-slate-200 transition-all transform hover:scale-[1.02] active:scale-95 mb-8 flex items-center justify-center gap-3"
        >
          Escanear Ramos
        </button>

        {/* SECCIÓN DE AYUDA (MINIMALISTA) */}
        <div className="mb-8">
          <button
            onClick={() => setMostrarAyuda(!mostrarAyuda)}
            className={`w-full text-sm font-medium py-3 px-5 rounded-xl transition-all duration-300 flex items-center justify-between group border ${
              mostrarAyuda 
                ? "bg-white text-[#0F172A] border-gray-300 shadow-sm" 
                : "bg-transparent text-[#64748B] border-transparent hover:bg-white hover:border-gray-200 hover:shadow-sm"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <svg className={`w-4 h-4 transition-colors ${mostrarAyuda ? 'text-[#0F172A]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              ¿Dónde se guardará mi calendario?
            </span>
            <span className={`text-gray-400 transition-transform duration-300 ${mostrarAyuda ? 'rotate-180 text-[#0F172A]' : ''}`}>
              ▼
            </span>
          </button>

          {/* CONTENIDO DE AYUDA (TRANSICIÓN SUAVE) */}
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              mostrarAyuda ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"
            }`}
          >
            <div className="bg-white border border-gray-100 rounded-2xl p-1 text-left shadow-sm">
              <div className="space-y-1">
                
                {/* iPhone */}
                <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="mt-0.5 p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">
                    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                  </div>
                  <div>
                    <p className="font-bold text-[#0F172A] text-xs uppercase tracking-wide mb-1">iPhone / iPad</p>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      Se guarda en <b>Apple Calendar</b>. Para Google Calendar, hazlo desde PC.
                    </p>
                  </div>
                </div>

                <div className="h-px bg-gray-50 mx-4"></div>

                {/* Android */}
                
                <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="mt-0.5 p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">
                    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {/* Icono Android (Celular sin botón home + speaker arriba) */}
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 4h4m-4 0a2 2 0 00-2 2v12a2 2 0 002 2h4a2 2 0 002-2V6a2 2 0 00-2-2m-4 0V4"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-[#0F172A] text-xs uppercase tracking-wide mb-1">Android</p>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      Elige <b>Google Calendar</b> al abrir el archivo y dale a Guardar.
                    </p>
                  </div>
                </div>

                <div className="h-px bg-gray-50 mx-4"></div>

                {/* PC */}
                <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="mt-0.5 p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">
                    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  </div>
                  <div>
                    <p className="font-bold text-[#0F172A] text-xs uppercase tracking-wide mb-1">Computador</p>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      Importa el archivo en <i>calendar.google.com</i> para máxima seguridad.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* PASOS (Ultra Minimalistas) */}
        <div className="grid grid-cols-2 gap-4 mt-8 opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm border border-gray-100">
              📄
            </div>
            <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wide">1. Sube PDF</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm border border-gray-100">
              📅
            </div>
            <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wide">2. Descarga</p>
          </div>
        </div>

        {/* FOOTER */}
        <p className="mt-12 text-[10px] text-[#94A3B8] font-medium uppercase tracking-widest">
          Gratis • Sin Cuenta • Powered by Gemini AI
        </p>
      </div>
    </main>
  );
}