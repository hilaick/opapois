import React, { useState } from 'react';
import { X, User, GraduationCap, Heart, BookOpen, Check, Sparkles } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: {
    name: string;
    schoolGrade: string;
    studentCode?: string;
    schoolGroup?: string;
    activeHealthHabit: string;
    favoriteVerse: string;
  };
  onSave: (updated: {
    name: string;
    schoolGrade: string;
    studentCode?: string;
    schoolGroup?: string;
    activeHealthHabit: string;
    favoriteVerse: string;
  }) => void;
  currentUser?: any;
}

export function EditProfileModal({
  isOpen,
  onClose,
  userProfile,
  onSave,
  currentUser
}: EditProfileModalProps) {
  const [name, setName] = useState(userProfile.name || 'Helen');
  const [schoolGrade, setSchoolGrade] = useState(userProfile.schoolGrade || '2do de Secundaria');
  const [studentCode, setStudentCode] = useState(userProfile.studentCode || '2024-535');
  const [schoolGroup, setSchoolGroup] = useState(userProfile.schoolGroup || '535');
  const [activeHealthHabit, setActiveHealthHabit] = useState(
    userProfile.activeHealthHabit || 'Calzado ergonómico con soporte de arco (Evitar chanclas planas/Crocs)'
  );
  const [favoriteVerse, setFavoriteVerse] = useState(
    userProfile.favoriteVerse || 'Filipenses 4:13'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      schoolGrade: schoolGrade.trim(),
      studentCode: studentCode.trim(),
      schoolGroup: schoolGroup.trim(),
      activeHealthHabit: activeHealthHabit.trim(),
      favoriteVerse: favoriteVerse.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 my-8 space-y-6">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center font-black shadow-md shadow-pink-200">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Editar Perfil</h2>
              <p className="text-xs text-slate-500 font-medium">
                Personaliza el nombre, año escolar y metas de salud
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Nombre */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <User size={14} className="text-pink-600" />
              Nombre del usuario *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Helen"
              className="w-full text-sm font-semibold border border-slate-200 rounded-2xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition"
            />
            {currentUser?.email && (
              <span className="text-[11px] text-slate-400 block mt-1">
                Cuenta conectada: {currentUser.email}
              </span>
            )}
          </div>

          {/* Grado escolar */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <GraduationCap size={14} className="text-indigo-600" />
              Grado / Nivel escolar
            </label>
            <input
              type="text"
              value={schoolGrade}
              onChange={(e) => setSchoolGrade(e.target.value)}
              placeholder="Ej. 2do de Secundaria, 5to de Primaria..."
              className="w-full text-sm font-medium border border-slate-200 rounded-2xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition"
            />
          </div>

          {/* Datos SchoolAccess: Código Estudiante y Grupo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-sky-50/70 border border-sky-100 rounded-2xl">
            <div>
              <label className="text-xs font-bold text-sky-900 block mb-1">
                Código Estudiante (SchoolAccess)
              </label>
              <input
                type="text"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder="Ej. 2024-535"
                className="w-full text-xs font-semibold bg-white border border-sky-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-sky-900 block mb-1">
                Grupo / Sección (SchoolAccess)
              </label>
              <input
                type="text"
                value={schoolGroup}
                onChange={(e) => setSchoolGroup(e.target.value)}
                placeholder="Ej. 535"
                className="w-full text-xs font-semibold bg-white border border-sky-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>

          {/* Cuidado de Salud Destacado */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Heart size={14} className="text-teal-600" />
              Cuidado de Salud / Hábito Activo
            </label>
            <textarea
              rows={2}
              value={activeHealthHabit}
              onChange={(e) => setActiveHealthHabit(e.target.value)}
              placeholder="Ej. Calzado ergonómico con soporte de arco amortiguado (Cero Crocs o chanclas planas)"
              className="w-full text-xs font-medium border border-slate-200 rounded-2xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition"
            />
            <p className="text-[11px] text-teal-700 mt-1">
              Aparece destacado en la pantalla de inicio y en la barra de recordatorio de salud.
            </p>
          </div>

          {/* Versículo o Cita de Inspiración */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <BookOpen size={14} className="text-purple-600" />
              Versículo o Cita Favorita
            </label>
            <input
              type="text"
              value={favoriteVerse}
              onChange={(e) => setFavoriteVerse(e.target.value)}
              placeholder="Ej. Filipenses 4:13"
              className="w-full text-sm font-medium border border-slate-200 rounded-2xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition"
            />
          </div>

          {/* Acciones */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold px-6 py-2.5 rounded-2xl shadow-md shadow-pink-200 transition flex items-center gap-1.5"
            >
              <Check size={16} /> Guardar Perfil
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
