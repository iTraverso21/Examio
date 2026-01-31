"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'Ocurrió un error inesperado';

  const getErrorInfo = () => {
    if (message.includes('límite') || message.includes('Límite')) {
      return {
        emoji: '⏱️',
        title: 'Límite alcanzado',
        description: 'Has usado el servicio muchas veces en poco tiempo.',
        action: 'Reintentar en 1 minuto'
      };
    }
    return {
      emoji: '😕',
      title: 'Algo salió mal',
      description: message,
      action: 'Volver a intentar'
    };
  };

  const info = getErrorInfo();

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        
        <div className="text-6xl mb-6">
          {info.emoji}
        </div>

        <h1 className="text-2xl font-bold text-[#0F172A] mb-2 tracking-tight">
          {info.title}
        </h1>

        <p className="text-[#64748B] mb-8 leading-relaxed font-medium">
          {info.description}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/scan')}
            className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold py-4 rounded-xl shadow-lg transition-all"
          >
            {info.action}
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full text-[#64748B] hover:text-[#0F172A] font-medium py-3 text-sm transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F1F5F9]" />}>
      <ErrorContent />
    </Suspense>
  );
}