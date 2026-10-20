import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Heart, Wind, Smile, Meh, Frown, 
  CheckCircle2, Circle, Star, Play, Pause, RotateCcw, 
  BookHeart, Sun, Award
} from 'lucide-react';
import { WEEKLY_CHALLENGES } from '../hooks/useAppState';
import { CalmReflection } from '../types';

export function CalmCornerView({ state }: { state: any }) {
  // Breathing exercise state (4-7-8 technique)
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhala' | 'Sostén' | 'Exhala'>('Inhala');
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  // Journal form state
  const [selectedMood, setSelectedMood] = useState<'radiante' | 'tranquila' | 'pensativa' | 'con dudas' | 'estresada'>('tranquila');
  const [gratitudeInput, setGratitudeInput] = useState('');
  const [achievementInput, setAchievementInput] = useState('');

  const challengesByDay = state.challengesByDay || {};
  const calmJournal: CalmReflection[] = state.calmJournal || [];

  // Breathing timer loop
  useEffect(() => {
    let interval: any = null;

    if (isBreathingActive) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev > 1) return prev - 1;

          // Transition phases
          if (breathPhase === 'Inhala') {
            setBreathPhase('Sostén');
            return 7;
          } else if (breathPhase === 'Sostén') {
            setBreathPhase('Exhala');
            return 8;
          } else {
            // Completed 1 full cycle
            setBreathPhase('Inhala');
            setCyclesCompleted((c) => c + 1);
            state.setPoints((p: number) => p + 2);
            return 4;
          }
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isBreathingActive, breathPhase, state]);

  const handleToggleBreathing = () => {
    if (!isBreathingActive) {
      setBreathPhase('Inhala');
      setSecondsLeft(4);
    }
    setIsBreathingActive(!isBreathingActive);
  };

  const handleResetBreathing = () => {
    setIsBreathingActive(false);
    setBreathPhase('Inhala');
    setSecondsLeft(4);
  };

  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gratitudeInput.trim() && !achievementInput.trim()) return;

    state.addCalmReflection({
      mood: selectedMood,
      gratitude: gratitudeInput.trim() || 'Agradezco por la paz y el descanso de hoy.',
      achievement: achievementInput.trim() || 'Me esforcé y di lo mejor de mí.'
    });

    setGratitudeInput('');
    setAchievementInput('');
  };

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto pb-28 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Rincón de Calma & Actitud Positiva 🕊️
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Pausa anti-estrés con respiración 4-7-8, desafíos de actitud diaria y registro de emociones
          </p>
        </div>

        {/* Puntos de Actitud Badge */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-2xl shadow-md flex items-center gap-3 self-start sm:self-auto">
          <Star size={20} className="text-amber-300 fill-amber-300" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200 block">Puntos de Actitud</span>
            <span className="text-xl font-black leading-tight">{state.points} ⭐</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: RESPIRACIÓN GUIADA 4-7-8 */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white p-6 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden text-center space-y-6">
        <div className="max-w-md mx-auto space-y-2">
          <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-purple-200 inline-block">
            Técnica 4-7-8 Anti-Ansiedad
          </span>
          <h2 className="text-2xl font-black">Pausa de Serenidad</h2>
          <p className="text-purple-200 text-xs">
            Esta respiración calma tu sistema nervioso, relaja los hombros y reduce la fatiga mental escolar.
          </p>
        </div>

        {/* Visualizador Animado del Círculo de Respiración */}
        <div className="py-6 flex flex-col items-center justify-center">
          <div className="relative w-52 h-52 flex items-center justify-center">
            {/* Círculo pulsante exterior */}
            <div 
              className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                isBreathingActive && breathPhase === 'Inhala'
                  ? 'bg-purple-500/30 scale-125'
                  : isBreathingActive && breathPhase === 'Sostén'
                  ? 'bg-amber-400/30 scale-125 animate-pulse'
                  : isBreathingActive && breathPhase === 'Exhala'
                  ? 'bg-teal-500/20 scale-90'
                  : 'bg-white/10 scale-100'
              }`}
            />

            {/* Círculo principal interior */}
            <div 
              className={`w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-1000 shadow-2xl z-10 ${
                breathPhase === 'Inhala'
                  ? 'bg-gradient-to-tr from-pink-500 to-purple-600 scale-110'
                  : breathPhase === 'Sostén'
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-500 scale-110'
                  : 'bg-gradient-to-tr from-teal-500 to-emerald-600 scale-95'
              }`}
            >
              <Wind size={28} className="text-white/80 mb-1" />
              <span className="text-lg font-black tracking-wide uppercase">
                {isBreathingActive ? breathPhase : 'Respira'}
              </span>
              <span className="text-3xl font-black mt-0.5">
                {isBreathingActive ? `${secondsLeft}s` : 'Paz'}
              </span>
            </div>
          </div>

          <p className="text-xs text-purple-200/90 font-medium mt-4">
            {isBreathingActive ? (
              breathPhase === 'Inhala' ? 'Llena tus pulmones lentamente por la nariz (4s)...' :
              breathPhase === 'Sostén' ? 'Conserva la serenidad y siente la calma (7s)...' :
              'Suelta suavemente el aire y las preocupaciones por la boca (8s)...'
            ) : (
              'Presiona Iniciar para guiar tu respiración con música mental tranquila'
            )}
          </p>
        </div>

        {/* Controles de la respiración */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleToggleBreathing}
            className="bg-white text-slate-900 hover:bg-purple-50 font-black text-xs px-6 py-3 rounded-2xl shadow-lg transition flex items-center gap-2"
          >
            {isBreathingActive ? <Pause size={16} /> : <Play size={16} />}
            {isBreathingActive ? 'Pausar' : 'Iniciar Respiración'}
          </button>
          <button
            onClick={handleResetBreathing}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-2xl transition"
            title="Reiniciar"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {cyclesCompleted > 0 && (
          <p className="text-xs text-amber-300 font-bold">
            ✨ Has completado {cyclesCompleted} {cyclesCompleted === 1 ? 'ciclo de calma' : 'ciclos de calma'} (+{cyclesCompleted * 2} Puntos)
          </p>
        )}
      </div>

      {/* SECCIÓN 2: DESAFÍOS DIARIOS DE ACTITUD POSITIVA (PUNTOS) */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Star size={18} className="text-amber-500 fill-amber-500" /> Desafíos de Actitud de la Semana
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Completa cada día una actitud positiva para ganar Puntos de carácter y autoestima
            </p>
          </div>
          <span className="text-xs font-black bg-purple-100 text-purple-800 px-3 py-1 rounded-full self-start sm:self-auto">
            {Object.values(challengesByDay).filter(Boolean).length} de 7 cumplidos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {daysOfWeek.map((day) => {
            const ch = WEEKLY_CHALLENGES[day];
            if (!ch) return null;
            const isCompleted = !!challengesByDay[day];

            return (
              <div
                key={day}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  isCompleted
                    ? 'bg-purple-50/50 border-purple-200 text-slate-700 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                      {ch.day}
                    </span>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      +{ch.points} Puntos
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 mt-1">{ch.title}</h4>
                  <p className="text-xs text-slate-500 leading-snug">{ch.description}</p>
                </div>

                <button
                  onClick={() => state.toggleChallengeDay(day)}
                  className={`shrink-0 transition-colors mt-1 ${
                    isCompleted ? 'text-purple-600' : 'text-slate-300 hover:text-purple-600'
                  }`}
                  title={isCompleted ? 'Desmarcar desafío' : 'Marcar desafío como cumplido'}
                >
                  {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 3: TERMÓMETRO DE EMOCIONES & DIARIO DE CALMA */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <BookHeart size={18} className="text-pink-600" /> Termómetro Emocional y Autoestima
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Expresa cómo te sientes y recuerda los motivos para sentirte orgullosa de quién eres
          </p>
        </div>

        {/* Selector de estado emocional */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">¿Cómo te sientes en este momento?</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { id: 'radiante', label: 'Radiante', icon: '🌟', color: 'bg-amber-50 text-amber-900 border-amber-300' },
              { id: 'tranquila', label: 'Tranquila', icon: '🧘', color: 'bg-emerald-50 text-emerald-900 border-emerald-300' },
              { id: 'pensativa', label: 'Pensativa', icon: '🤔', color: 'bg-blue-50 text-blue-900 border-blue-300' },
              { id: 'con dudas', label: 'Con Dudas', icon: '🥺', color: 'bg-purple-50 text-purple-900 border-purple-300' },
              { id: 'estresada', label: 'Estresada', icon: '🌧️', color: 'bg-rose-50 text-rose-900 border-rose-300' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMood(m.id as any)}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                  selectedMood === m.id
                    ? `${m.color} ring-2 ring-purple-400 font-black shadow-sm`
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-xl">{m.icon}</span>
                <span className="text-xs font-bold">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Formulario de reflexión */}
        <form onSubmit={handleSaveReflection} className="space-y-3 pt-2 text-xs font-medium">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              1. Algo lindo que agradezco el día de hoy:
            </label>
            <input
              type="text"
              placeholder="Ej. El abrazo de mamá, el sol por la ventana, entender un tema nuevo..."
              value={gratitudeInput}
              onChange={(e) => setGratitudeInput(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              2. Un logro o esfuerzo del que me siento orgullosa:
            </label>
            <input
              type="text"
              placeholder="Ej. Hice mis estiramientos aunque tenía flojera, fui paciente con mi tarea..."
              value={achievementInput}
              onChange={(e) => setAchievementInput(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition"
            >
              Guardar en mi Diario (+10 Puntos ⭐)
            </button>
          </div>
        </form>

        {/* Historial de reflexiones */}
        {calmJournal.length > 0 && (
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Tus Reflexiones Anteriores
            </h4>
            {calmJournal.map((entry) => (
              <div
                key={entry.id}
                className="p-3.5 rounded-2xl bg-purple-50/40 border border-purple-100 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-purple-700">
                  <span>📅 {entry.date} • Estado: {entry.mood}</span>
                  <span>✨ Autoestima</span>
                </div>
                {entry.gratitude && (
                  <p className="text-slate-700"><strong className="text-purple-900">Gratitud:</strong> {entry.gratitude}</p>
                )}
                {entry.achievement && (
                  <p className="text-slate-700"><strong className="text-purple-900">Logro:</strong> {entry.achievement}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
