import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, Heart, Plus, Sparkles, Clock, AlertCircle, 
  Droplet, Flame, ArrowRight, Calendar, BookOpen, Trash2, Star, Cloud, CloudCheck, LogIn, User, Edit3
} from 'lucide-react';
import { isEventPassed, WEEKLY_CHALLENGES, getRelativeDateString, isMatchingDate } from '../hooks/useAppState';

export function TodayDashboard({ 
  state, 
  onEditProfile,
  onOpenAuthModal,
  onOpenLogoutModal
}: { 
  state: any; 
  onEditProfile?: () => void;
  onOpenAuthModal?: () => void;
  onOpenLogoutModal?: () => void;
}) {
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<'Escuela' | 'Hogar' | 'Salud' | 'Personal'>('Escuela');
  const [taskPriority, setTaskPriority] = useState<'Alta' | 'Media' | 'Baja'>('Media');

  const pendingTasks = state.tasks.filter((t: any) => !t.completed);
  const completedTasks = state.tasks.filter((t: any) => t.completed);

  // Today's activities
  const todayStr = getRelativeDateString(0);
  const todayActivities = state.activities.filter((a: any) => isMatchingDate(a.date, todayStr));

  // Today's day name in Spanish
  const todayDayName = (() => {
    const d = new Date();
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[d.getDay()];
  })();

  const todayChallenge = WEEKLY_CHALLENGES[todayDayName] || WEEKLY_CHALLENGES['Lunes'];
  const isTodayChallengeDone = !!state.challengesByDay[todayDayName];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    state.addTask({
      title: taskTitle.trim(),
      category: taskCategory,
      priority: taskPriority,
      dueDate: todayStr
    });
    setTaskTitle('');
    setShowNewTaskModal(false);
  };

  const currentVerse = state.bibleVerses[0];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto pb-24 md:pb-12">
      {/* Saludo y Resumen con Fichas, Puntos y Racha */}
      <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-semibold tracking-wide backdrop-blur-sm">
                {state.userProfile.schoolGrade || '2do de Secundaria'}
              </span>
              {state.userProfile.studentCode && (
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide backdrop-blur-sm">
                  Cód: {state.userProfile.studentCode}
                </span>
              )}
              {state.userProfile.schoolGroup && (
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide backdrop-blur-sm">
                  Grupo: {state.userProfile.schoolGroup}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-pink-100 font-medium">
                <Flame size={14} className="text-amber-300 fill-amber-300" /> Racha de {state.streakDays} días
              </span>
              {/* Botón directo de Editar Perfil */}
              {onEditProfile && (
                <button
                  type="button"
                  onClick={onEditProfile}
                  className="bg-white/20 hover:bg-white/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1 transition shadow-sm backdrop-blur-sm"
                  title="Editar tu perfil, nombre, año escolar y metas"
                >
                  <Edit3 size={11} /> Editar Perfil
                </button>
              )}
              {/* Cloud Sync Status */}
              {state.currentUser ? (
                <button
                  type="button"
                  onClick={onOpenLogoutModal}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition hover:opacity-90 ${
                    state.syncStatus === 'quota-exceeded'
                      ? 'bg-amber-400/30 text-amber-100 border border-amber-300/40'
                      : 'bg-white/20 text-emerald-100 hover:bg-white/30'
                  }`}
                  title="Haz clic para gestionar sesión o cerrar sesión"
                >
                  <span>{state.syncStatus === 'quota-exceeded' ? '💾 Guardado en Dispositivo' : '☁️ Sesión Activa'}</span>
                  <span className="text-[9px] underline opacity-80">Salir</span>
                </button>
              ) : (
                <button
                  onClick={onOpenAuthModal || state.loginWithGoogle}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-[11px] font-bold text-white flex items-center gap-1.5 transition shadow-xs"
                  title="Inicia sesión con Correo o Google para sincronizar tus deberes"
                >
                  <LogIn size={12} /> Iniciar Sesión / Registrarse
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                ¡Hola, {state.userProfile.name}! ✨
              </h1>
              {onEditProfile && (
                <button
                  type="button"
                  onClick={onEditProfile}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition shrink-0"
                  title="Editar perfil"
                >
                  <Edit3 size={16} />
                </button>
              )}
            </div>
            <p className="text-pink-100 text-sm mt-1 max-w-md">
              Hoy es {todayDayName}. Un día para aprender, cuidar tu salud y brillar con alegría.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            {/* Fichas */}
            <div 
              onClick={() => state.setActiveTab('espacio')}
              className="bg-white/15 hover:bg-white/25 transition-all cursor-pointer backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-center"
              title="Haz clic para ver la Tienda de Recompensas"
            >
              <div className="flex items-center gap-1 justify-center">
                <Sparkles size={14} className="text-amber-300 fill-amber-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-100">Fichas</span>
              </div>
              <p className="text-xl font-black">{state.tokens} 🪙</p>
            </div>

            {/* Puntos de Actitud */}
            <div 
              onClick={() => state.setActiveTab('calma')}
              className="bg-white/15 hover:bg-white/25 transition-all cursor-pointer backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-center"
              title="Haz clic para ver los Desafíos de Actitud"
            >
              <div className="flex items-center gap-1 justify-center">
                <Star size={14} className="text-amber-300 fill-amber-300" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-100">Puntos</span>
              </div>
              <p className="text-xl font-black">{state.points} ⭐</p>
            </div>

            {/* Pendientes badge */}
            <div className="bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-100">Tareas</span>
              <p className="text-xl font-black">{pendingTasks.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AVISO IMPORTANTE: Actividades Pasadas Pendientes de Confirmar */}
      {state.pastUncompletedCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-amber-100 text-amber-700 p-2.5 rounded-2xl shrink-0 mt-0.5">
              <Clock size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-amber-900 text-base">
                  Actividades ya pasadas por confirmar
                </h2>
                <span className="bg-amber-200 text-amber-800 text-xs font-extrabold px-2 py-0.5 rounded-full">
                  {state.pastUncompletedCount}
                </span>
              </div>
              <p className="text-sm text-amber-800/90 mt-0.5">
                Tienes eventos que ya ocurrieron. Puedes marcarlas como completadas y ganar tus fichas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={state.markAllPastActivitiesAsCompleted}
              className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={16} /> Marcar todas completadas (+{state.pastUncompletedCount * 2} Fichas)
            </button>
            <button
              onClick={() => state.setActiveTab('actividades')}
              className="bg-white hover:bg-amber-100/50 text-amber-800 font-bold text-xs px-3 py-2.5 rounded-xl border border-amber-300 transition-all flex items-center justify-center gap-1"
            >
              Ver <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* DESAFÍO DE ACTITUD DEL DÍA (PUNTOS) */}
      <div className={`p-4 rounded-3xl border shadow-sm flex items-center justify-between transition-all ${
        isTodayChallengeDone
          ? 'bg-purple-50 border-purple-200'
          : 'bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border-purple-200'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => state.toggleChallengeDay(todayDayName)}
            className={`p-2 rounded-2xl transition ${
              isTodayChallengeDone ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
            }`}
            title="Marcar desafío de actitud como cumplido"
          >
            {isTodayChallengeDone ? <CheckCircle2 size={24} /> : <Star size={24} />}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider">
                Desafío de Actitud de {todayDayName}
              </span>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                +{todayChallenge.points} Puntos ⭐
              </span>
            </div>
            <h4 className="font-extrabold text-sm text-slate-900 mt-0.5">
              {todayChallenge.title}
            </h4>
            <p className="text-xs text-slate-500">{todayChallenge.description}</p>
          </div>
        </div>

        <button
          onClick={() => state.setActiveTab('calma')}
          className="text-xs font-bold text-purple-700 hover:underline shrink-0 hidden sm:block"
        >
          Rincón de Calma →
        </button>
      </div>

      {/* Alerta de Salud y Versículo Bíblico del Día en 2 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recordatorio de Salud: Cuidado de Pies y Postura */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50/80 p-5 rounded-3xl border border-teal-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-teal-500 text-white rounded-xl shadow-sm">
                  <Heart size={16} fill="currentColor" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-teal-800">
                  Cuidado de Salud Diario
                </span>
              </div>
              <span className="text-[11px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                Fascitis & Bienestar
              </span>
            </div>
            <p className="text-sm font-bold text-teal-950 mt-1">
              {state.userProfile.activeHealthHabit}
            </p>
            <p className="text-xs text-teal-700 mt-1">
              Recuerda tus estiramientos matutinos y rodar la botella fría para desinflamar la fascia.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-teal-200/60 flex items-center justify-between">
            <button
              onClick={() => state.setActiveTab('bienestar')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              Ver plan de ejercicios y agua <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Versículo de la Biblia Católica */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50/80 p-5 rounded-3xl border border-purple-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-500 text-white rounded-xl shadow-sm">
                  <BookOpen size={16} />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-purple-800">
                  Palabra de Dios para hoy
                </span>
              </div>
              <span className="text-[11px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                Biblia Católica
              </span>
            </div>
            <p className="text-sm font-semibold text-purple-950 italic mt-1 leading-relaxed">
              "{currentVerse.text}"
            </p>
            <p className="text-xs font-bold text-purple-700 text-right mt-1.5">
              — {currentVerse.reference}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-purple-200/60 flex items-center justify-between">
            <span className="text-xs text-purple-600 font-medium">Tema: {currentVerse.theme}</span>
            <button
              onClick={() => state.setActiveTab('bienestar')}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
            >
              Más oraciones <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Rápido Registro de Agua */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-100 text-sky-600 rounded-2xl">
            <Droplet size={20} className="fill-sky-500" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Agua de hoy</p>
            <p className="text-base font-bold text-slate-800">
              {state.healthLog.waterGlasses} de 8 vasos tomados
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={state.drinkWater}
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1"
          >
            <Plus size={14} /> Tomar un vaso (+1 Ficha)
          </button>
        </div>
      </div>

      {/* Tareas de Hoy */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Tareas y Pendientes</h2>
            <p className="text-xs text-slate-500 font-medium">
              Completa tus tareas para sumar fichas y canjear premios
            </p>
          </div>
          <button 
            onClick={() => setShowNewTaskModal(true)}
            className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus size={16} /> Nueva Tarea
          </button>
        </div>

        {/* Modal / formulario nueva tarea */}
        {showNewTaskModal && (
          <form onSubmit={handleCreateTask} className="bg-white p-5 rounded-3xl border border-pink-200 shadow-lg space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Añadir nueva tarea</h3>
              <button 
                type="button" 
                onClick={() => setShowNewTaskModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cancelar
              </button>
            </div>
            <div>
              <input
                type="text"
                placeholder="¿Qué necesitas hacer hoy?"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                autoFocus
                className="w-full text-sm font-medium border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Categoría</label>
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium"
                >
                  <option value="Escuela">Escuela</option>
                  <option value="Salud">Salud & Ejercicio</option>
                  <option value="Hogar">Hogar</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Prioridad</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium"
                >
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
              >
                Guardar Tarea (+1 Ficha al completar)
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2.5">
          {pendingTasks.length === 0 ? (
            <div className="text-center p-8 bg-white border-2 border-dashed border-slate-200 rounded-3xl text-slate-500">
              <Sparkles size={28} className="mx-auto text-amber-400 mb-2" />
              <p className="font-bold text-slate-700">¡Genial! No tienes tareas pendientes hoy</p>
              <p className="text-xs text-slate-400 mt-1">Disfruta tu tiempo libre o canjea una recompensa en Mi Espacio.</p>
            </div>
          ) : (
            pendingTasks.map((task: any, idx: number) => (
              <div 
                key={`task-pending-${task.id || 't'}-${idx}`} 
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <button 
                    onClick={() => state.toggleTask(task.id)} 
                    className="text-slate-300 hover:text-emerald-500 transition-colors shrink-0"
                    title="Marcar como completada"
                  >
                    <Circle size={22} />
                  </button>
                  <div>
                    <span className="font-semibold text-slate-800 text-sm block">
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        task.priority === 'Alta' 
                          ? 'bg-rose-100 text-rose-700' 
                          : task.priority === 'Media' 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {task.category}
                      </span>
                      {task.notes && (
                        <span className="text-[10px] text-slate-400 italic">
                          • {task.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => state.deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-1.5 transition-all"
                  title="Eliminar tarea"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}

          {/* Tareas Completadas */}
          {completedTasks.length > 0 && (
            <div className="pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Completadas ({completedTasks.length})
                </p>
                <span className="text-[11px] text-emerald-600 font-bold">
                  +{completedTasks.length} Fichas ganadas ✨
                </span>
              </div>
              {completedTasks.map((task: any, idx: number) => (
                <div 
                  key={`task-done-${task.id || 't'}-${idx}`} 
                  className="bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-100/80 flex items-center justify-between opacity-80 hover:opacity-100 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => state.toggleTask(task.id)} 
                      className="text-emerald-500 shrink-0"
                      title="Desmarcar / Reabrir tarea"
                    >
                      <CheckCircle2 size={20} />
                    </button>
                    <div>
                      <span className="font-medium text-slate-500 line-through text-sm">
                        {task.title}
                      </span>
                      {task.completedAt && (
                        <span className="text-[10px] text-emerald-600 font-medium block">
                          Completada: {task.completedAt}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => state.deleteTask(task.id)}
                    className="text-slate-300 hover:text-rose-500 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
