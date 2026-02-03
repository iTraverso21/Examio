"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useScan } from "../context/ScanContext";

export default function ScanPage() {
  const router = useRouter();
  const { ramos, setRamos } = useScan();

  const [analizando, setAnalizando] = useState(false);
  const [progreso, setProgreso] = useState({ actual: 0, total: 0, archivo: "" });
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const mostrarError = (mensaje: string) => {
    setErrorToast(mensaje);
    setTimeout(() => setErrorToast(null), 3000);
  };

  const agregarRamo = () => {
    if (ramos.length >= 5) return mostrarError("Máximo 5 ramos por sesión");
    setRamos([...ramos, { id: Date.now(), nombre: "", archivos: [] }]);
  };

  const eliminarRamo = (id: number) => {
    if (ramos.length === 1) return;
    setRamos(ramos.filter(r => r.id !== id));
  };

  const actualizarNombre = (id: number, nombre: string) => {
    setRamos(ramos.map(r => r.id === id ? { ...r, nombre } : r));
  };

  const agregarArchivos = (id: number, files: FileList | null) => {
    if (!files) return;
    setRamos(ramos.map(r => {
      if (r.id === id) {
        const nuevosArchivos = Array.from(files);
        const total = [...r.archivos, ...nuevosArchivos].slice(0, 3);
        return { ...r, archivos: total };
      }
      return r;
    }));
  };

  const eliminarArchivo = (ramoId: number, archivoIndex: number) => {
    setRamos(ramos.map(r => {
      if (r.id === ramoId) {
        return { ...r, archivos: r.archivos.filter((_, i) => i !== archivoIndex) };
      }
      return r;
    }));
  };

  const handlePaste = (ramoId: number, e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const file = new File([blob], `pasted-${Date.now()}.png`, { type: blob.type });
          setRamos(ramos.map(r => {
            if (r.id === ramoId && r.archivos.length < 3) {
              return { ...r, archivos: [...r.archivos, file] };
            }
            return r;
          }));
        }
      }
    }
  };

  const analizar = async () => {
    const ramosValidos = ramos.filter(r => r.nombre.trim() && r.archivos.length > 0);

    if (ramosValidos.length === 0) return mostrarError("Agrega al menos un ramo con archivos");
    
    setAnalizando(true);
    setProgreso({ actual: 0, total: ramosValidos.length, archivo: "" });

    try {
      const resultados: { titulo: string; fecha: string; descripcion: string }[] = [];
      const ramosFallidos: string[] = [];

      for (let i = 0; i < ramosValidos.length; i++) {
        const ramo = ramosValidos[i];

        setProgreso({
          actual: i + 1,
          total: ramosValidos.length,
          archivo: `Analizando ${ramo.nombre}...`
        });

        const formData = new FormData();
        formData.append('nombreRamo', ramo.nombre);

        ramo.archivos.forEach((archivo, index) => {
          formData.append(`file_${index}`, archivo);
        });

        const response = await fetch('/api/analizar', { method: 'POST', body: formData });
        const data = await response.json();

        if (response.status === 429) {
          sessionStorage.setItem("error_ok", "1");
          router.push(`/error?message=${encodeURIComponent(data.error || "Límite alcanzado")}`);
          return;
        }

        if (response.status === 500 || data.error) {
          ramosFallidos.push(ramo.nombre);
          continue;
        }

        if (data.eventos && Array.isArray(data.eventos) && data.eventos.length > 0) {
          resultados.push(...data.eventos);
        } else {
          ramosFallidos.push(ramo.nombre);
        }
      }

      if (resultados.length === 0) {
        sessionStorage.setItem("error_ok", "1");
        router.push(
          "/error?message=" + encodeURIComponent(
            ramosFallidos.length > 0
              ? "No se pudo analizar ningún ramo. Revisa que los archivos no estén vacíos o dañados."
              : "No se encontraron eventos. Revisa que los archivos tengan un calendario de evaluaciones."
          )
        );
        return;
      }

      localStorage.setItem("eventos", JSON.stringify(resultados));
      sessionStorage.setItem("result_ok", "1");
      if (ramosFallidos.length > 0) {
        sessionStorage.setItem("ramos_no_analizados", JSON.stringify(ramosFallidos));
      } else {
        sessionStorage.removeItem("ramos_no_analizados");
      }
      router.push('/result');

    } catch (error) {
      console.error(error);
      sessionStorage.setItem("error_ok", "1");
      router.push('/error?message=' + encodeURIComponent('Error de conexión'));
    }
  };

  if (analizando) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-16 h-16 border-4 border-[#CBD5E1] border-t-[#0F172A] rounded-full animate-spin mx-auto"></div>
          </div>
          <h2 className="text-2xl font-bold text-[#020617] mb-2">Analizando tus archivos...</h2>
          <p className="text-sm text-[#64748B] mb-8 font-medium">Ramo {progreso.actual} de {progreso.total}</p>
          <div className="w-full bg-[#E2E8F0] rounded-full h-2 mb-4 overflow-hidden">
            <div className="bg-[#0F172A] h-2 rounded-full transition-all duration-300 ease-out" style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}></div>
          </div>
          <p className="text-xs text-[#94A3B8] font-mono truncate">{progreso.archivo}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 pb-28 relative">
      {errorToast && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-down w-full max-w-sm px-4">
          <div className="bg-[#EF4444] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <span className="font-semibold text-sm">{errorToast}</span>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto pt-4">
        <div className="mb-8">
          <button onClick={() => router.push('/')} className="text-[#64748B] hover:text-[#0F172A] text-sm font-semibold mb-6 flex items-center gap-2 transition-colors">
            ← Volver
          </button>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2 tracking-tight">Sube tus Ramos</h1>
          <p className="text-sm text-[#64748B]">Máximo 5 ramos • 3 archivos por ramo</p>
        </div>

        <div className="space-y-6 mb-8">
          {ramos.map((ramo, index) => (
            <div key={ramo.id} className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm hover:border-[#0F172A] transition-all duration-200 group">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-7 h-7 bg-[#F1F5F9] rounded-md flex items-center justify-center text-[#0F172A] font-bold text-sm">{index + 1}</div>
                <input 
                  type="text" placeholder="Ej: Cálculo I" value={ramo.nombre}
                  onChange={(e) => actualizarNombre(ramo.id, e.target.value)}
                  className="flex-1 text-lg font-semibold text-[#020617] placeholder:text-[#94A3B8] bg-transparent border-b border-transparent focus:border-[#0F172A] outline-none pb-1 transition-colors"
                />
                {ramos.length > 1 && (
                  <button onClick={() => eliminarRamo(ramo.id)} className="text-[#94A3B8] hover:text-[#EF4444] transition-colors">
                    ✕
                  </button>
                )}
              </div>

              <div className="bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-lg p-6 transition-colors group-hover:bg-[#F1F5F9] group-hover:border-[#94A3B8]" onPaste={(e) => handlePaste(ramo.id, e)}>
                <input type="file" accept=".pdf,.doc,.docx,image/*" multiple onChange={(e) => agregarArchivos(ramo.id, e.target.files)} className="hidden" id={`file-${ramo.id}`} />
                <label htmlFor={`file-${ramo.id}`} className="block text-center cursor-pointer">
                  <div className="text-2xl mb-2 opacity-50">📎</div>
                  <p className="text-sm font-semibold text-[#0F172A] mb-1">Click para subir o Ctrl+V</p>
                  <p className="text-xs text-[#64748B]">PDF, Word o imágenes (Máx 3)</p>
                </label>
                {ramo.archivos.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-[#E2E8F0] pt-3">
                    {ramo.archivos.map((archivo, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white border border-[#E2E8F0] rounded-md p-2">
                        <div className="w-2 h-2 rounded-full bg-[#22C55E]"></div>
                        <span className="text-xs font-medium text-[#475569] flex-1 truncate">{archivo.name}</span>
                        <button onClick={() => eliminarArchivo(ramo.id, i)} className="text-[#94A3B8] hover:text-[#EF4444] p-1">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {ramos.length < 5 && (
          <button onClick={agregarRamo} className="w-full py-4 border border-dashed border-[#94A3B8] rounded-xl text-[#64748B] font-semibold hover:bg-white hover:text-[#0F172A] hover:border-[#0F172A] transition-all mb-8">
            + Agregar otro ramo
          </button>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-[#E2E8F0] p-4 md:relative md:bg-transparent md:border-0 md:p-0 md:backdrop-blur-none">
          <button onClick={analizar} disabled={analizando} className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-lg font-semibold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
            Analizar Ramos
          </button>
        </div>
      </div>
    </main>
  );
}