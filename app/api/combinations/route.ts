import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { generateCombinations, CombinatorConfig, Section } from '../../../lib/services/combinator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courses, allowOverlap } = body;

    if (!courses || !Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json({ error: 'Debes proporcionar un arreglo de cursos' }, { status: 400 });
    }

    const siglasLimpias = courses.map((c: { sigla: string }) => c.sigla.toUpperCase().trim());

    const { data: sections, error } = await supabase
      .from('CursosUC')
      .select('*')
      .in('sigla', siglasLimpias);

    if (error) {
      console.error('Error al consultar Supabase:', error);
      return NextResponse.json({ error: 'Error al consultar la base de datos' }, { status: 500 });
    }

    if (!sections || sections.length === 0) {
      return NextResponse.json({
        error: `Supabase no devolvió ningún ramo para las siglas: ${siglasLimpias.join(', ')}`
      }, { status: 404 });
    }

    // Filtrar por profesor si se especificó
    const filteredSections = sections.filter((sec: any) => {
      const courseReq = courses.find((c: any) => c.sigla === sec.sigla);
      if (!courseReq || !courseReq.profesor) return true;
      return sec.profesor && sec.profesor.trim() === courseReq.profesor;
    });

    if (filteredSections.length === 0) {
      return NextResponse.json({
        error: `No se encontraron secciones válidas para esos profesores.`
      }, { status: 404 });
    }

    const config: CombinatorConfig = {
      allowOverlap: allowOverlap || {
        "AYU": false,
        "CLAS": false,
        "LAB": false,
      }
    };

    const combinations = generateCombinations(filteredSections as Section[], config);

    return NextResponse.json({
      totalCombinations: combinations.length,
      combinations
    });

  } catch (error) {
    console.error('Error en el endpoint de combinador:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
