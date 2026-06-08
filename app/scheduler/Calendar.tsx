"use client";

import React from "react";
import { parseSchedule } from "@/lib/services/parser";
import { Section } from "@/lib/services/combinator";

const DAYS = ["L", "M", "W", "J", "V", "S"];
const MODULES = [
  { mod: "1", time: "08:20" },
  { mod: "2", time: "09:40" },
  { mod: "3", time: "11:00" },
  { mod: "4", time: "12:20" },
  { mod: "ALMUERZO", time: "13:30" },
  { mod: "5", time: "14:50" },
  { mod: "6", time: "16:10" },
  { mod: "7", time: "17:30" },
  { mod: "8", time: "18:50" },
  { mod: "9", time: "20:10" },
];

const COLORS: Record<string, string> = {
  CLAS: "bg-orange-100 text-orange-800 border-orange-200", // Cátedra
  AYU: "bg-green-100 text-green-800 border-green-200",   // Ayudantía
  LAB: "bg-blue-100 text-blue-800 border-blue-200",      // Laboratorio
  TAL: "bg-purple-100 text-purple-800 border-purple-200",// Taller
  PRA: "bg-yellow-100 text-yellow-800 border-yellow-200",// Práctica
  TES: "bg-cyan-100 text-cyan-800 border-cyan-200",      // Tesis
  TER: "bg-pink-100 text-pink-800 border-pink-200",      // Terreno
};

function getColor(type: string) {
  return COLORS[type] || "bg-red-100 text-red-800 border-red-200"; // Otro
}

export default function Calendar({ sections }: { sections: Section[] }) {
  // Construir matriz del calendario: map[day][mod] = { section, type }
  const grid: Record<string, Record<string, { section: Section; type: string }>> = {};

  DAYS.forEach(d => {
    grid[d] = {};
  });

  sections.forEach((sec) => {
    const blocks = parseSchedule(sec.horario);
    blocks.forEach((b) => {
      // b.time es "L3", "W5", etc.
      const day = b.time.charAt(0);
      const mod = b.time.substring(1);
      if (grid[day]) {
        grid[day][mod] = { section: sec, type: b.type };
      }
    });
  });

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Grilla principal */}
      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[700px] border-collapse text-sm text-center">
          <thead>
            <tr>
              <th className="w-20 border-b border-r border-slate-200 bg-slate-50 py-3 font-bold text-slate-500">
                Hora
              </th>
              {DAYS.map((day) => (
                <th key={day} className="border-b border-r border-slate-200 bg-slate-50 py-3 font-bold text-[#334155] w-[15%]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((m) => {
              if (m.mod === "ALMUERZO") {
                return (
                  <tr key="almuerzo" className="bg-slate-100/50">
                    <td className="border-b border-r border-slate-200 py-2 text-xs font-medium text-slate-400">
                      {m.time}
                    </td>
                    <td colSpan={6} className="border-b border-slate-200 py-2 font-black tracking-[0.5em] text-slate-300 text-center">
                      A L M U E R Z O
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={m.mod}>
                  <td className="border-b border-r border-slate-200 py-3 text-xs font-medium text-slate-500 bg-slate-50/50">
                    {m.time}
                  </td>
                  {DAYS.map((day) => {
                    const blockInfo = grid[day][m.mod];
                    if (!blockInfo) {
                      return <td key={`${day}-${m.mod}`} className="border-b border-r border-slate-200 p-1"></td>;
                    }

                    const colorClass = getColor(blockInfo.type);
                    return (
                      <td key={`${day}-${m.mod}`} className="border-b border-r border-slate-200 p-1">
                        <div className={`w-full h-full min-h-[44px] flex items-center justify-center rounded-lg border flex-col px-1 py-1 ${colorClass} shadow-sm transition-all hover:scale-[1.02] cursor-default`} title={blockInfo.section.nombre}>
                          <span className="font-bold text-[10px] md:text-xs tracking-tight leading-tight">
                            {blockInfo.section.nrc}-{blockInfo.section.sigla}-{blockInfo.section.seccion}
                          </span>
                          <span className="text-[8px] md:text-[9px] truncate w-full px-0.5 opacity-80 mt-0.5 font-medium leading-tight">
                            {blockInfo.section.nombre}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${COLORS.CLAS}`}></div><span className="text-sm font-medium text-slate-600">Cátedra</span></div>
        <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${COLORS.AYU}`}></div><span className="text-sm font-medium text-slate-600">Ayudantía</span></div>
        <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${COLORS.LAB}`}></div><span className="text-sm font-medium text-slate-600">Laboratorio</span></div>
        <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${COLORS.TAL}`}></div><span className="text-sm font-medium text-slate-600">Taller</span></div>
        <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${COLORS.PRA}`}></div><span className="text-sm font-medium text-slate-600">Práctica</span></div>
        <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${COLORS.TES}`}></div><span className="text-sm font-medium text-slate-600">Tesis</span></div>
        <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${COLORS.TER}`}></div><span className="text-sm font-medium text-slate-600">Terreno</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div><span className="text-sm font-medium text-slate-600">Otro</span></div>
      </div>
      
      {/* Mis Cursos */}
      <div className="bg-slate-200/50 rounded-xl p-4 border border-slate-300">
        <h3 className="font-bold text-[#334155] mb-3 text-lg">Mis Cursos en este horario</h3>
        <div className="flex flex-col gap-2">
          {sections.map((sec) => (
            <div key={sec.nrc} className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-xs font-bold bg-[#334155] text-white px-2 py-1 rounded-md">
                {sec.nrc}
              </span>
              <span className="text-sm font-bold text-[#334155]">
                {sec.sigla}-{sec.seccion}
              </span>
              <span className="text-sm font-medium text-slate-600 truncate">
                {sec.nombre}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
