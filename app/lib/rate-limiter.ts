// app/lib/rate-limiter.ts

// Usamos variables globales para mantener la cuenta en memoria
// NOTA: Esto funciona perfecto en tu PC local. En servidores serverless (Vercel)
// se reinicia a veces, pero para tu uso estudiantil es suficiente protección.

type LimiterState = {
  minuteCount: number;
  minuteReset: number;
  dayCount: number;
  dayReset: number;
};

// Singleton para guardar el estado
let globalState: LimiterState = {
  minuteCount: 0,
  minuteReset: Date.now() + 60000, // Expira en 1 minuto
  dayCount: 0,
  dayReset: Date.now() + 86400000, // Expira en 24 horas
};

export function checkRateLimit(): { allowed: boolean; error?: string } {
  const now = Date.now();

  // 1. Revisar reinicio de minuto
  if (now > globalState.minuteReset) {
    globalState.minuteCount = 0;
    globalState.minuteReset = now + 60000;
  }

  // 2. Revisar reinicio de día
  if (now > globalState.dayReset) {
    globalState.dayCount = 0;
    globalState.dayReset = now + 86400000;
  }

  // 3. Verificaciones de Límite (Tus reglas)
  const LIMIT_RPM = 15;     // 15 por minuto
  const LIMIT_RPD = 1500;   // 1500 por día

  if (globalState.dayCount >= LIMIT_RPD) {
    return { allowed: false, error: "Has superado el límite diario de 1500 peticiones (Vuelve mañana)." };
  }

  if (globalState.minuteCount >= LIMIT_RPM) {
    return { allowed: false, error: "Límite de velocidad: Espera unos segundos (Máx 15/min)." };
  }

  // 4. Si pasa, incrementamos
  globalState.minuteCount++;
  globalState.dayCount++;

  console.log(`📊 Uso API: Minuto ${globalState.minuteCount}/${LIMIT_RPM} | Día ${globalState.dayCount}/${LIMIT_RPD}`);
  
  return { allowed: true };
}