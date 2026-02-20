"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useScan } from "../context/ScanContext";
import { Smartphone, Monitor, ChevronDown, Check } from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";

export default function ScanPage() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="w-20 h-20 border-[3px] border-slate-200 border-t-slate-700 rounded-full animate-spin"></div>
      </main>
    }>
      <ScanContent />
    </Suspense>
  );
}

function ScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deviceParams = searchParams.get("device");

  const { ramos, setRamos } = useScan();

  const [analizando, setAnalizando] = useState(false);
  const [progreso, setProgreso] = useState({ actual: 0, total: 0, archivo: "" });
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [ramoHover, setRamoHover] = useState<number | null>(null);
  const [dragActiveId, setDragActiveId] = useState<number | null>(null);
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);

  const deviceParam = searchParams.get("device") || "desktop";

  const devices = [
    { id: "ios", label: "iOS", icon: <Smartphone className="w-4 h-4" /> },
    {
      id: "android", label: "Android", icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="7" y1="4" x2="9" y2="7" /><line x1="17" y1="4" x2="15" y2="7" />
          <path d="M4 15h16c0-4.4-3.6-8-8-8s-8 3.6-8 8" />
          <line x1="9" y1="11" x2="9.01" y2="11" /><line x1="15" y1="11" x2="15.01" y2="11" />
        </svg>
      )
    },
    { id: "desktop", label: "PC / Mac", icon: <Monitor className="w-4 h-4" /> },
  ];

  const currentDevice = devices.find(d => d.id === deviceParam) || devices[2];

  const changeDevice = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("device", id);
    router.replace(`/scan?${params.toString()}`);
    setShowDeviceMenu(false);
  };

  // Referencia para cancelar el proceso
  const cancelarRef = useRef(false);

  const mostrarError = (mensaje: string) => {
    setErrorToast(mensaje);
    setTimeout(() => setErrorToast(null), 3000);
  };

  const cancelarAnalisis = () => {
    cancelarRef.current = true;
    setAnalizando(false);
    mostrarError("Análisis cancelado");
  };

  // Efecto global para pegar archivos (Ctrl+V)
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (ramoHover === null) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      let archivosEncontrados = false;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1 || items[i].type.indexOf('pdf') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            archivosEncontrados = true;
            const ext = items[i].type.includes('pdf') ? 'pdf' : 'png';
            const file = new File([blob], `pegado-${Date.now()}.${ext}`, { type: blob.type });

            setRamos(prevRamos => prevRamos.map(r => {
              if (r.id === ramoHover && r.archivos.length < 3) {
                return { ...r, archivos: [...r.archivos, file] };
              }
              return r;
            }));
          }
        }
      }

      if (archivosEncontrados) {
        e.preventDefault();
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [ramoHover, setRamos]);

  // Manejadores de Drag & Drop
  const handleDrag = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveId(id);
    } else if (e.type === "dragleave") {
      setDragActiveId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveId(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      agregarArchivos(id, e.dataTransfer.files);
    }
  };

  // Funciones de gestión de ramos
  const agregarRamo = () => {
    if (ramos.length >= 6) return mostrarError("Máximo 6 ramos por sesión");
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

  const handlePasteLocal = (ramoId: number, e: React.ClipboardEvent) => {
    e.stopPropagation();
  };

  // Función principal de Análisis
  const analizar = async () => {
    // Validación: Todos deben tener nombre Y archivos
    const ramosIncompletos = ramos.some(r =>
      (r.nombre.trim() !== "" && r.archivos.length === 0) ||
      (r.nombre.trim() === "" && r.archivos.length > 0)
    );

    if (ramosIncompletos) {
      return mostrarError("Completa nombre y archivos de todos los ramos (o elimina los vacíos).");
    }

    const ramosValidos = ramos.filter(r => r.nombre.trim() && r.archivos.length > 0);

    if (ramosValidos.length === 0) return mostrarError("Agrega al menos un ramo completo");

    cancelarRef.current = false;
    setAnalizando(true);
    setProgreso({ actual: 0, total: ramosValidos.length, archivo: "" });

    try {
      const resultados: { titulo: string; fecha: string; descripcion: string }[] = [];
      const ramosFallidos: string[] = [];

      for (let i = 0; i < ramosValidos.length; i++) {
        if (cancelarRef.current) return;

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

        if (cancelarRef.current) return;

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

      if (cancelarRef.current) return;

      if (resultados.length === 0) {
        sessionStorage.setItem("error_ok", "1");

        // --- CAMBIO AQUÍ: Mensaje de error más descriptivo ---
        const mensajeError = ramosFallidos.length > 0
          ? "No se pudo analizar ningún archivo. Verifica que no estén dañados."
          : "No encontramos fechas. Asegúrate de que el archivo tenga el CALENDARIO explícito, no solo la descripción del curso.";

        router.push("/error?message=" + encodeURIComponent(mensajeError));
        return;
      }

      localStorage.setItem("eventos", JSON.stringify(resultados));
      sessionStorage.setItem("result_ok", "1");
      if (ramosFallidos.length > 0) {
        sessionStorage.setItem("ramos_no_analizados", JSON.stringify(ramosFallidos));
      } else {
        sessionStorage.removeItem("ramos_no_analizados");
      }

      const query = deviceParams ? `?device=${deviceParams}` : "";
      router.push(`/result${query}`);

    } catch (error) {
      if (cancelarRef.current) return;
      console.error(error);
      sessionStorage.setItem("error_ok", "1");
      router.push('/error?message=' + encodeURIComponent('Error de conexión'));
    }
  };

  // Pantalla de Carga
  if (analizando) {
    return (
      <main className="relative min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC] overflow-hidden animate-slide-down">
        <AnimatedBackground opacity={0.25} />

        <div className="max-w-md w-full text-center relative z-10 flex flex-col items-center">
          <div className="mb-8">
            <div className="w-20 h-20 border-[3px] border-slate-200 border-t-slate-700 rounded-full animate-spin mx-auto"></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Analizando tus archivos...</h2>
          <p className="text-sm text-slate-500 mb-8 font-medium">Ramo {progreso.actual} de {progreso.total}</p>

          <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4 overflow-hidden shadow-inner">
            <div
              className="bg-slate-700 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
            ></div>
          </div>

          <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100 inline-block mb-8">
            <p className="text-xs text-slate-600 font-medium truncate max-w-xs">{progreso.archivo}</p>
          </div>

          <button
            onClick={cancelarAnalisis}
            className="text-slate-400 hover:text-slate-600 font-semibold text-sm px-4 py-2 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white transition-all"
          >
            Cancelar
          </button>
        </div>
      </main>
    );
  }

  // Pantalla Principal
  return (
    <>
      {errorToast && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-down w-full max-w-sm px-4">
          <div className="bg-red-500 text-white px-5 py-4 rounded-[20px] shadow-lg shadow-red-500/20 flex items-center gap-3 backdrop-blur-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-sm">{errorToast}</span>
          </div>
        </div>
      )}

      <main className="relative min-h-screen p-4 pb-28 bg-[#F8FAFC] overflow-hidden animate-slide-down">
        <AnimatedBackground opacity={0.25} />

        <div className="max-w-xl mx-auto pt-4 relative z-10">

          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.push('/')}
                className="text-slate-500 hover:text-slate-900 text-sm font-semibold flex items-center gap-2 transition-all hover:-translate-x-1 duration-200"
              >
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </button>

              {/* Selector de Dispositivo */}
              <div className="relative">
                <button
                  onClick={() => setShowDeviceMenu(!showDeviceMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm hover:border-slate-300 transition-all text-xs font-bold text-slate-700 active:scale-95"
                >
                  <span className="text-slate-400">{currentDevice.icon}</span>
                  {currentDevice.label}
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showDeviceMenu ? 'rotate-180' : ''}`} />
                </button>

                {showDeviceMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-[100] py-2 animate-in zoom-in duration-200">
                    <p className="px-4 py-2 text-[10px] uppercase tracking-widest font-black text-slate-400">Cambiar Dispositivo</p>
                    {devices.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => changeDevice(d.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors hover:bg-slate-50
                          ${deviceParam === d.id ? 'text-slate-900' : 'text-slate-500'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <span className={deviceParam === d.id ? 'text-slate-900' : 'text-slate-400'}>{d.icon}</span>
                          {d.label}
                        </div>
                        {deviceParam === d.id && <Check className="w-4 h-4 text-slate-900" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Sube tus Ramos</h1>
            <p className="text-sm text-slate-500 font-medium">Máximo 6 ramos • 3 archivos por ramo</p>
          </div>

          <div className="space-y-4 mb-8">
            {ramos.map((ramo, index) => {
              const isHovered = ramoHover === ramo.id;
              const isDragActive = dragActiveId === ramo.id;

              return (
                <div
                  key={ramo.id}
                  onMouseEnter={() => setRamoHover(ramo.id)}
                  onMouseLeave={() => setRamoHover(null)}
                  onPaste={(e) => handlePasteLocal(ramo.id, e)}
                  tabIndex={0}
                  className={`bg-white rounded-[24px] p-5 shadow-sm border transition-all duration-200 group outline-none
                    ${isDragActive
                      ? 'border-blue-500 ring-4 ring-blue-500/20 shadow-lg scale-[1.01]'
                      : isHovered
                        ? 'border-blue-400 ring-2 ring-blue-500/10 shadow-md'
                        : 'border-slate-100 hover:border-slate-200'
                    }
                  `}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-colors
                      ${(isHovered || isDragActive) ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}
                    `}>
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      placeholder="Ej: Cálculo I"
                      value={ramo.nombre}
                      onChange={(e) => actualizarNombre(ramo.id, e.target.value)}
                      className="flex-1 text-lg font-bold text-slate-900 placeholder:text-slate-400 bg-transparent border-b-2 border-transparent focus:border-slate-700 outline-none pb-2 transition-colors"
                    />
                    {ramos.length > 1 && (
                      <button
                        onClick={() => eliminarRamo(ramo.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div
                    className={`bg-slate-50 border-2 border-dashed rounded-[20px] p-6 transition-all outline-none relative flex flex-col justify-center
                      ${isDragActive
                        ? 'border-blue-500 bg-blue-50'
                        : isHovered
                          ? 'border-blue-300 bg-blue-50/30'
                          : 'border-slate-200 group-hover:bg-slate-100/50 group-hover:border-slate-300'
                      }
                    `}
                    onDragEnter={(e) => handleDrag(e, ramo.id)}
                    onDragLeave={(e) => handleDrag(e, ramo.id)}
                    onDragOver={(e) => handleDrag(e, ramo.id)}
                    onDrop={(e) => handleDrop(e, ramo.id)}
                  >
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,image/*"
                      multiple
                      onChange={(e) => agregarArchivos(ramo.id, e.target.files)}
                      className="hidden"
                      id={`file-${ramo.id}`}
                    />
                    <label htmlFor={`file-${ramo.id}`} className="block text-center cursor-pointer w-full h-full relative z-10">

                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        {isDragActive ? (
                          <span className="text-sm font-bold text-blue-600 animate-pulse">¡Suelta los archivos aquí!</span>
                        ) : (
                          <div className="text-sm font-bold text-slate-900 flex items-center gap-2 justify-center">
                            <span className="md:hidden">Toca para subir</span>
                            <span className="hidden md:inline">Click, Arrastra o Pega</span>
                            <span className={`hidden md:flex items-center gap-1 bg-white border px-1.5 py-0.5 rounded text-[10px] font-medium shadow-sm select-none transition-colors
                              ${isHovered ? 'border-blue-200 text-blue-600' : 'border-slate-200 text-slate-500'}
                            `}>
                              <kbd className="font-sans">Ctrl</kbd><span>+</span><kbd className="font-sans">V</kbd>
                            </span>
                          </div>
                        )}

                        {!isDragActive && (
                          <div className="flex flex-col items-center gap-2 mt-1">
                            <p className="text-[11px] text-slate-500">PDF, Word o imágenes • Máx 3 archivos</p>

                            {/* --- CAMBIO AQUÍ: Etiqueta de advertencia visual --- */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 shadow-sm">
                              <p className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                                <span>⚠️</span> El archivo debe tener fechas/calendario
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                    </label>

                    {ramo.archivos.length > 0 && (
                      <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 relative z-20">
                        {ramo.archivos.map((archivo, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 bg-white rounded-xl p-2.5 shadow-sm border border-slate-100 group/file hover:border-slate-200 transition-all"
                          >
                            <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
                            <span className="text-xs font-medium text-slate-700 flex-1 truncate text-left">{archivo.name}</span>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                eliminarArchivo(ramo.id, i);
                              }}
                              className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                              title="Eliminar archivo"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {ramos.length < 6 && (
            <button
              onClick={agregarRamo}
              className="w-full py-4 border-2 border-dashed border-slate-300 rounded-[20px] text-slate-600 font-bold hover:bg-white hover:text-slate-900 hover:border-slate-400 transition-all mb-8 flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Agregar otro ramo
            </button>
          )}

          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 p-4 md:relative md:bg-transparent md:border-0 md:p-0 md:backdrop-blur-none shadow-lg md:shadow-none">
            <div className="max-w-xl mx-auto">
              <button
                onClick={analizar}
                disabled={analizando}
                className="w-full bg-[#334155] hover:bg-[#1e293b] text-white text-lg font-bold py-4 rounded-[24px] shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Analizar Ramos
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}