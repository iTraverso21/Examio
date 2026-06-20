import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Lexend } from 'next/font/google';

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
  variable: "--font-lexend",
});

export default function LegalPage() {
  return (
    <main className={`min-h-screen bg-[#f6f7f7] text-[#334155] ${lexend.className} p-6 md:p-12 lg:p-20`}>
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#334155] transition-colors mb-8 font-bold text-sm">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>
        
        <h1 className="text-3xl font-black mb-8 text-[#0f172a]">Legal y Privacidad</h1>
        
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-[#0f172a]">Términos y Condiciones de Uso</h2>
          <p className="mb-4 text-slate-600 leading-relaxed text-sm">
            Bienvenido a Examio. Al utilizar nuestra plataforma, aceptas los siguientes términos:
          </p>
          <ul className="list-disc pl-5 mb-4 text-slate-600 leading-relaxed text-sm space-y-2">
            <li><strong>Propósito de la herramienta:</strong> Examio ofrece dos funciones principales para estudiantes: (1) El escaneo de programas académicos (PDFs, imágenes o Word) mediante Inteligencia Artificial para generar automáticamente un archivo de calendario (.ics) que puedes importar a Google Calendar, Apple Calendar o Outlook; y (2) Un simulador interactivo para visualizar y explorar combinaciones de horarios de clases. Su uso es meramente orientativo y de apoyo estudiantil.</li>
            <li><strong>Exención de responsabilidad:</strong> Aunque nos esforzamos por ofrecer una lectura de archivos precisa, la extracción de datos por IA puede fallar o interpretar mal ciertos textos. Examio no garantiza que el calendario generado (.ics) o las combinaciones del armador de horarios estén 100% libres de errores. El usuario es el <strong>único responsable</strong> de revisar minuciosamente y verificar que los ramos, fechas, horas y secciones coincidan con la información oficial de su universidad antes de la inscripción oficial. Examio no se hace responsable por topes de horario, inscripciones erróneas, inasistencias, ramos reprobados ni ningún otro perjuicio académico derivado de importar los archivos de calendario generados por esta plataforma.</li>
            <li><strong>Uso aceptable:</strong> El servicio se proporciona "tal cual" y es gratuito para fines académicos.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-[#0f172a]">Política de Privacidad</h2>
          <p className="mb-4 text-slate-600 leading-relaxed text-sm">
            En Examio valoramos tu privacidad y nos comprometemos a protegerla de la siguiente manera:
          </p>
          <ul className="list-disc pl-5 mb-4 text-slate-600 leading-relaxed text-sm space-y-2">
            <li><strong>Procesamiento de Archivos e Inteligencia Artificial:</strong> Utilizamos servicios de Inteligencia Artificial proporcionados por terceros para analizar y extraer el texto de los documentos (PDFs o capturas) que subes en la función de escáner.</li>
            <li><strong>Almacenamiento y Protección:</strong> Los archivos que subes se procesan de forma temporal con el único propósito de extraer la información de tus ramos. <strong>No almacenamos tus archivos de forma permanente, no los compartimos públicamente ni con otros usuarios, y no los utilizamos para entrenar modelos de Inteligencia Artificial.</strong></li>
            <li><strong>Privacidad de uso:</strong> Como no requerimos creación de cuentas ni inicio de sesión, el uso de la herramienta es anónimo y no recopilamos información personal identificable.</li>
          </ul>
        </section>

        <p className="mt-12 text-xs text-slate-400 font-medium">
          Última actualización: Junio de 2026.
        </p>
      </div>
    </main>
  );
}
