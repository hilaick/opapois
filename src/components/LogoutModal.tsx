import React, { useState } from 'react';
import { LogOut, X, ShieldCheck, RefreshCw } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: any;
  onOpenAuthModal?: () => void;
}

export function LogoutModal({ isOpen, onClose, state }: LogoutModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirmLogout = async () => {
    setLoading(true);
    try {
      if (state.handleLogout) {
        await state.handleLogout();
      } else if (state.clearAllUserDataAndLogout) {
        await state.clearAllUserDataAndLogout();
      } else {
        await state.logoutUser();
      }
      onClose();
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    } finally {
      setLoading(false);
    }
  };

  const userEmail = state?.currentUser?.email || state?.userProfile?.name || 'tu cuenta';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-100 my-8 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs font-black text-xl mb-1">
            <LogOut size={26} />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            ¿Deseas cerrar tu sesión?
          </h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Sesión actual: <span className="font-bold text-slate-800">{userEmail}</span>
          </p>
        </div>

        {/* Notificación de seguridad */}
        <div className="p-4 bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-emerald-800">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
            <span>Datos 100% seguros en la Base de Datos</span>
          </div>
          <p className="text-[11px] text-emerald-700 leading-relaxed">
            Todos tus deberes, horarios, notas y presupuesto se encuentran respaldados en tu base de datos en la nube. Al salir, ningún dato quedará visible en este dispositivo y la pantalla volverá al inicio de sesión.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex-1 px-4 py-3 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition text-center"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirmLogout}
            className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md shadow-rose-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <LogOut size={14} />
            )}
            <span>{loading ? 'Cerrando...' : 'Cerrar Sesión'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
