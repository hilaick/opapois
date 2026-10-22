import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, CheckCircle2, Circle, Plus, MapPin, 
  GraduationCap, AlertTriangle, Sparkles, Check,
  Sun, Utensils, Smartphone, Moon, BookOpen, Trash2, Edit3, X, ShieldCheck, Heart
} from 'lucide-react';
import { Activity, Assignment, SchoolClass, WeeklyRoutineItem } from '../types';
import { isEventPassed, getRelativeDateString, normalizeDate, isMatchingDate } from '../hooks/useAppState';

export function CalendarView({ state }: { state: any }) {
  const [viewMode, setViewMode] = useState<'calendar' | 'routines'>('calendar');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => getRelativeDateString(0));
  const [showAddModal, setShowAddModal] = useState(false);

  // New activity form for selected date
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<any>('Creativos & Paseos');
  const [newTime, setNewTime] = useState('16:00');
  const [newLocation, setNewLocation] = useState('');
  const [newCompleted, setNewCompleted] = useState(false);

  // Weekly Routines state & filters
  const [routineDayFilter, setRoutineDayFilter] = useState<string>('Todos');
  const [routineCategoryFilter, setRoutineCategoryFilter] = useState<string>('todas');
  const [showAddRoutineModal, setShowAddRoutineModal] = useState(false);

  // Form for new custom routine
  const [newRoutTitle, setNewRoutTitle] = useState('');
  const [newRoutTime, setNewRoutTime] = useState('14:45 - 15:30');
  const [newRoutCat, setNewRoutCat] = useState<'levantarse' | 'colegio' | 'comida' | 'pantalla' | 'estudio' | 'salud' | 'dormir'>('comida');
  const [newRoutDesc, setNewRoutDesc] = useState('');
  const [newRoutDays, setNewRoutDays] = useState<string[]>(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Days in month calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Day of week: 0 is Sunday in JS, convert to Monday = 0
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const days = [];

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({ dayNumber: dayNum, dateStr: str, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const str = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dayNumber: i, dateStr: str, isCurrentMonth: true });
    }

    // Next month padding days to complete 35 or 42 grid
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dayNumber: i, dateStr: str, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  const activities: Activity[] = state.activities || [];
  const assignments: Assignment[] = state.assignments || [];
  const schoolClasses: SchoolClass[] = state.schoolClasses || [];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(getRelativeDateString(0));
  };

  // Selected date elements
  const selectedActivities = activities.filter(a => isMatchingDate(a.date, selectedDateStr));
  const selectedAssignments = assignments.filter(as => isMatchingDate(as.dueDate, selectedDateStr));

  // Day of week name for selected date
  const selectedDayOfWeekName = useMemo(() => {
    const d = new Date(selectedDateStr + 'T12:00:00');
    const dayIndex = d.getDay();
    const map = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return map[dayIndex];
  }, [selectedDateStr]);

  const selectedClasses = schoolClasses.filter(c => c.day === selectedDayOfWeekName);

  // Chronological list for the current month
  const currentMonthStr = String(month + 1).padStart(2, '0');
  const currentMonthPrefix = `${year}-${currentMonthStr}`;
  const monthActivities = activities.filter(a => {
    const norm = normalizeDate(a.date);
    if (!norm) return false;
    if (norm.startsWith(currentMonthPrefix)) return true;
    if (norm.length >= 7 && norm.substring(5, 7) === currentMonthStr) {
      const itemYear = norm.substring(0, 4);
      return itemYear === String(year);
    }
    return false;
  }).sort((a, b) => normalizeDate(a.date).localeCompare(normalizeDate(b.date)));

  const handleAddActivityOnDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    state.addActivity({
      title: newTitle.trim(),
      type: newType,
      date: selectedDateStr,
      time: newTime,
      location: newLocation.trim() || undefined,
      completed: newCompleted,
      completedAt: newCompleted ? `Hoy ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : undefined
    });
    setNewTitle('');
    setNewLocation('');
    setNewCompleted(false);
    setShowAddModal(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto pb-28 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Calendario Mensual Interactivo 📅
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Vista integral de citas, paseos, deberes escolares y eventos organizados por día
          </p>
        </div>

        {/* Controles de Navegación del Mes */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGoToday}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Hoy
          </button>
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl shadow-sm p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition"
              title="Mes anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-extrabold text-sm text-slate-900 px-3 min-w-[130px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition"
              title="Mes siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid del Calendario + Panel Lateral de Detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cuadrícula Mensual (2 Columnas en pantallas grandes) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-4 md:p-6 shadow-sm space-y-3">
          
          {/* Días de la semana encabezado */}
          <div className="grid grid-cols-7 gap-1 text-center font-black text-xs text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
            {weekDays.map(d => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          {/* Celdas de días */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              const dayActivities = activities.filter(a => isMatchingDate(a.date, cell.dateStr));
              const dayAssignments = assignments.filter(as => isMatchingDate(as.dueDate, cell.dateStr));
              const isToday = cell.dateStr === getRelativeDateString(0);
              const isSelected = isMatchingDate(cell.dateStr, selectedDateStr);

              // Check if any activity is passed and uncompleted
              const hasPastUncompleted = dayActivities.some(a => isEventPassed(a) && !a.completed);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[75px] md:min-h-[90px] p-1.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-pink-50/60 border-pink-500 shadow-sm ring-2 ring-pink-300'
                      : isToday
                      ? 'bg-blue-50/40 border-blue-400 font-bold'
                      : cell.isCurrentMonth
                      ? 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/60'
                      : 'bg-slate-50/50 border-transparent text-slate-300 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : isSelected
                        ? 'bg-pink-600 text-white'
                        : cell.isCurrentMonth
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}>
                      {cell.dayNumber}
                    </span>

                    {/* Indicador de actividad pasada por confirmar */}
                    {hasPastUncompleted && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" title="Actividad pasada por confirmar" />
                    )}
                  </div>

                  {/* Badges de Actividades en la celda */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayActivities.slice(0, 3).map((act) => {
                      const passed = isEventPassed(act);
                      const locSuffix = act.location && !act.title.toLowerCase().includes(act.location.toLowerCase()) 
                        ? ` (${act.location})` 
                        : '';
                      return (
                        <div
                          key={act.id}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg truncate ${
                            act.completed
                              ? 'bg-emerald-100 text-emerald-800 line-through opacity-70'
                              : passed
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-pink-100 text-pink-800'
                          }`}
                          title={`${act.title}${act.location ? ` • ${act.location}` : ''} - ${act.time || ''}`}
                        >
                          {act.completed ? '✓ ' : passed ? '⏱️ ' : ''}{act.title}{locSuffix}
                        </div>
                      );
                    })}

                    {/* Badges de Deberes */}
                    {dayAssignments.slice(0, 1).map((as, idx) => (
                      <div
                        key={`cal-badge-${as.id || 'as'}-${idx}`}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg truncate ${
                          as.completed
                            ? 'bg-emerald-50 text-emerald-700 line-through'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        📝 {as.title}
                      </div>
                    ))}

                    {dayActivities.length + dayAssignments.length > 3 && (
                      <span className="text-[8px] text-slate-400 font-extrabold pl-1 block">
                        +{dayActivities.length + dayAssignments.length - 2} más
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leyenda de colores del calendario */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> Actividad Próxima
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pasada por confirmar
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Realizada / Completada
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Deber Escolar
            </span>
          </div>
        </div>

        {/* Panel Lateral: Detalle de la Fecha Seleccionada */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-pink-600 block">
                  Agenda del Día
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  {selectedDayOfWeekName}, {selectedDateStr}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs p-2 rounded-xl transition shadow-sm"
                title="Añadir actividad en esta fecha"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Actividades del día con botón directo para marcar completadas */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wide">
                Actividades y Salidas ({selectedActivities.length})
              </h4>

              {selectedActivities.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl">
                  Sin eventos agendados para este día.
                </p>
              ) : (
                selectedActivities.map((act) => {
                  const passed = isEventPassed(act);

                  return (
                    <div
                      key={act.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        act.completed
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : passed
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-pink-50/40 border-pink-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-bold text-xs ${act.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {act.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock size={11} /> {act.time}
                            </span>
                            {act.location && (
                              <span className="flex items-center gap-1 truncate max-w-[120px]">
                                <MapPin size={11} /> {act.location}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botón de toggle directo de completado */}
                        <button
                          onClick={() => state.toggleActivityCompleted(act.id)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition ${
                            act.completed
                              ? 'bg-emerald-200 text-emerald-900 hover:bg-emerald-300'
                              : passed
                              ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
                              : 'bg-white border border-pink-300 text-pink-700 hover:bg-pink-50'
                          }`}
                        >
                          {act.completed ? '✓ Hecha' : passed ? 'Confirmar' : 'Marcar hecha'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Deberes escolares en esta fecha */}
            {selectedAssignments.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-black uppercase text-indigo-500 tracking-wide">
                  Deberes por entregar ({selectedAssignments.length})
                </h4>
                {selectedAssignments.map((as, idx) => (
                  <div
                    key={`cal-as-list-${as.id || 'as'}-${idx}`}
                    className="p-3 rounded-2xl bg-indigo-50/40 border border-indigo-100 flex items-center justify-between"
                  >
                    <div>
                      <p className={`text-xs font-bold ${as.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {as.title}
                      </p>
                      <span className="text-[10px] text-indigo-700 font-semibold">{as.subject}</span>
                    </div>
                    <button
                      onClick={() => state.toggleAssignment(as.id)}
                      className={`text-xs ${as.completed ? 'text-emerald-500' : 'text-slate-300'}`}
                    >
                      {as.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Clases programadas según el día de la semana */}
            {selectedClasses.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wide flex items-center gap-1.5">
                  <GraduationCap size={14} /> Clases del {selectedDayOfWeekName}
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedClasses.map((cl) => (
                    <div
                      key={cl.id}
                      className="text-xs p-2 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center"
                    >
                      <span className="font-bold text-slate-700">{cl.subject}</span>
                      <span className="text-[10px] font-semibold text-slate-500">{cl.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs py-2.5 rounded-2xl border border-pink-200 transition flex items-center justify-center gap-1.5 mt-4"
          >
            <Plus size={15} /> Añadir actividad para el {selectedDateStr}
          </button>
        </div>
      </div>

      {/* Lista Cronológica Mensual (debajo del calendario) */}
      <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Todas las Actividades de {monthNames[month]} {year}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Lista ordenada por fecha con acceso rápido para marcar como realizadas
            </p>
          </div>
          <span className="text-xs font-bold bg-pink-100 text-pink-800 px-3 py-1 rounded-full">
            {monthActivities.length} registradas
          </span>
        </div>

        <div className="space-y-2.5">
          {monthActivities.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-4 text-center">
              No hay actividades agendadas en este mes.
            </p>
          ) : (
            monthActivities.map((act) => {
              const passed = isEventPassed(act);

              return (
                <div
                  key={act.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    act.completed
                      ? 'bg-emerald-50/40 border-emerald-200 opacity-80'
                      : passed
                      ? 'bg-amber-50 border-amber-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => state.toggleActivityCompleted(act.id)}
                      className={`shrink-0 ${
                        act.completed ? 'text-emerald-500' : passed ? 'text-amber-500' : 'text-slate-300'
                      }`}
                    >
                      {act.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                    <div>
                      <h4 className={`text-xs font-bold ${act.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {act.title}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        📅 {act.date} • 🕒 {act.time} {act.location ? `• 📍 ${act.location}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {act.completed ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        ✓ Completada
                      </span>
                    ) : passed ? (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        ⏱️ Pasada por confirmar
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Próxima
                      </span>
                    )}

                    <button
                      onClick={() => state.toggleActivityCompleted(act.id)}
                      className={`text-xs font-bold px-3 py-1 rounded-xl transition ${
                        act.completed
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : passed
                          ? 'bg-amber-500 text-white hover:bg-amber-600'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {act.completed ? 'Reabrir' : 'Completar'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Añadir Actividad en Fecha Seleccionada */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-base font-black text-slate-900">
                Añadir Actividad para {selectedDateStr}
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddActivityOnDate} className="space-y-3 text-xs font-medium">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Título de la actividad *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Clase de pintura, Salida familiar, Torneo..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoría</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-semibold"
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
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-2.5 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lugar</label>
                <input
                  type="text"
                  placeholder="Lugar o recinto..."
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 block text-xs">
                    ¿Ya se realizó esta actividad?
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    Marca aquí para guardarla como completada (+2 Fichas)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={newCompleted}
                  onChange={(e) => setNewCompleted(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-5 py-2 rounded-xl shadow-sm"
                >
                  Guardar en Calendario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
