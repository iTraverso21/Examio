import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkRateLimit } from "../../lib/rate-limiter";

export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const limitStatus = checkRateLimit();
    if (!limitStatus.allowed) {
      return NextResponse.json({ error: limitStatus.error }, { status: 429 });
    }

    const formData = await request.formData();
    // Usamos Flash-Lite (o el que tengas disponible)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const nombreRamo = formData.get('nombreRamo') as string || "Ramo";
    const archivos: File[] = [];
    
    let i = 0;
    while (formData.has(`file_${i}`)) {
      const file = formData.get(`file_${i}`) as File;
      if (file) archivos.push(file);
      i++;
    }

    if (archivos.length === 0) {
      return NextResponse.json({ eventos: [] });
    }

    const eventos = await analizarRamoCompleto(model, archivos, nombreRamo);

    return NextResponse.json({ eventos });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

async function analizarRamoCompleto(model: any, files: File[], nombreRamo: string) {
  try {
    const partesDeArchivos = await Promise.all(files.map(async (file) => {
      const buffer = await file.arrayBuffer();
      return {
        inlineData: {
          data: Buffer.from(buffer).toString("base64"),
          mimeType: file.type,
        }
      };
    }));

    // CALCULAMOS EL AÑO ACTUAL PARA FORZARLO
    const currentYear = new Date().getFullYear();

    const prompt = `
      Analiza estos ${files.length} documentos del ramo: "${nombreRamo}".
      Extrae el calendario de evaluaciones.
      
      REGLAS CRÍTICAS DE FECHA:
      1. Estamos en el año ${currentYear}. 
      2. Si el documento dice un año anterior (ej: 2023, 2024, 2025), IGNORESE. Asume que la fecha es de este año ${currentYear}.
      3. Si solo dice "12 de Octubre", asume ${currentYear}-10-12.
      4. Formato de salida: YYYY-MM-DD.

      REGLAS DE EXTRACCIÓN:
      1. Busca: Pruebas, Exámenes, Controles, Entregas.
      2. Salida: SOLO JSON Array.

      Ejemplo: [{ "titulo": "[${nombreRamo}] Examen", "fecha": "${currentYear}-12-15", "descripcion": "..." }]
    `;

    const result = await model.generateContent([
      prompt,
      ...partesDeArchivos
    ]);

    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    let eventos = [];
    try {
      eventos = JSON.parse(text);
    } catch (e) {
      return [];
    }

    const eventosCorregidos = eventos.map((evento: any) => {
      let titulo = evento.titulo || "Evaluación";
      
      if (!titulo.startsWith(`[${nombreRamo}]`)) {
        titulo = `[${nombreRamo}] ${titulo}`;
      }

      return {
        ...evento,
        titulo: titulo 
      };
    });

    return eventosCorregidos;

  } catch (error) {
    console.error(error);
    return [];
  }
}