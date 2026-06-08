import { parseSchedule, TimeBlock } from './parser';

export interface Section {
  nrc: string;
  sigla: string;
  seccion: string;
  nombre: string;
  profesor: string;
  horario: string;
  escuela?: string;
  semestre?: string;
}

export interface CombinatorConfig {
  allowOverlap: Record<string, boolean>;
}

export function generateCombinations(sections: Section[], config: CombinatorConfig): Section[][] {
  const coursesMap = new Map<string, { section: Section; blocks: TimeBlock[] }[]>();

  for (const sec of sections) {
    const blocks = parseSchedule(sec.horario);
    if (!coursesMap.has(sec.sigla)) {
      coursesMap.set(sec.sigla, []);
    }
    coursesMap.get(sec.sigla)!.push({ section: sec, blocks });
  }

  const courseKeys = Array.from(coursesMap.keys());
  const allCombinations: Section[][] = [];

  function hasCollision(currentScheduleBlocks: TimeBlock[], newBlocks: TimeBlock[]): boolean {
    for (const newBlock of newBlocks) {
      for (const existingBlock of currentScheduleBlocks) {
        if (newBlock.time === existingBlock.time) {
          const isNewBlockTolerated = config.allowOverlap[newBlock.type] === true;
          const isExistingBlockTolerated = config.allowOverlap[existingBlock.type] === true;

          if (!isNewBlockTolerated && !isExistingBlockTolerated) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function backtrack(courseIndex: number, currentCombination: Section[], currentBlocks: TimeBlock[]) {
    if (courseIndex === courseKeys.length) {
      allCombinations.push([...currentCombination]);
      return;
    }

    const currentSigla = courseKeys[courseIndex];
    const availableSections = coursesMap.get(currentSigla)!;

    for (const option of availableSections) {
      if (!hasCollision(currentBlocks, option.blocks)) {
        currentCombination.push(option.section);
        const nextBlocks = [...currentBlocks, ...option.blocks];
        backtrack(courseIndex + 1, currentCombination, nextBlocks);
        currentCombination.pop();
      }
    }
  }

  if (courseKeys.length > 0) {
    backtrack(0, [], []);
  }

  return allCombinations;
}
