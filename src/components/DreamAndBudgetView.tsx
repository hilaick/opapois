import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Gift, Film, IceCream, Palette, BookOpen, 
  Plus, Check, Target, PiggyBank, DollarSign, Image as ImageIcon,
  CheckCircle2, Circle, Trash2, Edit3, X, CheckCircle, ExternalLink
} from 'lucide-react';
import { RewardItem, DreamItem } from '../types';

const PRESET_DREAM_IMAGES = [
  { label: '🎨 Arte & Dibujo', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=80' },
  { label: '📚 Estudio & Libros', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80' },
  { label: '✈️ Viajes & Aventuras', url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80' },
  { label: '🏃‍♀️ Salud & Deporte', url: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=600&q=80' },
  { label: '🎹 Música & Piano', url: 'https://images.unsplash.com/photo-1520523839898-50712825e3a7?auto=format&fit=crop&w=600&q=80' },
  { label: '🐱 Mascotas & Naturaleza', url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80' }
];

export function DreamAndBudgetView({ state }: { state: any }) {
  const [showAddDream, setShowAddDream] = useState(false);
  const [editingDream, setEditingDream] = useState<DreamItem | null>(null);
  const [celebrationToast, setCelebrationToast] = useState<{ title: string; tokensGained: number } | null>(null);

  const [dreamTitle, setDreamTitle] = useState('');
  const [dreamCategory, setDreamCategory] = useState<'Metas' | 'Viajes' | 'Inspiración' | 'Habilidades'>('Metas');
  const [dreamImg, setDreamImg] = useState('');
  const [dreamDesc, setDreamDesc] = useState('');
  const [dreamFilter, setDreamFilter] = useState<'todos' | 'pendientes' | 'cumplidos'>('todos');

  // Form states for editing
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<'Metas' | 'Viajes' | 'Inspiración' | 'Habilidades'>('Metas');
  const [editImg, setEditImg] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCompleted, setEditCompleted] = useState(false);

  // Presupuesto local
  const [savingsGoal, setSavingsGoal] = useState(() => {
    return Number(localStorage.getItem('mop_savings_goal')) || 1000;
  });
  const [currentSavings, setCurrentSavings] = useState(() => {
    return Number(localStorage.getItem('mop_current_savings')) || 650;
  });
  const [addAmount, setAddAmount] = useState('');

  const rewards: RewardItem[] = state.rewards || [];
  const dreams: DreamItem[] = state.dreams || [];

  const filteredDreams = useMemo(() => {
    if (dreamFilter === 'pendientes') return dreams.filter(d => !Boolean(d.completed));
    if (dreamFilter === 'cumplidos') return dreams.filter(d => Boolean(d.completed));
    return dreams;
  }, [dreams, dreamFilter]);

  const handleAddSavings = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(addAmount);
    if (!val || val <= 0) return;
    const next = currentSavings + val;
    setCurrentSavings(next);
    localStorage.setItem('mop_current_savings', next.toString());
    setAddAmount('');
  };

  const handleCreateDream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dreamTitle.trim()) return;
    const newDreamData = {
      title: dreamTitle.trim(),
      category: dreamCategory,
      imageUrl: dreamImg.trim() || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
      description: dreamDesc.trim(),
      completed: false
    };
    if (state.addDream) {
      state.addDream(newDreamData);
    } else {
      state.setDreams([{ id: 'd-' + Date.now(), ...newDreamData }, ...dreams]);
    }
    setDreamTitle('');
    setDreamImg('');
    setDreamDesc('');
    setShowAddDream(false);
  };

  const handleStartEdit = (dream: DreamItem) => {
    setEditingDream(dream);
    setEditTitle(dream.title || '');
    setEditCategory((dream.category as any) || 'Metas');
    setEditImg(dream.imageUrl || '');
    setEditDesc(dream.description || '');
    setEditCompleted(Boolean(dream.completed));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDream || !editTitle.trim()) return;

    const updates = {
      title: editTitle.trim(),
      category: editCategory,
      imageUrl: editImg.trim() || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
      description: editDesc.trim(),
      completed: editCompleted
    };

    if (state.updateDream) {
      state.updateDream(editingDream.id, updates);
    } else {
      state.setDreams(dreams.map(d => String(d.id) === String(editingDream.id) ? { ...d, ...updates } : d));
    }

    setEditingDream(null);
  };

  const handleToggleCard = (dream: DreamItem) => {
    const isNowCompleted = !Boolean(dream.completed);

    if (state.toggleDream) {
      state.toggleDream(dream.id);
    } else {
      const next = dreams.map(d => (String(d.id) === String(dream.id) || d.id === dream.id) ? { ...d, completed: isNowCompleted } : d);
      state.setDreams(next);
    }

    if (isNowCompleted) {
      setCelebrationToast({
        title: dream.title,
        tokensGained: 5
      });
      setTimeout(() => {
        setCelebrationToast(null);
      }, 4000);
    }
  };

  const getRewardIcon = (iconName: string) => {
    switch (iconName) {
      case 'Film': return <Film size={22} className="text-purple-600" />;
      case 'IceCream': return <IceCream size={22} className="text-pink-600" />;
      case 'Palette': return <Palette size={22} className="text-amber-600" />;
      case 'BookOpen': return <BookOpen size={22} className="text-blue-600" />;
      default: return <Sparkles size={22} className="text-rose-600" />;
    }
  };

  const savingsPercentage = Math.min(Math.round((currentSavings / (savingsGoal || 1)) * 100), 100);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto pb-28 md:pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Mi Espacio: Recompensas, Sueños y Ahorro ✨
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-0.5">
          Canjea las fichas que ganaste completando actividades y tareas por momentos especiales
        </p>
      </div>

      {/* SECCIÓN 1: TIENDA DE RECOMPENSAS POR FICHAS */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-pink-600 text-white p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              Centro de Recompensas
            </span>
            <h2 className="text-2xl md:text-3xl font-black mt-1">
              Tienda de Premios
            </h2>
            <p className="text-amber-100 text-sm mt-0.5">
              Cada tarea y actividad completada te da fichas. ¡Disfruta el fruto de tu constancia!
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center self-start sm:self-auto">
            <span className="text-xs font-bold uppercase text-amber-100">Fichas Disponibles</span>
            <p className="text-3xl font-black">{state.tokens} 🪙</p>
          </div>
        </div>

        {/* Grid de Recompensas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {rewards.map((rew) => {
            const canAfford = state.tokens >= rew.tokenCost;

            return (
              <div
                key={rew.id}
                className="bg-white text-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between border border-pink-100"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 bg-pink-50 rounded-xl">
                      {getRewardIcon(rew.icon)}
                    </span>
                    <span className="text-xs font-black bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full">
                      {rew.tokenCost} Fichas
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                    {rew.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {rew.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Canjeado: {rew.claimedCount} {rew.claimedCount === 1 ? 'vez' : 'veces'}
                  </span>
                  <button
                    onClick={() => {
                      const success = state.claimReward(rew.id);
                      if (!success) {
                        alert('¡Necesitas más fichas! Completa más actividades o tareas.');
                      }
                    }}
                    disabled={!canAfford}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                      canAfford
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'Canjear' : 'Faltan fichas'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 2: ALCANCÍA Y META DE AHORRO */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
              <PiggyBank size={26} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Alcancía y Presupuesto</h3>
              <p className="text-xs text-slate-500 font-medium">Aprende a administrar tu mesada y ahorrar para tus proyectos</p>
            </div>
          </div>

          <form onSubmit={handleAddSavings} className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Monto $"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              className="w-28 text-sm border border-slate-200 rounded-xl px-3 py-2 font-medium"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition"
            >
              + Ahorrar
            </button>
          </form>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-600">Ahorrado: ${currentSavings}</span>
            <span className="text-emerald-700">Meta: ${savingsGoal} ({savingsPercentage}%)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${savingsPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: TABLERO DE SUEÑOS (VISION BOARD) */}
      <div className="space-y-4">
        {/* Notificación de Celebración al Cumplir Meta */}
        {celebrationToast && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-white/20 rounded-xl text-xl">🎉</span>
              <div>
                <h4 className="font-black text-sm">¡Meta Cumplida con Éxito!</h4>
                <p className="text-xs text-emerald-100 font-medium">
                  Completaste &ldquo;{celebrationToast.title}&rdquo;. ¡Ganaste +{celebrationToast.tokensGained} Fichas 🪙 y +10 Puntos ⭐!
                </p>
              </div>
            </div>
            <button
              onClick={() => setCelebrationToast(null)}
              className="text-white/80 hover:text-white p-1 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Target size={20} className="text-pink-600" /> Tablero de Sueños & Aspiraciones
            </h2>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              Imágenes y metas que inspiran tus días. ¡Completa los detalles de tus tarjetas y márcalas cuando las alcances para ganar fichas y puntos!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddDream(true)}
              className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} /> Añadir Sueño
            </button>
          </div>
        </div>

        {/* Resumen y Filtro de Estados */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Filtro:</span>
            {(['todos', 'pendientes', 'cumplidos'] as const).map((f) => {
              const active = dreamFilter === f;
              const count = f === 'todos' 
                ? dreams.length 
                : f === 'pendientes' 
                ? dreams.filter(d => !Boolean(d.completed)).length 
                : dreams.filter(d => Boolean(d.completed)).length;

              return (
                <button
                  key={f}
                  onClick={() => setDreamFilter(f)}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    active 
                      ? 'bg-pink-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f === 'todos' ? 'Todos' : f === 'pendientes' ? 'Por cumplir' : '¡Cumplidos! 🎉'} ({count})
                </button>
              );
            })}
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            Cumplir un sueño otorga +5 Fichas 🪙 y +10 Puntos ⭐
          </span>
        </div>

        {/* Modal / Formulario para Añadir Nuevo Sueño */}
        {showAddDream && (
          <form onSubmit={handleCreateDream} className="bg-white p-5 md:p-6 rounded-3xl border border-pink-200 shadow-xl space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-pink-600" /> Nueva Tarjeta de Sueño o Meta
              </h4>
              <button 
                type="button" 
                onClick={() => setShowAddDream(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">Título de tu sueño o meta *</label>
              <input
                type="text"
                required
                placeholder="Ej. Escribir e ilustrar mi propio libro de cuentos..."
                value={dreamTitle}
                onChange={(e) => setDreamTitle(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-pink-300 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Categoría</label>
                <select
                  value={dreamCategory}
                  onChange={(e) => setDreamCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="Metas">Metas Personales</option>
                  <option value="Viajes">Viajes & Aventuras</option>
                  <option value="Habilidades">Habilidades & Salud</option>
                  <option value="Inspiración">Inspiración & Creatividad</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">URL de Imagen</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={dreamImg}
                  onChange={(e) => setDreamImg(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            {/* Sugerencias Rápidas de Fotos de Inspiración */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                O elige una imagen sugerida:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_DREAM_IMAGES.map((img) => (
                  <button
                    key={img.label}
                    type="button"
                    onClick={() => setDreamImg(img.url)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition font-medium ${
                      dreamImg === img.url
                        ? 'bg-pink-100 border-pink-300 text-pink-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {img.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">Descripción y detalles del sueño</label>
              <textarea
                rows={2}
                placeholder="¿Por qué es especial para ti y qué pasos necesitas para lograrlo?"
                value={dreamDesc}
                onChange={(e) => setDreamDesc(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-pink-300 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddDream(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-pink-200 transition"
              >
                Fijar en el Tablero
              </button>
            </div>
          </form>
        )}

        {/* Modal / Formulario para EDITAR o COMPLETAR Datos de una Tarjeta */}
        {editingDream && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
            <form onSubmit={handleSaveEdit} className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-pink-100 text-pink-700 rounded-xl">
                    <Edit3 size={16} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-base">Completar / Editar Tarjeta</h4>
                    <p className="text-[11px] text-slate-500">Actualiza los detalles, imagen o estado de tu sueño</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setEditingDream(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-700 text-xs block mb-1">Título del sueño *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 font-semibold focus:ring-2 focus:ring-pink-300 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoría</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="Metas">Metas Personales</option>
                    <option value="Viajes">Viajes & Aventuras</option>
                    <option value="Habilidades">Habilidades & Salud</option>
                    <option value="Inspiración">Inspiración & Creatividad</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">URL de Imagen</label>
                  <input
                    type="url"
                    value={editImg}
                    onChange={(e) => setEditImg(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              {/* Sugerencias Rápidas de Fotos */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  Cambiar imagen por una sugerida:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_DREAM_IMAGES.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() => setEditImg(img.url)}
                      className={`text-[10px] px-2 py-1 rounded-lg border transition font-medium ${
                        editImg === img.url
                          ? 'bg-pink-100 border-pink-300 text-pink-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 text-xs block mb-1">Descripción y notas</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Detalla tu meta, tus progresos o cómo te sentirás al cumplirla..."
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-pink-300 focus:outline-none"
                />
              </div>

              {/* Toggle de Estado Cumplido en la Edición */}
              <div 
                onClick={() => setEditCompleted(!editCompleted)}
                className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition ${
                  editCompleted 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {editCompleted ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : (
                    <Circle size={18} className="text-slate-400" />
                  )}
                  <div>
                    <span className="text-xs font-black block">
                      {editCompleted ? '¡Meta Marcada como Cumplida! 🎉' : 'Meta en Progreso (Pendiente)'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {editCompleted ? 'Aparece con distintivo verde de éxito' : 'Márcala cuando alcances tu objetivo'}
                    </span>
                  </div>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  editCompleted ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {editCompleted ? 'Cumplido' : 'Pendiente'}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDream(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md shadow-pink-200 transition flex items-center gap-1.5"
                >
                  <Check size={14} /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Grid de Tarjetas de Sueños */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDreams.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400">
              <p className="text-sm font-semibold">No hay tarjetas de sueños en este filtro.</p>
              <p className="text-xs mt-1">Añade una nueva meta para llenar tu tablero de inspiración.</p>
            </div>
          ) : (
            filteredDreams.map((dream) => {
              const isCompleted = Boolean(dream.completed);

              return (
                <div
                  key={dream.id}
                  className={`bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between border ${
                    isCompleted 
                      ? 'border-emerald-300 ring-2 ring-emerald-200/60 bg-emerald-50/20' 
                      : 'border-slate-200/90'
                  }`}
                >
                  <div>
                    <div className="h-44 w-full relative overflow-hidden bg-slate-100 group">
                      <img
                        src={dream.imageUrl}
                        alt={dream.title}
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                          isCompleted ? 'filter saturate-125' : ''
                        }`}
                      />
                      
                      {/* Badge Categoría */}
                      <span className="absolute top-3 left-3 bg-slate-900/70 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold">
                        {dream.category}
                      </span>

                      {/* Botón rápido de completado en la esquina superior derecha de la imagen */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCard(dream);
                        }}
                        className={`absolute top-3 right-3 shadow-md backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 animate-in zoom-in'
                            : 'bg-white/80 text-slate-700 hover:bg-white hover:text-emerald-700'
                        }`}
                        title={isCompleted ? 'Hacer clic para reabrir' : 'Hacer clic para completar'}
                      >
                        {isCompleted ? (
                          <>
                            <Sparkles size={11} /> ¡Cumplido!
                          </>
                        ) : (
                          <>
                            <Circle size={11} className="text-pink-500" /> Marcar
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`font-extrabold text-sm leading-snug ${
                          isCompleted ? 'text-emerald-900' : 'text-slate-900'
                        }`}>
                          {dream.title}
                        </h4>
                        
                        {/* Acciones de Tarjeta: Editar y Eliminar */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEdit(dream)}
                            className="text-slate-400 hover:text-pink-600 p-1.5 rounded-lg hover:bg-pink-50 transition"
                            title="Completar o editar tarjeta"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar esta tarjeta de sueños?')) {
                                if (state.deleteDream) {
                                  state.deleteDream(dream.id);
                                } else {
                                  state.setDreams(dreams.filter(d => String(d.id) !== String(dream.id) && d.id !== dream.id));
                                }
                              }
                            }}
                            className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition"
                            title="Eliminar sueño"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {dream.description && (
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          {dream.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* BOTÓN PRINCIPAL DE COMPLETAR TARJETA */}
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => handleToggleCard(dream)}
                      className={`w-full py-2.5 px-3 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] ${
                        isCompleted
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'
                          : 'bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 size={16} /> ¡Meta Cumplida! (Click para reabrir)
                        </>
                      ) : (
                        <>
                          <Circle size={16} className="text-pink-400" /> Marcar como cumplido (+5 Fichas)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
