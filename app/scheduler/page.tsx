"use client";

import { useState, useEffect } from "react";
import { Lexend } from "next/font/google";
import { Search, X, ChevronLeft, ChevronRight, Settings2, Calendar as CalendarIcon, Loader2, ArrowLeft } from "lucide-react";
import Calendar from "./Calendar";
import { Section } from "@/lib/services/combinator";
import Link from "next/link";

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
  variable: "--font-lexend",
});

export default function ArmadorPage() {
  const [siglaInput, setSiglaInput] = useState("");
  const [siglas, setSiglas] = useState<{sigla: string, nombre: string, profesor?: string}[]>([]);
  const [editingProf, setEditingProf] = useState<string | null>(null);
  const [professorsForCourse, setProfessorsForCourse] = useState<string[]>([]);
  const [loadingProfs, setLoadingProfs] = useState(false);

  const [allowOverlap, setAllowOverlap] = useState<Record<string, boolean>>({
    AYU: false,
    LAB: false,
    TAL: false,
    PRA: false,
    CLAS: false
  });

  const [combinations, setCombinations] = useState<Section[][]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Estados del Autocompletado
  const [suggestions, setSuggestions] = useState<{ sigla: string, nombre: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Efecto Debounce para buscar en la base de datos
  useEffect(() => {
    const handler = setTimeout(() => {
      if (siglaInput.trim().length >= 2) {
        fetchSuggestions(siglaInput);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [siglaInput]);

  const fetchSuggestions = async (q: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data.results || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (course: {sigla: string, nombre: string}) => {
    if (!siglas.some(s => s.sigla === course.sigla)) {
      setSiglas([...siglas, course]);
    }
    setSiglaInput("");
    setShowSuggestions(false);
  };

  const handleAddSigla = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSigla = siglaInput.toUpperCase().trim();
    if (!cleanSigla) return;

    if (siglas.some(s => s.sigla === cleanSigla)) {
      setSiglaInput("");
      setShowSuggestions(false);
      return;
    }

    let match = suggestions.find(s => s.sigla === cleanSigla);

    if (!match) {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(cleanSigla)}`);
        const data = await res.json();
        match = data.results?.find((r: {sigla: string, nombre: string}) => r.sigla === cleanSigla);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSearching(false);
      }
    }

    if (match) {
      setSiglas([...siglas, { sigla: match.sigla, nombre: match.nombre }]);
      setSiglaInput("");
      setShowSuggestions(false);
    } else {
      alert(`El ramo "${cleanSigla}" no existe en los registros. Por favor, selecciona uno válido de la lista desplegable.`);
    }
  };

  const handleRemoveSigla = (siglaToRemove: string) => {
    setSiglas(siglas.filter(sig => sig.sigla !== siglaToRemove));
    if (editingProf === siglaToRemove) setEditingProf(null);
  };

  const handleOpenProfSelect = async (sigla: string) => {
    setEditingProf(sigla);
    setLoadingProfs(true);
    try {
      const res = await fetch(`/api/professors?sigla=${sigla}`);
      const data = await res.json();
      setProfessorsForCourse(data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProfs(false);
    }
  };

  const handleSelectProf = (sigla: string, prof: string) => {
    setSiglas(siglas.map(s => s.sigla === sigla ? { ...s, profesor: prof === "Cualquiera" ? undefined : prof } : s));
    setEditingProf(null);
  };

  const toggleOverlap = (type: string) => {
    setAllowOverlap(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const generateCombinations = async () => {
    if (siglas.length === 0) return;
    setLoading(true);
    setHasSearched(true);
    setApiError(null);
    try {
      const res = await fetch("/api/combinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courses: siglas, allowOverlap })
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setApiError(data.error || "Error al conectar con la base de datos.");
        setCombinations([]);
        return;
      }

      if (data.combinations && data.combinations.length === 0 && data.message) {
        setApiError(data.message); // Por si el backend nos manda un warning de que no encontró el ramo
      }

      setCombinations(data.combinations || []);
      setCurrentIndex(0);
    } catch (error) {
      console.error(error);
      setApiError("Error de red al intentar conectar con la API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`min-h-screen w-full bg-[#f6f7f7] text-[#334155] ${lexend.className}`}>

      {/* Header sencillo */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#334155] flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">Armador de Horarios</h1>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-8 items-start">

        {/* PANEL IZQUIERDO: CONTROLES */}
        <div className="w-full lg:w-[350px] flex-shrink-0 flex flex-col gap-6 lg:sticky lg:top-[88px]">

          {/* Tarjeta de Búsqueda */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h2 className="font-bold text-lg mb-4">¿Qué ramos quieres tomar?</h2>

            <form onSubmit={handleAddSigla} className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={siglaInput}
                onChange={(e) => setSiglaInput(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="Ej: MAT1610"
                className="block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#334155] focus:border-[#334155] sm:text-sm font-bold uppercase transition-all"
              />

              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                  <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                </div>
              )}

              {/* Menú Flotante de Sugerencias */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  <ul className="flex flex-col py-1">
                    {suggestions.map((course) => (
                      <li
                        key={course.sigla}
                        onMouseDown={() => handleSelectSuggestion(course)}
                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex flex-col gap-0.5 border-b border-slate-100 last:border-0"
                      >
                        <span className="font-bold text-sm text-[#334155]">{course.sigla}</span>
                        <span className="text-xs text-slate-500 truncate">{course.nombre}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </form>

            <div className="flex flex-col gap-2">
              {siglas.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4 border-2 border-dashed border-slate-200 rounded-xl">
                  Aún no has agregado ramos.
                </p>
              )}
              {siglas.map(course => (
                <div key={course.sigla} className="flex flex-col bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 group relative">
                  <div className="flex items-center justify-between">
                    <span className="font-bold tracking-wide">{course.sigla}</span>
                    <button onClick={() => handleRemoveSigla(course.sigla)} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {course.nombre && (
                    <span className="text-xs text-slate-500 truncate mt-0.5 pr-6">{course.nombre}</span>
                  )}
                  {editingProf === course.sigla ? (
                    loadingProfs ? (
                      <span className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Cargando profesores...</span>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <select 
                          className="text-xs border border-slate-300 rounded p-1.5 w-full bg-white focus:outline-none focus:ring-1 focus:ring-[#334155] cursor-pointer"
                          value={course.profesor || "Cualquiera"}
                          onChange={(e) => handleSelectProf(course.sigla, e.target.value)}
                          onBlur={() => setEditingProf(null)}
                          autoFocus
                        >
                          <option value="Cualquiera">Profesor: Cualquiera</option>
                          {professorsForCourse.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                    )
                  ) : (
                    <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <span className="text-[11px] text-slate-500 truncate mr-2">
                        Profesor: <span className="font-medium text-[#334155]">{course.profesor || "Cualquiera"}</span>
                      </span>
                      <button 
                        onClick={() => handleOpenProfSelect(course.sigla)} 
                        className="text-[10px] font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded-md transition-all shadow-sm shrink-0 active:scale-95"
                      >
                        Cambiar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tarjeta de Tolerancias */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-5 h-5 text-[#334155]" />
              <h2 className="font-bold text-lg">Reglas de Choque</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Marca las casillas si <b>permites</b> que esos tipos de clase choquen con otras clases en tu horario.
            </p>

            <div className="flex flex-col gap-3">
              {[
                { type: "AYU", label: "Permitir choques de Ayudantía" },
                { type: "LAB", label: "Permitir choques de Laboratorio" },
                { type: "TAL", label: "Permitir choques de Taller" },
                { type: "CLAS", label: "Permitir choques de Cátedra (¡Peligro!)" },
              ].map(item => (
                <label key={item.type} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={allowOverlap[item.type] || false}
                    onChange={() => toggleOverlap(item.type)}
                  />
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${allowOverlap[item.type]
                      ? "bg-[#334155] border-[#334155]"
                      : "bg-white border-slate-300 group-hover:border-[#334155]"
                    }`}>
                    {allowOverlap[item.type] && <CheckCircleIcon />}
                  </div>
                  <span className="text-sm font-medium text-slate-700 select-none">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={generateCombinations}
            disabled={siglas.length === 0 || loading}
            className="w-full bg-[#334155] hover:bg-[#1e293b] disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CalendarIcon className="w-5 h-5" />}
            {loading ? "Calculando..." : "Generar Horarios"}
          </button>

        </div>

        {/* PANEL DERECHO: RESULTADOS */}
        <div className="flex-1 w-full flex flex-col gap-6">

          {!hasSearched ? (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
              <CalendarIcon className="w-16 h-16 mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2 text-[#334155]">Ningún horario generado</h3>
              <p className="max-w-md text-center text-sm">
                Agrega ramos en el panel izquierdo y haz clic en "Generar Horarios" para ver todas las combinaciones mágicas.
              </p>
            </div>
          ) : loading ? (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center text-[#334155] border-2 border-slate-100 rounded-3xl bg-white shadow-sm">
              <Loader2 className="w-12 h-12 mb-4 animate-spin text-[#334155]" />
              <h3 className="text-xl font-bold mb-2">Calculando el universo de posibilidades...</h3>
              <p className="text-sm text-slate-500">Cruzando secciones y validando choques temporales.</p>
            </div>
          ) : apiError ? (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center text-orange-600 border-2 border-orange-200 rounded-3xl bg-orange-50 p-6 text-center">
              <X className="w-16 h-16 mb-4" />
              <h3 className="text-xl font-bold mb-2">Error de Conexión / Datos</h3>
              <p className="max-w-md text-sm text-orange-500 font-medium">
                {apiError}
              </p>
              <p className="max-w-md text-xs text-orange-400 mt-4">
                Si la base de datos está conectada pero no devuelve nada, revisa que la tabla se llame "cursos" y que tenga desactivado el RLS (Row Level Security) en Supabase.
              </p>
            </div>
          ) : combinations.length === 0 ? (
            <div className="w-full h-[60vh] flex flex-col items-center justify-center text-red-500 border-2 border-red-100 rounded-3xl bg-red-50">
              <X className="w-16 h-16 mb-4" />
              <h3 className="text-xl font-bold mb-2">No hay combinaciones posibles</h3>
              <p className="max-w-md text-center text-sm text-red-400">
                Tus ramos tienen un choque de horario inevitable. Intenta permitir el choque de ayudantías o quita algún ramo.
              </p>
            </div>
          ) : (
            <>
              {/* Controles del Carrusel */}
              <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-lg text-sm">
                    {combinations.length} combinaciones
                  </div>
                  <h3 className="font-bold text-lg">Opción {currentIndex + 1}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentIndex(prev => Math.min(combinations.length - 1, prev + 1))}
                    disabled={currentIndex === combinations.length - 1}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* El Calendario! */}
              <Calendar sections={combinations[currentIndex]} />
            </>
          )}

        </div>
      </div>
    </main>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
