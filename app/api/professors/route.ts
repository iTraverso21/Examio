import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sigla = searchParams.get('sigla');

  if (!sigla) {
    return NextResponse.json({ results: [] });
  }

  try {
    const { data, error } = await supabase
      .from('CursosUC')
      .select('profesor')
      .eq('sigla', sigla.toUpperCase());

    if (error) {
      console.error('Error al buscar profesores en Supabase:', error);
      return NextResponse.json({ error: 'Error en la base de datos' }, { status: 500 });
    }

    const uniqueProfessors = new Set<string>();
    
    for (const row of data || []) {
      if (row.profesor && row.profesor.trim() !== '' && row.profesor !== 'Por Fijar' && row.profesor.toUpperCase() !== 'POR FIJAR') {
        uniqueProfessors.add(row.profesor.trim());
      }
    }

    // Sort alphabetically
    const results = Array.from(uniqueProfessors).sort();

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in professors endpoint:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
