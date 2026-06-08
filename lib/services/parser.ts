export interface TimeBlock {
  time: string;
  type: string;
}

export function parseSchedule(horario: string): TimeBlock[] {
  const blocks: TimeBlock[] = [];

  if (!horario || horario.trim() === '' || horario.includes('SIN HORARIO')) {
    return blocks;
  }
  const regex = /([LMWJVSD-]*):([0-9,]+)\s+([A-Z]+)/g;
  let match;

  while ((match = regex.exec(horario)) !== null) {
    const daysStr = match[1];
    const modulesStr = match[2];
    const type = match[3];

    if (!daysStr) continue;
    const days = daysStr.split('-');
    const modules = modulesStr.split(',');

    for (const day of days) {
      if (!day) continue;
      for (const mod of modules) {
        if (!mod) continue;
        blocks.push({
          time: `${day}${mod}`,
          type: type
        });
      }
    }
  }

  return blocks;
}
