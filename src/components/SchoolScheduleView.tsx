import React, { useState } from 'react';
import { 
  GraduationCap, Calendar, Clock, BookOpen, CheckCircle2, 
  Circle, Plus, User, MapPin, AlertCircle, Trash2, Cloud 
} from 'lucide-react';
import { SchoolClass, Assignment } from '../types';
import { getRelativeDateString } from '../hooks/useAppState';

export function SchoolScheduleView({ state }: { state: any }) {
  const [selectedDay, setSelectedDay] = useState<'Todos' | 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes'>('Lunes');
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showSchoolAccessModal, setShowSchoolAccessModal] = useState(false);
  const [saUser, setSaUser] = useState('');
  const [saPass, setSaPass] = useState('');
  const [saLoading, setSaLoading] = useState(false);
  const [saError, setSaError] = useState('');
  const [syncSuccessMessage, setSyncSuccessMessage] = useState('');

  const [asTitle, setAsTitle] = useState('');
  const [asSubject, setAsSubject] = useState('Matemáticas');
  const [asDueDate, setAsDueDate] = useState(getRelativeDateString(2));
  const [asPriority, setAsPriority] = useState<'Alta' | 'Media' | 'Baja'>('Media');
  const [asNotes, setAsNotes] = useState('');

  const schoolClasses: SchoolClass[] = state.schoolClasses || [];
  const assignments: Assignment[] = state.assignments || [];

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const;

  const filteredClasses = selectedDay === 'Todos' 
    ? schoolClasses 
    : schoolClasses.filter(c => c.day === selectedDay);

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asTitle.trim()) return;
    state.addAssignment({
      title: asTitle.trim(),
      subject: asSubject,
      dueDate: asDueDate,
      priority: asPriority,
      notes: asNotes.trim() || undefined
    });
    setAsTitle('');
    setAsNotes('');
    setShowAddAssignment(false);
  };

  const handleSyncSchoolAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saUser || !saPass) return;
    setSaLoading(true);
    setSaError('');

    try {
      // 1. Login to SchoolAccess proxy endpoint
      const loginRes = await fetch('/api/school/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: saUser, password: saPass })
      });
      const loginData = await loginRes.json();
      if (!loginData.success) {
        throw new Error(loginData.error || 'No se pudo iniciar sesión en SchoolAccess');
      }

      // 2. Fetch assignments
      const assignRes = await fetch('/api/school/assignments');
      const assignData = await assignRes.json();
      if (!assignData.success || !Array.isArray(assignData.data)) {
        throw new Error(assignData.error || 'No se pudieron obtener las asignaciones de SchoolAccess');
      }

      // 3. Add imported assignments to state
      let importedCount = 0;
      for (const item of assignData.data) {
        if (item.title) {
          state.addAssignment({
            title: item.title,
            subject: item.subject || 'Escuela',
            dueDate: item.dueDate || getRelativeDateString(3),
            priority: 'Media',
            notes: 'Importado de SchoolAccess 🏫'
          });
          importedCount++;
        }
      }

      setSaLoading(false);
      setShowSchoolAccessModal(false);
      if (importedCount > 0) {
        setSyncSuccessMessage(`¡Se importaron ${importedCount} asignaciones de SchoolAccess con éxito! 🎉`);
      } else {
        setSyncSuccessMessage('Conexión con SchoolAccess exitosa: No se encontraron asignaciones pendientes para esta semana.');
      }
    } catch (err: any) {
      setSaLoading(false);
      setSaError(err.message || 'Error de conexión con SchoolAccess');
    }
  };

  const getSubjectColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 border-blue-200 text-blue-900 border-l-4 border-l-blue-500';
      case 'emerald': return 'bg-emerald-50 border-emerald-200 text-emerald-900 border-l-4 border-l-emerald-500';
      case 'pink': return 'bg-pink-50 border-pink-200 text-pink-900 border-l-4 border-l-pink-500';
      case 'amber': return 'bg-amber-50 border-amber-200 text-amber-900 border-l-4 border-l-amber-500';
      case 'indigo': return 'bg-indigo-50 border-indigo-200 text-indigo-900 border-l-4 border-l-indigo-500';
      case 'teal': return 'bg-teal-50 border-teal-200 text-teal-900 border-l-4 border-l-teal-500';
      case 'purple': return 'bg-purple-50 border-purple-200 text-purple-900 border-l-4 border-l-purple-500';
      case 'orange': return 'bg-orange-50 border-orange-200 text-orange-900 border-l-4 border-l-orange-500';
      case 'rose': return 'bg-rose-50 border-rose-200 text-rose-900 border-l-4 border-l-rose-500';
      case 'cyan': return 'bg-cyan-50 border-cyan-200 text-cyan-900 border-l-4 border-l-cyan-500';
      default: return 'bg-slate-50 border-slate-200 text-slate-800 border-l-4 border-l-slate-400';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto pb-28 md:pb-12">
      {/* Banner de sincronización */}
      {syncSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-sm font-bold shadow-sm animate-in fade-in">
          <span>{syncSuccessMessage}</span>
          <button 
            onClick={() => setSyncSuccessMessage('')}
            className="text-emerald-600 hover:text-emerald-900 font-black ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Horario Escolar y Deberes 📚
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Organiza tus clases de la semana, exámenes y proyectos con fechas de entrega
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowSchoolAccessModal(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-4 py-2.5 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Cloud size={18} /> Importar SchoolAccess 🏫
          </button>
          <button
            onClick={() => setShowAddAssignment(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-2.5 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Registrar Deber / Proyecto
          </button>
        </div>
      </div>

      {/* Selector de Días de la Semana */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedDay('Todos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            selectedDay === 'Todos'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Semana Completa
        </button>
        {daysOfWeek.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedDay === day
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Grid de Horario */}
      <div className="space-y-3">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Clock size={18} className="text-indigo-600" /> 
          {selectedDay === 'Todos' ? 'Todas las clases de la semana' : `Clases del ${selectedDay}`}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredClasses.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border shadow-sm transition-all ${getSubjectColor(item.color)}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wide opacity-80">
                  {item.day}
                </span>
                <span className="text-xs font-bold bg-white/70 px-2 py-0.5 rounded-lg">
                  {item.time}
                </span>
              </div>
              <h3 className="font-extrabold text-base mb-2">{item.subject}</h3>
              <div className="text-xs space-y-1 opacity-90">
                <p className="flex items-center gap-1.5 font-medium">
                  <MapPin size={13} /> {item.classroom}
                </p>
                <p className="flex items-center gap-1.5 font-medium">
                  <User size={13} /> {item.teacher}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formulario nuevo deber */}
      {showAddAssignment && (
        <form onSubmit={handleCreateAssignment} className="bg-white p-5 rounded-3xl border border-indigo-200 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="font-black text-slate-900 text-sm">Nuevo Deber o Entrega Escolar</h3>
            <button 
              type="button" 
              onClick={() => setShowAddAssignment(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Cancelar
            </button>
          </div>
          <div>
            <label className="font-bold text-slate-700 block text-xs mb-1">Título de la entrega *</label>
            <input
              type="text"
              required
              placeholder="Ej. Ensayo sobre la fotosíntesis, Ejercicios pág 45..."
              value={asTitle}
              onChange={(e) => setAsTitle(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Materia</label>
              <input
                type="text"
                value={asSubject}
                onChange={(e) => setAsSubject(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Fecha de Entrega</label>
              <input
                type="date"
                required
                value={asDueDate}
                onChange={(e) => setAsDueDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Prioridad</label>
              <select
                value={asPriority}
                onChange={(e) => setAsPriority(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
              >
                <option value="Alta">Alta (Examen / Proyecto)</option>
                <option value="Media">Media (Tarea regular)</option>
                <option value="Baja">Baja (Lectura voluntaria)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="font-bold text-slate-700 block text-xs mb-1">Notas adicionales</label>
            <input
              type="text"
              placeholder="Ej. Llevar impreso en engrapado"
              value={asNotes}
              onChange={(e) => setAsNotes(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
            >
              Guardar Deber (+2 Fichas al completar)
            </button>
          </div>
        </form>
      )}

      {/* Entregas y Deberes Pendientes */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-600" /> Deberes y Proyectos Pendientes
          </h2>
          <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
            {assignments.filter(a => !a.completed).length} por entregar
          </span>
        </div>

        <div className="space-y-2.5">
          {assignments.map(as => (
            <div
              key={as.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                as.completed
                  ? 'bg-emerald-50/40 border-emerald-200 opacity-75'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => state.toggleAssignment(as.id)}
                  className={`shrink-0 transition-colors ${
                    as.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-500'
                  }`}
                >
                  {as.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                </button>
                <div>
                  <h4 className={`font-bold text-sm ${as.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                    {as.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {as.subject}
                    </span>
                    <span className="text-slate-500 flex items-center gap-1 font-medium">
                      <Calendar size={12} /> Entrega: {as.dueDate}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      as.priority === 'Alta' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {as.priority}
                    </span>
                    {as.notes && (
                      <span className="text-slate-400 italic">• {as.notes}</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => state.deleteAssignment(as.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-2 transition"
                title="Eliminar entrega"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Importación Directa SchoolAccess */}
      {showSchoolAccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
                  <Cloud size={18} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Importar desde SchoolAccess</h3>
                  <p className="text-xs text-slate-500">Conecta tu cuenta para sincronizar deberes</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSchoolAccessModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSyncSchoolAccess} className="space-y-3 text-xs font-medium">
              {saError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                  {saError}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Usuario / Matrícula SchoolAccess *</label>
                <input
                  type="text"
                  required
                  placeholder="Tu usuario escolar..."
                  value={saUser}
                  onChange={(e) => setSaUser(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contraseña *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={saPass}
                  onChange={(e) => setSaPass(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div className="bg-sky-50 border border-sky-100 p-3 rounded-2xl text-[11px] text-sky-800 space-y-1">
                <p className="font-bold">Nota de Conexión Segura:</p>
                <p>Las credenciales se envían al servidor proxy local para autenticarse en SchoolAccess y extraer las tareas y deberes pendientes.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSchoolAccessModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saLoading}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  {saLoading ? 'Conectando e importando...' : 'Iniciar Sesión e Importar 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
