import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function generarHashArchivo(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return crypto.createHash("md5").update(buffer).digest("hex");
}

export async function POST(request: Request) {
  try {
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

    const hashesIndividuales = await Promise.all(archivos.map(generarHashArchivo));
    // Ordenamos los hashes para que el orden de subida no importe (Archivo A + Archivo B sea igual a B + A)
    const hashCombinado = hashesIndividuales.sort().join("-");
    // Creamos la llave para Redis. Incluimos el modelo para invalidar caché si cambias de versión de IA.
    const cacheKey = `cache:examio:gemini-2.5:${hashCombinado}`;
    // 2. Preguntamos a Redis si ya tiene esta respuesta
    const respuestaEnCache = await redis.get(cacheKey);

    if (respuestaEnCache) {
      console.log("⚡ HIT CACHÉ: Respondiendo desde Redis (Gratis)");

      const eventosCacheados = typeof respuestaEnCache === "string"
        ? JSON.parse(respuestaEnCache)
        : respuestaEnCache;

      const eventosFinales = (Array.isArray(eventosCacheados) ? eventosCacheados : []).map((e: any) => ({
        ...e,
        // Limpiamos por si la caché antigua tenía guardado el nombre del ramo anterior
        titulo: `[${nombreRamo}] ${e.titulo ? e.titulo.replace(/^\[.*?\]\s*/, '') : 'Evaluación'}`
      }));

      return NextResponse.json({ eventos: eventosFinales });
    }
    console.log("🤖 MISS CACHÉ: Llamando a Gemini...");

    const eventosRaw = await analizarRamoCompleto(model, archivos, nombreRamo);
    if (eventosRaw.length > 0) {
      // Guardamos por 180 días la info limpia, SIN el nombre del ramo
      await redis.set(cacheKey, JSON.stringify(eventosRaw), { ex: 60 * 60 * 24 * 180 });
    }

    // Agregamos el nombre del ramo antes de enviar al usuario actual
    const eventos = eventosRaw.map((e: any) => ({
      ...e,
      titulo: `[${nombreRamo}] ${e.titulo}`
    }));

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
      Tu objetivo es extraer el Calendario de Evaluaciones completo.

      REGLAS CRÍTICAS DE FECHA:
      1. Estamos en el año ${currentYear}. Asume este año para todo.
      2. Si el documento tiene fechas antiguas (2023, 2024...), IGNORE EL AÑO VIEJO y usa ${currentYear}.
      3. Si solo dice "12 de Octubre", asume ${currentYear}-10-12.
      4. Formato de salida: YYYY-MM-DD.
      5. Si no hay fecha asociada a un evento, o dice 'Pendiente'/'Por definir', en el campo fecha devuelve exactamente el string 'TBD'.

      REGLAS DE EXTRACCIÓN (MUY IMPORTANTE):
      1. QUÉ BUSCAR: Detecta Pruebas, Exámenes, Controles, Interrogaciones, Entregas de Proyecto, Tareas, Informes, Presentaciones y Laboratorios.
      2. ATOMICIDAD (CRUCIAL): Nunca agrupes eventos. 
         - MAL: "Interrogación 1 y 2" en una sola fecha.
         - BIEN: Crea un evento para "Interrogación 1" y otro evento separado para "Interrogación 2".
         - Si una tabla dice "Interrogaciones: 15 Abril, 20 Mayo", genera DOS objetos JSON distintos.
      3. TÍTULOS ESPECÍFICOS: No uses títulos genéricos.
         - MAL: "Entrega".
         - BIEN: "Entrega Proyecto 1" o "Informe Laboratorio 3".

      Salida: ÚNICAMENTE un Array JSON válido (sin markdown, sin texto extra).
      
      Ejemplo de formato esperado: 
      [
        { "titulo": "[${nombreRamo}] Interrogación 1", "fecha": "${currentYear}-04-15", "descripcion": "Sala 203" },
        { "titulo": "[${nombreRamo}] Entrega Proyecto Final", "fecha": "${currentYear}-06-20", "descripcion": "Subir a Canvas" }
      ]
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

    const eventosLimpios = eventos.map((evento: any) => {
      let titulo = evento.titulo || "Evaluación";

      // Limpiamos cualquier prefijo de tipo [Ramo] por si el modelo lo agrega
      titulo = titulo.replace(/^\[.*?\]\s*/, '');

      return {
        ...evento,
        titulo
      };
    });

    return eventosLimpios;

  } catch (error) {
    console.error(error);
    return [];
  }
}