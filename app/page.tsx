"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lexend } from "next/font/google";
import {
  Upload,
  ArrowRight,
  FileText,
  CheckCircle2,
  Smartphone,
  Monitor,
  Zap,
  X,
  Calendar
} from "lucide-react";
import { useState } from "react";
import AnimatedBackground from "./components/AnimatedBackground";

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
  variable: "--font-lexend",
});

type Device = "ios" | "android" | "desktop" | null;

const deviceInfo = {
  ios: {
    label: "iPhone / iPad",
    icon: <Smartphone className="w-6 h-6" />,
    instruction: "Al descargar, pulsa el archivo .ics y elige «Añadir todos». Se importa directo a Apple Calendar.",
    color: "bg-slate-900 text-white border-slate-900",
    subtleColor: "bg-slate-50 border-slate-200",
  },
  android: {
    label: "Android",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="7" y1="4" x2="9" y2="7" />
        <line x1="17" y1="4" x2="15" y2="7" />
        <path d="M4 15h16c0-4.4-3.6-8-8-8s-8 3.6-8 8" />
        <line x1="9" y1="11" x2="9.01" y2="11" />
        <line x1="15" y1="11" x2="15.01" y2="11" />
      </svg>
    ),
    instruction: "Abre el archivo .ics descargado con la app Google Calendar para importarlo automáticamente.",
    color: "bg-slate-900 text-white border-slate-900",
    subtleColor: "bg-slate-50 border-slate-200",
  },
  desktop: {
    label: "PC / Mac",
    icon: <Monitor className="w-6 h-6" />,
    instruction: "Haz doble clic en el .ics descargado, o impórtalo manualmente en Google Calendar, Outlook o iCal.",
    color: "bg-slate-900 text-white border-slate-900",
    subtleColor: "bg-slate-50 border-slate-200",
  },
};

export default function Home() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Device>(null);

  const handleContinue = () => {
    if (!selected) return;
    router.push(`/scan?device=${selected}`);
  };

  return (
    <main className={`relative min-h-screen w-full bg-[#f6f7f7] text-[#334155] ${lexend.className} selection:bg-slate-200`}>
      <AnimatedBackground opacity={1} />
      {/* ===== MODAL ===== */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white rounded-[24px] p-6 w-full max-w-md max-h-[90dvh] overflow-y-auto m-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-[#0f172a] font-black text-lg tracking-tight">¿Desde qué dispositivo abres?</h2>
                <p className="text-slate-400 text-xs mt-0.5">Para enviarte las instrucciones correctas al descargar</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Device Options */}
            <div className="p-4 flex flex-col gap-3">
              {(Object.keys(deviceInfo) as Device[]).filter(Boolean).map((device) => {
                const info = deviceInfo[device as keyof typeof deviceInfo];
                const isSelected = selected === device;
                return (
                  <button
                    key={device}
                    onClick={() => setSelected(device)}
                    className={`flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${isSelected
                      ? "border-[#334155] bg-[#334155] text-white"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300 text-[#334155]"
                      }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${isSelected ? "text-white" : "text-slate-500"}`}>
                      {info.icon}
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${isSelected ? "text-white" : "text-[#0f172a]"}`}>
                        {info.label}
                      </p>
                      <p className={`text-xs mt-1 leading-relaxed ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                        {info.instruction}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="ml-auto flex-shrink-0 w-5 h-5 rounded-full bg-white flex items-center justify-center mt-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#334155]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* CTA */}
            <div className="px-4 pb-6">
              <button
                onClick={handleContinue}
                disabled={!selected}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm transition-all duration-200 ${selected
                  ? "bg-[#334155] hover:bg-[#1e293b] text-white shadow-lg shadow-slate-900/20 active:scale-[0.98]"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
              >
                <Upload className="w-4 h-4" />
                Escanear mis ramos
                <ArrowRight className={`w-4 h-4 transition-transform ${selected ? "translate-x-0" : ""}`} />
              </button>
              {!selected && (
                <p className="text-center text-slate-400 text-[11px] mt-2 font-medium">Selecciona un dispositivo para continuar</p>
              )}
            </div>

          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center w-full min-h-screen">

        {/* HEADER */}
        <header className="w-full max-w-[1000px] flex items-center justify-between px-6 py-8 z-10">
          <div className="flex items-center gap-3">
            <div className="relative w-15 h-15 rounded-full overflow-hidden shadow-lg shadow-slate-200 border border-slate-100">
              <Image src="/examio_logo.png" alt="Logo Examio" fill className="object-cover" />
            </div>
            <span className="text-[#0f172a] font-bold text-2xl tracking-tighter">Examio</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-slate-500 hover:text-[#334155] transition-colors text-xs font-bold uppercase tracking-widest">Proceso</a>
            <a href="#faq" className="text-slate-500 hover:text-[#334155] transition-colors text-xs font-bold uppercase tracking-widest">FAQ</a>
          </nav>
        </header>

        {/* HERO */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-[800px] py-12">
          <h1 className="text-[#0f172a] text-7xl md:text-8xl font-black tracking-tighter mb-6 drop-shadow-sm">
            Examio
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-lg mb-12 leading-relaxed">
            Tus ramos al calendario en segundos.<br />Simple, rápido y completamente gratis.
          </p>

          <div className="flex flex-col gap-4 items-center w-full">
            <div className="p-2 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 w-full md:w-auto">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-4 bg-[#334155] hover:bg-[#1e293b] text-white px-8 py-5 md:px-12 md:py-6 rounded-[2rem] text-lg md:text-xl font-bold transition-all active:scale-[0.98] group shadow-lg shadow-slate-900/20 w-full md:w-auto"
              >
                <Upload className="w-6 h-6" />
                <span>Escanear Ramos</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform opacity-50 hidden md:block" />
              </button>
            </div>

            <div className="relative mt-2 w-full md:w-auto">
              <div className="absolute -top-3 -right-2 z-10 bg-red-500 text-white text-[10px] md:text-xs font-black uppercase px-3 py-1 rounded-full shadow-lg shadow-red-500/40 transform rotate-12 border-2 border-[#f6f7f7] animate-pulse">
                ¡NUEVO!
              </div>
              <button
                onClick={() => router.push("/scheduler")}
                className="flex items-center justify-center gap-3 bg-[#334155]/5 hover:bg-[#334155]/10 text-[#334155] px-8 py-4 rounded-full text-base md:text-lg font-bold transition-all active:scale-[0.98] group border border-[#334155]/20 shadow-md shadow-[#334155]/10 w-full"
              >
                <Calendar className="w-6 h-6 text-[#334155]" />
                <span>Armar Horarios</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-[#334155]/70" />
              </button>
            </div>
          </div>
          <p className="mt-6 text-slate-400 text-xs font-bold tracking-wide uppercase">Soporta PDF, Word y Capturas</p>
        </div>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="w-full max-w-[850px] px-6 py-12 scroll-mt-20">
          <div className="text-center mb-10">
            <h2 className="text-[#0f172a] text-2xl font-black tracking-tight">¿Cómo funciona?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[#334155]/5 flex items-center justify-center mb-5">
                <FileText className="w-6 h-6 text-[#334155]" />
              </div>
              <h4 className="text-[#0f172a] text-lg font-bold mb-2">1. Sube tu Archivo o Foto</h4>
              <p className="text-slate-500 text-sm leading-relaxed">Carga el programa de tu curso o el calendario académico. Aceptamos cualquier formato.</p>
            </div>
            <div className="flex flex-col p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-[#334155]/5 flex items-center justify-center mb-5">
                <CheckCircle2 className="w-6 h-6 text-[#334155]" />
              </div>
              <h4 className="text-[#0f172a] text-lg font-bold mb-2">2. Descarga tu calendario</h4>
              <p className="text-slate-500 text-sm leading-relaxed">Obtén un archivo mágico (.ics) compatible con Google Calendar, Outlook y Apple.</p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="w-full py-8 mt-auto border-t border-slate-200 bg-white/50 backdrop-blur-sm text-center flex flex-col items-center gap-5">
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
          <a href="/legal" className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors underline decoration-slate-300 underline-offset-4">
            Términos de Servicio y Privacidad
          </a>
        </footer>

      </div>
    </main>
  );
}