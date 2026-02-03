import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Examio",
  description: "Sube tus programas y obtén tu calendario automático",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Forzar modo claro siempre
                document.documentElement.classList.remove('dark');
                document.documentElement.style.colorScheme = 'light';
                localStorage.setItem('theme', 'light');
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[#F8FAFC] text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}