import React, { useState } from 'react';
import { 
  Heart, Droplet, Sparkles, BookOpen, CheckCircle2, 
  Circle, ShieldCheck, Sun, Info, Plus, RotateCcw
} from 'lucide-react';
import { BibleVerse } from '../types';

export function WellnessView({ state }: { state: any }) {
  const [gratitudeText, setGratitudeText] = useState('');
  const [savedGratitudes, setSavedGratitudes] = useState<string[]>(() => {
    const saved = localStorage.getItem('mop_gratitudes');
    return saved ? JSON.parse(saved) : [
      'Agradezco a Dios por mi familia y por las fuerzas para aprender cada día.',
      'Doy gracias por poder caminar y cuidar de mis pies con paciencia y constancia.'
    ];
  });

  const bibleVerses: BibleVerse[] = state.bibleVerses || [];

  const handleAddGratitude = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gratitudeText.trim()) return;
    const next = [gratitudeText.trim(), ...savedGratitudes];
    setSavedGratitudes(next);
    localStorage.setItem('mop_gratitudes', JSON.stringify(next));
    setGratitudeText('');
    state.setTokens((t: number) => t + 1);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto pb-28 md:pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Bienestar & Salud Integral 🌿
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-0.5">
          Cuidado físico de tus pies, hidratación y paz espiritual con la Sagrada Escritura
        </p>
      </div>

      {/* SECCIÓN ESPECIAL: Protocolo de Salud y Cuidado de Pies (Fascitis Plantar) */}
      <div className="bg-gradient-to-br from-teal-500 via-emerald-600 to-teal-700 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={16} /> Protocolo Diario de Salud
            </span>
            <span className="text-xs text-teal-100 font-medium">Hábito Activo de {state.userProfile.name}</span>
          </div>

          <div>
            <h2 className="text-2xl font-black">
              Cuidado y Recuperación de Pies
            </h2>
            <p className="text-teal-100 text-sm mt-1 max-w-xl">
              La constancia en los estiramientos y el uso del calzado adecuado son la clave para aliviar la fascitis y mantenerte activa sin dolor.
            </p>
          </div>

          {/* Rutina de 3 pasos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <p className="text-xs font-black uppercase tracking-wider text-teal-200">Paso 1: Calzado</p>
              <h4 className="font-bold text-sm mt-1">Tenis con Soporte de Arco</h4>
              <p className="text-xs text-teal-100 mt-1">
                Cero chancletas planas ni Crocs sin amortiguación. El arco debe estar siempre protegido.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <p className="text-xs font-black uppercase tracking-wider text-teal-200">Paso 2: Frío Terapéutico</p>
              <h4 className="font-bold text-sm mt-1">Rodar Botella Fría con Hielo</h4>
              <p className="text-xs text-teal-100 mt-1">
                10 a 15 minutos rodando la botella con presión suave para desinflamar la fascia plantar.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <p className="text-xs font-black uppercase tracking-wider text-teal-200">Paso 3: Estiramiento</p>
              <h4 className="font-bold text-sm mt-1">Gemelos y Dedos con Toalla</h4>
              <p className="text-xs text-teal-100 mt-1">
                3 series de 30 segundos cada mañana antes de poner los pies sobre el piso frío.
              </p>
            </div>
          </div>

          {/* Checkboxes de cumplimiento diario */}
          <div className="pt-3 border-t border-white/20 flex flex-wrap items-center gap-3">
            <button
              onClick={() => state.toggleHealthCheck('supportShoesWorn')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                state.healthLog.supportShoesWorn
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {state.healthLog.supportShoesWorn ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              Tenis con soporte usados
            </button>

            <button
              onClick={() => state.toggleHealthCheck('iceBottleDone')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                state.healthLog.iceBottleDone
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {state.healthLog.iceBottleDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              Botella fría realizada
            </button>

            <button
              onClick={() => state.toggleHealthCheck('stretchedFeet')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                state.healthLog.stretchedFeet
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {state.healthLog.stretchedFeet ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              Estiramientos completados
            </button>
          </div>
        </div>
      </div>

      {/* Rastreador de Hidratación */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-100 text-sky-600 rounded-2xl">
              <Droplet size={26} className="fill-sky-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Registro de Hidratación</h3>
              <p className="text-xs text-slate-500 font-medium">Meta: 8 vasos de agua al día para mantener tu cuerpo hidratado</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={state.drinkWater}
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Plus size={16} /> Registrar Vaso (+1 Ficha)
            </button>
            <button
              onClick={state.resetWater}
              className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              title="Reiniciar contador"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Visualizador de vasos */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 pt-2">
          {Array.from({ length: 8 }).map((_, idx) => {
            const isFilled = idx < state.healthLog.waterGlasses;
            return (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                  isFilled
                    ? 'bg-sky-50 border-sky-300 text-sky-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-300'
                }`}
              >
                <Droplet size={24} className={isFilled ? 'fill-sky-500' : ''} />
                <span className="text-[11px] font-bold mt-1 text-slate-600">Vaso {idx + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* AFIRMACIONES Y VERSÍCULOS DE LA BIBLIA CATÓLICA */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen size={20} className="text-purple-600" /> Versículos y Afirmaciones de Fe
          </h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Citas de la Sagrada Escritura (Biblia Católica) para llenar tu corazón de fortaleza y confianza
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bibleVerses.map((v, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-purple-50/60 to-indigo-50/40 border border-purple-100 p-5 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <span className="inline-block bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2">
                  {v.theme}
                </span>
                <p className="text-sm font-semibold text-slate-800 italic leading-relaxed">
                  "{v.text}"
                </p>
              </div>
              <p className="text-xs font-bold text-purple-700 text-right mt-3">
                — {v.reference}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mi Oración y Gratitud del Día */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-amber-500" />
          <h3 className="text-base font-black text-slate-900">
            Cuaderno de Agradecimiento e Intenciones
          </h3>
        </div>

        <form onSubmit={handleAddGratitude} className="flex gap-2">
          <input
            type="text"
            placeholder="¿Qué bendición o alegría agradeces a Dios hoy?"
            value={gratitudeText}
            onChange={(e) => setGratitudeText(e.target.value)}
            className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            Agradecer (+1 Ficha)
          </button>
        </form>

        <div className="space-y-2 pt-1">
          {savedGratitudes.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-purple-50/40 border border-purple-100 rounded-2xl text-xs text-slate-700 flex items-center gap-2"
            >
              <span className="text-purple-500">✨</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
