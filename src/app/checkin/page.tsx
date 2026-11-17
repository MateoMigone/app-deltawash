"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Phone, ArrowRight, QrCode } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { crearTurnoCheckin } from "@/services/lavaderoService";

export default function CheckinPage() {
  const router = useRouter();
  const [patente, setPatente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handlePatenteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convierte a mayúsculas automáticamente y solo permite letras y números
    const valorNormalizado = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8);
    setPatente(valorNormalizado);
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (patente.trim().length < 6) {
      setError("Ingresá una patente válida (mínimo 6 caracteres).");
      return;
    }

    try {
      setEnviando(true);
      setError("");
      const nuevoTurnoId = await crearTurnoCheckin(patente, telefono);
      router.push(`/tracker/${nuevoTurnoId}`);
    } catch (err) {
      console.error("Error al registrar turno:", err);
      setError(
        "No pudimos registrar tu auto en este momento. Intentá nuevamente."
      );
      setEnviando(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between px-6 py-8 max-w-md mx-auto w-full">
      {/* Encabezado minimalista */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight text-white">
            DELTAWASH
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
          <QrCode className="w-3.5 h-3.5" />
          Check-in Rápido
        </span>
      </header>

      {/* Formulario ultra minimalista */}
      <section className="my-auto py-6 space-y-6">
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ingresá tu vehículo
          </h1>
          <p className="text-sm text-slate-400">
            Anotá tu patente y acercá la llave al mostrador.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Input Gigante para Patente */}
          <div className="space-y-2">
            <label
              htmlFor="patente-input"
              className="block text-xs font-bold uppercase tracking-widest text-slate-400 text-center"
            >
              Patente del vehículo
            </label>
            <Input
              id="patente-input"
              variant="giantPlate"
              placeholder="AB123CD"
              value={patente}
              onChange={handlePatenteChange}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              autoFocus
              required
              error={error}
            />
          </div>

          {/* Input Opcional para WhatsApp */}
          <Input
            id="telefono-input"
            type="tel"
            label="WhatsApp (Opcional)"
            placeholder="Ej: 11 2345 6789"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
            helperText="Para avisarte cuando tu auto esté listo."
          />

          {/* Botón de envío */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="xl"
              fullWidth
              isLoading={enviando}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Dejar mi auto
            </Button>
          </div>
        </form>
      </section>

      {/* Pie con recordatorio de llave */}
      <footer className="text-center text-xs text-slate-500 pt-4">
        Al confirmar, verás en vivo el estado de tu lavado desde tu celular.
      </footer>
    </main>
  );
}
