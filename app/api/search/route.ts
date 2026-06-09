import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const query = q.trim();

    // Buscamos coincidencias SOLO en sigla
    const { data, error } = await supabase
      .from('CursosUC')
      .select('sigla, nombre')
      .ilike('sigla', `%${query}%`)
      .limit(50);

    if (error) {
      console.error('Error al buscar en Supabase:', error);
      return NextResponse.json({ error: 'Error en la base de datos' }, { status: 500 });
    }

    // Filtrar para retornar solo siglas únicas, máximo 5 resultados
    const uniqueCourses: { sigla: string; nombre: string }[] = [];
    const seenSiglas = new Set<string>();

    for (const course of data || []) {
      if (!seenSiglas.has(course.sigla)) {
        seenSiglas.add(course.sigla);
        uniqueCourses.push(course);
        if (uniqueCourses.length === 5) break;
      }
    }

    return NextResponse.json({ results: uniqueCourses });
  } catch (error) {
    console.error('Error in search endpoint:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
