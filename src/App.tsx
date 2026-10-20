import React, { useState } from 'react';
import { 
  Home, Calendar as CalendarIcon, Heart, Sparkles, GraduationCap, 
  Palette, Flame, Star, Wallet, Wind, LogIn, LogOut, Cloud, CloudCheck, User as UserIcon, Edit3
} from 'lucide-react';
import { useAppState } from './hooks/useAppState';
import { TodayDashboard } from './components/TodayDashboard';
import { CalendarView } from './components/CalendarView';
import { ActivitiesView } from './components/ActivitiesView';
import { SchoolScheduleView } from './components/SchoolScheduleView';
import { BudgetView } from './components/BudgetView';
import { CalmCornerView } from './components/CalmCornerView';
import { WellnessView } from './components/WellnessView';
import { DreamAndBudgetView } from './components/DreamAndBudgetView';
import { EditProfileModal } from './components/EditProfileModal';

export default function App() {
  const appState = useAppState();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const navItems = [
    { id: 'hoy', icon: Home, label: 'Hoy', badge: null },
    { id: 'calendario', icon: CalendarIcon, label: 'Calendario', badge: null },
    { id: 'actividades', icon: Palette, label: 'Actividades', badge: appState.pastUncompletedCount > 0 ? `${appState.pastUncompletedCount}` : null },
    { id: 'escuela', icon: GraduationCap, label: 'Escuela', badge: null },
    { id: 'presupuesto', icon: Wallet, label: 'Presupuesto', badge: null },
    { id: 'calma', icon: Wind, label: 'Rincón de Calma', badge: null },
    { id: 'bienestar', icon: Heart, label: 'Bienestar', badge: null },
    { id: 'espacio', icon: Sparkles, label: 'Mi Espacio', badge: null },
  ] as const;

  const userInitial = appState.userProfile.name ? appState.userProfile.name.charAt(0).toUpperCase() : 'H';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans antialiased text-slate-800 selection:bg-pink-200">
      
      {/* Sidebar para Escritorio */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/90 p-5 shrink-0 justify-between sticky top-0 h-screen overflow-y-auto">
        <div className="space-y-5">
          {/* Logo y Perfil de Helen / Usuario (Clickable para editar) */}
          <div 
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center justify-between p-2 rounded-2xl hover:bg-pink-50/50 border border-transparent hover:border-pink-200 cursor-pointer group transition-all"
            title="Haz clic para editar el perfil"
          >
            <div className="flex items-center gap-3 min-w-0">
              {appState.currentUser?.photoURL ? (
                <img 
                  src={appState.currentUser.photoURL} 
                  alt={appState.userProfile.name} 
                  className="w-10 h-10 rounded-2xl object-cover shadow-md shadow-pink-200" 
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center font-black text-lg shadow-md shadow-pink-200">
                  {userInitial}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-extrabold text-sm text-slate-900 tracking-tight leading-none truncate">
                  Mi Organizador
                </h2>
                <span className="text-[11px] font-bold text-pink-600 block mt-0.5 truncate">
                  {appState.userProfile.name} • {appState.userProfile.schoolGrade}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="text-slate-300 group-hover:text-pink-600 p-1 rounded-lg transition"
              title="Editar perfil"
            >
              <Edit3 size={15} />
            </button>
          </div>

          {/* Monedas: Fichas y Puntos de Actitud */}
          <div className="grid grid-cols-2 gap-2">
            <div 
              onClick={() => appState.setActiveTab('espacio')}
              className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-2.5 text-center cursor-pointer hover:bg-amber-100/60 transition"
              title="Fichas ganadas por tareas y actividades"
            >
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide block">Fichas</span>
              <span className="text-base font-black text-amber-900">{appState.tokens} 🪙</span>
            </div>

            <div 
              onClick={() => appState.setActiveTab('calma')}
              className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-2.5 text-center cursor-pointer hover:bg-purple-100/60 transition"
              title="Puntos de carácter ganados por actitud diaria"
            >
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wide block">Puntos</span>
              <span className="text-base font-black text-purple-900">{appState.points} ⭐</span>
            </div>
          </div>

          {/* Menú de Navegación Vertical */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = appState.activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => appState.setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-pink-600 text-white shadow-md shadow-pink-200/50'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive 
                        ? 'bg-white text-pink-700' 
                        : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Estado de Sincronización en la Nube (Firebase) y Salud */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          {appState.currentUser ? (
            <div className={`p-2.5 rounded-2xl flex items-center justify-between border ${
              appState.syncStatus === 'quota-exceeded'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="min-w-0">
                <span className={`text-[10px] font-black uppercase tracking-wide flex items-center gap-1 ${
                  appState.syncStatus === 'quota-exceeded'
                    ? 'text-amber-800'
                    : 'text-emerald-800'
                }`}>
                  {appState.syncStatus === 'quota-exceeded' ? '💾 Guardado Local' : '☁️ Nube Activa'}
                </span>
                <p className={`text-[10px] truncate font-medium ${
                  appState.syncStatus === 'quota-exceeded' ? 'text-amber-700' : 'text-emerald-700'
                }`}>
                  {appState.currentUser.email || appState.userProfile.name}
                </p>
              </div>
              <button
                onClick={appState.logoutUser}
                className="text-slate-400 hover:text-rose-600 p-1"
                title="Cerrar sesión"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={appState.loginWithGoogle}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <LogIn size={13} /> Iniciar Sesión con Google
            </button>
          )}

          {/* Botón directo para Editar Perfil */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full bg-slate-50 hover:bg-pink-50 border border-slate-200 hover:border-pink-200 text-slate-700 hover:text-pink-700 font-bold text-[11px] py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <UserIcon size={13} className="text-pink-600" /> Editar Perfil
          </button>

          <div className="bg-teal-50/70 border border-teal-200/60 p-2.5 rounded-2xl text-[10px] space-y-0.5">
            <p className="font-bold text-teal-900 flex items-center gap-1">
              <Heart size={12} className="text-teal-600 fill-teal-600" /> Cuidado de Fascitis:
            </p>
            <p className="text-teal-700 leading-tight">
              Calzado ergonómico con soporte amortiguado. Cero chanclas planas.
            </p>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Barra superior en móviles */}
        <header className="md:hidden bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <div 
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition"
            title="Toca para editar tu perfil"
          >
            {appState.currentUser?.photoURL ? (
              <img 
                src={appState.currentUser.photoURL} 
                alt={appState.userProfile.name} 
                className="w-8 h-8 rounded-xl object-cover shadow-sm" 
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {userInitial}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1">
                <h2 className="font-extrabold text-xs text-slate-900 leading-tight">Mi Organizador</h2>
                <Edit3 size={11} className="text-pink-500" />
              </div>
              <p className="text-[10px] text-pink-600 font-bold">{appState.userProfile.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => appState.setActiveTab('espacio')}
              className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-xs font-black text-amber-800 flex items-center gap-1"
            >
              <Sparkles size={12} className="text-amber-500 fill-amber-500" />
              {appState.tokens}
            </button>
            <button
              onClick={() => appState.setActiveTab('calma')}
              className="bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-xl text-xs font-black text-purple-800 flex items-center gap-1"
            >
              <Star size={12} className="text-amber-500 fill-amber-500" />
              {appState.points}
            </button>
          </div>
        </header>

        {/* Vista Activa */}
        <main className="flex-1">
          {appState.activeTab === 'hoy' && (
            <TodayDashboard 
              state={appState} 
              onEditProfile={() => setIsProfileModalOpen(true)} 
            />
          )}
          {appState.activeTab === 'calendario' && <CalendarView state={appState} />}
          {appState.activeTab === 'actividades' && <ActivitiesView state={appState} />}
          {appState.activeTab === 'escuela' && <SchoolScheduleView state={appState} />}
          {appState.activeTab === 'presupuesto' && <BudgetView state={appState} />}
          {appState.activeTab === 'calma' && <CalmCornerView state={appState} />}
          {appState.activeTab === 'bienestar' && <WellnessView state={appState} />}
          {appState.activeTab === 'espacio' && <DreamAndBudgetView state={appState} />}
        </main>

        {/* Barra de Navegación Inferior (Móviles) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1 py-1.5 flex items-center justify-around z-40 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = appState.activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => appState.setActiveTab(item.id as any)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative shrink-0 ${
                  isActive ? 'text-pink-600 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  <Icon size={18} className={isActive ? 'text-pink-600' : 'text-slate-400'} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 bg-amber-500 text-white rounded-full text-[8px] font-black w-3.5 h-3.5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Modal para Editar Perfil */}
      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={appState.userProfile}
        onSave={appState.updateUserProfile}
        currentUser={appState.currentUser}
      />

    </div>
  );
}
