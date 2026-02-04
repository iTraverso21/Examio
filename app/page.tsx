"use client";

import { useRouter } from "next/navigation";
import Image from "next/image"; // Importamos Image para el logo
import { Lexend } from "next/font/google";
import { 
  Upload, 
  ArrowRight, 
  FileText, 
  CheckCircle2, 
  Smartphone, 
  Monitor, 
  Zap
} from "lucide-react";

// Configuración de la fuente Lexend
const lexend = Lexend({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
  variable: "--font-lexend",
});

export default function Home() {
  const router = useRouter();

  return (
    <main className={`relative min-h-screen w-full bg-[#f6f7f7] text-[#334155] ${lexend.className} selection:bg-slate-200 animate-slide-down`}>
      
      {/* Fondo sutil (Luz superior) */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8)_0%,transparent_50%)]" />

      <div className="relative flex flex-col items-center w-full min-h-screen">
        
        {/* --- HEADER --- */}
        <header className="w-full max-w-[1000px] flex items-center justify-between px-6 py-8 z-10">
          <div className="flex items-center gap-3">
            <div className="relative w-15 h-15 rounded-full overflow-hidden shadow-lg shadow-slate-200 border border-slate-100">
              <Image 
                src="/examio_logo.png" 
                alt="Logo Examio" 
                fill 
                className="object-cover" 
              />
            </div>
            <span className="text-[#0f172a] font-bold text-2xl tracking-tighter">Examio</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-slate-500 hover:text-[#334155] transition-colors text-xs font-bold uppercase tracking-widest">Proceso</a>
            <a href="#faq" className="text-slate-500 hover:text-[#334155] transition-colors text-xs font-bold uppercase tracking-widest">FAQ</a>
          </nav>
        </header>

        {/* --- HERO SECTION --- */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-[800px] py-12">
          <h1 className="text-[#0f172a] text-7xl md:text-8xl font-black tracking-tighter mb-6 drop-shadow-sm">
            Examio
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-lg mb-12 leading-relaxed">
            Tus ramos al calendario en segundos.<br/>Simple, rápido y completamente gratis.
          </p>
          
          <div className="p-2 bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100">
            <button 
              onClick={() => router.push('/scan')}
              className="flex items-center gap-4 bg-[#334155] hover:bg-[#1e293b] text-white px-10 py-5 md:px-12 md:py-6 rounded-3xl text-xl font-bold transition-all active:scale-[0.98] group shadow-lg shadow-slate-900/20"
            >
              <Upload className="w-6 h-6" />
              <span>Escanear Ramos</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform opacity-50" />
            </button>
          </div>
          <p className="mt-6 text-slate-400 text-xs font-bold tracking-wide uppercase">Soporta PDF, Word y Capturas</p>
        </div>

        {/* --- HOW IT WORKS (Horizontal Cards) --- */}
        <section id="how-it-works" className="w-full max-w-[850px] px-6 py-12 scroll-mt-20">
          
          {/* Título Agregado Aquí */}
          <div className="text-center mb-10">
             <h2 className="text-[#0f172a] text-2xl font-black tracking-tight">¿Cómo funciona?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1 */}
            <div className="flex flex-col p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[#334155]/5 flex items-center justify-center mb-5">
                <FileText className="w-6 h-6 text-[#334155]" />
              </div>
              <h4 className="text-[#0f172a] text-lg font-bold mb-2">1. Sube tu Archivo o Foto</h4>
              <p className="text-slate-500 text-sm leading-relaxed">Carga el programa de tu curso o el calendario académico. Aceptamos cualquier formato.</p>
            </div>
            
            {/* Card 2 */}
            <div className="flex flex-col p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[#334155]/5 flex items-center justify-center mb-5">
                <CheckCircle2 className="w-6 h-6 text-[#334155]" />
              </div>
              <h4 className="text-[#0f172a] text-lg font-bold mb-2">2. Descarga tu calendario</h4>
              <p className="text-slate-500 text-sm leading-relaxed">Obtén un archivo mágico (.ics) compatible con Google Calendar, Outlook y Apple.</p>
            </div>

          </div>
        </section>

        {/* --- FAQ / GUIDE (Grid de 3 columnas) --- */}
        <section id="faq" className="w-full max-w-[850px] px-6 pb-20 scroll-mt-20">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] mb-8 text-center">Guía de Implementación</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
              {/* iOS */}
              <div className="text-center md:text-left group">
                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                  <Smartphone className="w-5 h-5 text-slate-400 group-hover:text-[#334155] transition-colors" />
                  <span className="text-[#0f172a] text-sm font-bold">iOS</span>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">Pulsa el archivo descargado y selecciona <span className="text-[#334155] font-semibold">'Añadir todos'</span>, se agregará automáticamente a Apple Calendar.</p>
              </div>

              {/* Android */}
              <div className="text-center md:text-left group">
                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                  <div className="w-7 h-7 flex items-center justify-center">
                    {/* SVG personalizado del Robot de Android estilo Lucide */}
                    <svg 
                      className="w-7 h-7 text-slate-400 group-hover:text-[#334155] transition-colors" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <line x1="7" y1="4" x2="9" y2="7" />
                      <line x1="17" y1="4" x2="15" y2="7" />
                      <path d="M4 15h16c0-4.4-3.6-8-8-8s-8 3.6-8 8" />
                      <line x1="9" y1="11" x2="9.01" y2="11" />
                      <line x1="15" y1="11" x2="15.01" y2="11" />
                    </svg>
                  </div>
                  <span className="text-[#0f172a] text-sm font-bold">Android</span>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">Abre el archivo con la app de <span className="text-[#334155] font-semibold">Google Calendar</span>.</p>
              </div>

              {/* Desktop */}
              <div className="text-center md:text-left group">
                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                  <Monitor className="w-5 h-5 text-slate-400 group-hover:text-[#334155] transition-colors" />
                  <span className="text-[#0f172a] text-sm font-bold">PC / Mac</span>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">Importa vía Outlook, iCal o <span className="text-[#334155] font-semibold">Google Calendar</span>.</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="w-full py-8 mt-auto border-t border-slate-200 bg-white/50 backdrop-blur-sm text-center">
          <div className="flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            <span>Gratis</span>
            <span className="text-slate-300">•</span>
            <span>Sin Cuenta</span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
               Powered by Gemini AI
               <Zap className="w-3 h-3 fill-slate-400" />
            </span>
          </div>
        </footer>

      </div>
    </main>
  );
}