import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
        className={`${inter.className} min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
