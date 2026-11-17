import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deltawash | Fila Virtual y Seguimiento en Vivo",
  description:
    "Sistema de fila virtual y gestión de espera en tiempo real para lavadero de autos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="font-sans min-h-screen flex flex-col"
      >
        {children}
      </body>
    </html>
  );
}
