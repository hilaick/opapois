import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, CheckCircle2, Circle, Plus, Search, 
  MapPin, AlertTriangle, Sparkles, Trash2, Edit3, X, Check,
  Palette, Trophy, Heart, Users
} from 'lucide-react';
import { Activity, ActivityType } from '../types';
import { isEventPassed, getRelativeDateString } from '../hooks/useAppState';

export function ActivitiesView({ state }: { state: any }) {
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pendientes' | 'Pasados' | 'Completados'>('Todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<ActivityType>('Creativos & Paseos');
  const [formDate, setFormDate] = useState(getRelativeDateString(0));
  const [formTime, setFormTime] = useState('16:00');
  const [formLocation, setFormLocation] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formCompleted, setFormCompleted] = useState(false);

  const activities: Activity[] = state.activities || [];

  // Summary counts
  const totalCount = activities.length;
  const completedCount = activities.filter(a => a.completed).length;
  const pendingCount = activities.filter(a => !a.completed).length;
  const pastUncompletedCount = activities.filter(a => isEventPassed(a) && !a.completed).length;

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = act.title.toLowerCase().includes(query);
        const matchesLoc = (act.location || '').toLowerCase().includes(query);
        const matchesNotes = (act.notes || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesLoc && !matchesNotes) return false;
      }

      // Category filter
      if (categoryFilter !== 'Todas' && act.type !== categoryFilter) {
        return false;
      }

      // Status filter
      const passed = isEventPassed(act);
      if (statusFilter === 'Pendientes') {
        return !act.completed;
      }
      if (statusFilter === 'Pasados') {
        return passed && !act.completed;
      }
      if (statusFilter === 'Completados') {
        return act.completed;
      }

      return true;
    }).sort((a, b) => {
      // Sort: uncompleted past first, then date ascending, then completed
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.date.localeCompare(b.date);
    });
  }, [activities, searchQuery, categoryFilter, statusFilter]);

  const openNewModal = () => {
    setEditingActivity(null);
    setFormTitle('');
    setFormType('Creativos & Paseos');
    setFormDate(getRelativeDateString(0));
    setFormTime('16:00');
    setFormLocation('');
    setFormNotes('');
    setFormCompleted(false);
    setIsModalOpen(true);
  };

  const openEditModal = (act: Activity) => {
    setEditingActivity(act);
    setFormTitle(act.title);
    setFormType(act.type);
    setFormDate(act.date);
    setFormTime(act.time || '12:00');
    setFormLocation(act.location || '');
    setFormNotes(act.notes || '');
    setFormCompleted(act.completed);
    setIsModalOpen(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingActivity) {
      state.updateActivity({
        ...editingActivity,
        title: formTitle.trim(),
        type: formType,
        date: formDate,
        time: formTime,
        location: formLocation.trim() || undefined,
        notes: formNotes.trim() || undefined,
        completed: formCompleted,
        completedAt: formCompleted 
          ? (editingActivity.completedAt || `Hoy ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`) 
          : undefined
      });
    } else {
      state.addActivity({
        title: formTitle.trim(),
        type: formType,
        date: formDate,
        time: formTime,
        location: formLocation.trim() || undefined,
        notes: formNotes.trim() || undefined,
        completed: formCompleted,
        completedAt: formCompleted 
          ? `Hoy ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
          : undefined
      });
      if (formCompleted) {
        state.setTokens((t: number) => t + 2);
      }
    }
    setIsModalOpen(false);
  };

  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case 'Creativos & Paseos': return <Palette size={16} className="text-pink-600" />;
      case 'Competiciones': return <Trophy size={16} className="text-amber-600" />;
      case 'Salud & Clases': return <Heart size={16} className="text-teal-600" />;
      default: return <Users size={16} className="text-indigo-600" />;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto pb-28 md:pb-12">
      {/* Encabezado y Acción Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Actividades y Paseos 🎨
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Agenda tus talleres creativos, citas médicas, salidas y eventos escolares
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm px-4 py-2.5 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Nueva Actividad
        </button>
      </div>

      {/* Resumen de Estados / Chips de Conteo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('Todos')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            statusFilter === 'Todos' 
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-xs font-bold block uppercase opacity-75">Todas</span>
          <span className="text-2xl font-black">{totalCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter('Pendientes')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            statusFilter === 'Pendientes' 
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
              : 'bg-white text-blue-700 border-slate-200 hover:border-blue-200'
          }`}
        >
          <span className="text-xs font-bold block uppercase opacity-75">Pendientes</span>
          <span className="text-2xl font-black">{pendingCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter('Pasados')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative ${
            statusFilter === 'Pasados' 
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm' 
              : 'bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-300'
          }`}
        >
          {pastUncompletedCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          )}
          <span className="text-xs font-bold block uppercase opacity-75">Pasadas sin marcar</span>
          <span className="text-2xl font-black">{pastUncompletedCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter('Completados')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            statusFilter === 'Completados' 
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
              : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <span className="text-xs font-bold block uppercase opacity-75">Completadas</span>
          <span className="text-2xl font-black">{completedCount}</span>
        </button>
      </div>

      {/* Banner Especial de Acciones para Eventos Pasados */}
      {pastUncompletedCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 border border-amber-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-amber-200 text-amber-800 p-2.5 rounded-2xl shrink-0 mt-0.5">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="font-bold text-amber-950 text-sm">
                Tienes {pastUncompletedCount} {pastUncompletedCount === 1 ? 'actividad que ya pasó' : 'actividades que ya pasaron'}
              </h3>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Aquellas actividades o eventos que ya pasaron se pueden agregar y marcar como completadas para mantener tu registro al día y ganar fichas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={state.markAllPastActivitiesAsCompleted}
              className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={16} /> Marcar todas como completadas (+{pastUncompletedCount * 2} Fichas)
            </button>
          </div>
        </div>
      )}

      {/* Buscador y Filtros por Categoría */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título, lugar o notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 font-medium"
          />
        </div>

        {/* Chips de tipo / categoría */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
          {['Todas', 'Creativos & Paseos', 'Competiciones', 'Salud & Clases', 'Familia'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Actividades */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Calendar size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-slate-700 text-base">No se encontraron actividades</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Prueba cambiando los filtros o añade una nueva actividad haciendo clic en el botón superior.
            </p>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const passed = isEventPassed(act);

            return (
              <div
                key={act.id}
                className={`p-5 rounded-3xl border transition-all ${
                  act.completed
                    ? 'bg-emerald-50/40 border-emerald-200/80 shadow-sm opacity-90'
                    : passed
                    ? 'bg-amber-50/50 border-amber-300 shadow-md ring-1 ring-amber-200'
                    : 'bg-white border-slate-200/90 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {/* Botón rápido de completado circular */}
                    <button
                      onClick={() => state.toggleActivityCompleted(act.id)}
                      className={`mt-1 shrink-0 transition-colors ${
                        act.completed 
                          ? 'text-emerald-500 hover:text-emerald-700' 
                          : passed
                          ? 'text-amber-500 hover:text-emerald-500'
                          : 'text-slate-300 hover:text-emerald-500'
                      }`}
                      title={act.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                    >
                      {act.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Tipo de actividad */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                          {getTypeIcon(act.type)}
                          {act.type}
                        </span>

                        {/* Badges de Estado */}
                        {act.completed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                            <Check size={12} /> Completada
                          </span>
                        ) : passed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-extrabold border border-amber-300 animate-pulse">
                            <Clock size={12} /> ⏱️ Pasada • Por confirmar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                            <Calendar size={12} /> Próxima
                          </span>
                        )}
                      </div>

                      {/* Título */}
                      <h3 className={`text-base font-bold ${
                        act.completed ? 'text-slate-600 line-through' : 'text-slate-900'
                      }`}>
                        {act.title}
                      </h3>

                      {/* Info de fecha, hora y lugar */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-slate-400" /> {act.date}
                        </span>
                        {act.time && (
                          <span className="flex items-center gap-1">
                            <Clock size={13} className="text-slate-400" /> {act.time}
                          </span>
                        )}
                        {act.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-slate-400" /> {act.location}
                          </span>
                        )}
                      </div>

                      {/* Notas opcionales */}
                      {act.notes && (
                        <p className="text-xs text-slate-600 bg-white/60 p-2 rounded-xl border border-slate-100 mt-2">
                          💡 {act.notes}
                        </p>
                      )}

                      {/* Marca de tiempo si fue completada */}
                      {act.completed && act.completedAt && (
                        <p className="text-[11px] text-emerald-600 font-medium mt-1">
                          Realizada: {act.completedAt} ✨
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones de la tarjeta */}
                  <div className="flex items-center gap-2 self-end sm:self-start shrink-0 pt-2 sm:pt-0">
                    {/* Botón de acción rápida para eventos pasados o pendientes */}
                    {!act.completed ? (
                      <button
                        onClick={() => state.toggleActivityCompleted(act.id)}
                        className={`text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${
                          passed
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <CheckCircle2 size={15} /> {passed ? 'Confirmar como completada' : 'Marcar hecha'}
                      </button>
                    ) : (
                      <button
                        onClick={() => state.toggleActivityCompleted(act.id)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                        title="Reabrir actividad"
                      >
                        Desmarcar
                      </button>
                    )}

                    <button
                      onClick={() => openEditModal(act)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                      title="Editar actividad"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      onClick={() => state.deleteActivity(act.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Eliminar actividad"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Añadir / Editar Actividad */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {editingActivity ? 'Editar Actividad o Paseo' : 'Nueva Actividad o Evento'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-4 text-xs font-medium">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Título de la actividad *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Taller de acuarela, Cita médica, Salida al parque..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-400 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoría</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-700"
                  >
                    <option value="Creativos & Paseos">Creativos & Paseos</option>
                    <option value="Competiciones">Competiciones</option>
                    <option value="Salud & Clases">Salud & Clases</option>
                    <option value="Social">Social</option>
                    <option value="Familia">Familia</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hora</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Fecha (YYYY-MM-DD)</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-700"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Puedes seleccionar una fecha pasada si estás registrando una actividad ya ocurrida.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lugar o Ubicación</label>
                <input
                  type="text"
                  placeholder="Ej. Centro Cultural, Clínica, Escuela..."
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notas o Recordatorios</label>
                <textarea
                  rows={2}
                  placeholder="Llevar materiales, ropa cómoda con soporte, etc."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
                />
              </div>

              {/* Casilla clave solicitada por el usuario: Marcar como completada */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 block text-xs">
                    ¿Esta actividad ya se realizó?
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Marca esta opción para guardarla directamente como completada (+2 Fichas)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formCompleted}
                  onChange={(e) => setFormCompleted(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded-lg focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition"
                >
                  {editingActivity ? 'Guardar Cambios' : 'Añadir Actividad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
