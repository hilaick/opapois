import React, { useState, useMemo } from 'react';
import { 
  DollarSign, TrendingDown, Wallet, Plus, Trash2, 
  PieChart, Tag, Calendar, Edit2, Check, ArrowUpRight, Sparkles
} from 'lucide-react';
import { ExpenseItem, ExpenseCategory } from '../types';
import { getRelativeDateString } from '../hooks/useAppState';

export function BudgetView({ state }: { state: any }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(() => String(state?.initialBudgetAmount ?? 1500));

  // Edit Expense modal state
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState<ExpenseCategory>('Materiales Escolares');
  const [editDate, setEditDate] = useState(getRelativeDateString(0));

  // Form fields
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Materiales Escolares');
  const [expDate, setExpDate] = useState(getRelativeDateString(0));
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');

  const expenses: ExpenseItem[] = Array.isArray(state?.expenses) ? state.expenses : [];
  const initialBudget = Number(state?.initialBudgetAmount) || 1500;

  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);
  }, [expenses]);

  const remainingBalance = initialBudget - totalSpent;
  const spentPercentage = Math.min(Math.round((totalSpent / (initialBudget || 1)) * 100), 100);

  // Category breakdown
  const categoryTotals = useMemo(() => {
    const cats: Record<ExpenseCategory, number> = {
      'Pelo': 0,
      'Aseo Personal': 0,
      'Materiales Escolares': 0,
      'Salud & Cuidado': 0,
      'Paseos & Meriendas': 0,
      'Ahorro & Metas': 0,
      'Otros': 0
    };
    expenses.forEach(e => {
      if (!e) return;
      const amt = Number(e.amount) || 0;
      if (cats[e.category] !== undefined) {
        cats[e.category] += amt;
      } else {
        cats['Otros'] += amt;
      }
    });
    return cats;
  }, [expenses]);

  const filteredExpenses = categoryFilter === 'Todas'
    ? expenses
    : expenses.filter(e => e.category === categoryFilter);

  const handleSaveBudgetAmount = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(budgetInput);
    if (!isNaN(val) && val > 0) {
      state.setInitialBudgetAmount(val);
      setIsEditingBudget(false);
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(expAmount);
    if (!expDesc.trim() || isNaN(amountNum) || amountNum <= 0) return;

    state.addExpense({
      description: expDesc.trim(),
      amount: amountNum,
      category: expCategory,
      date: expDate
    });

    setExpDesc('');
    setExpAmount('');
    setShowAddModal(false);
  };

  const handleStartEditExpense = (exp: ExpenseItem) => {
    setEditingExpense(exp);
    setEditDesc(exp.description || '');
    setEditAmount(String(exp.amount ?? ''));
    setEditCategory((exp.category as any) || 'Otros');
    setEditDate(exp.date || getRelativeDateString(0));
  };

  const handleSaveEditExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    const amountNum = Number(editAmount);
    if (!editDesc.trim() || isNaN(amountNum) || amountNum <= 0) return;

    const updates = {
      description: editDesc.trim(),
      amount: amountNum,
      category: editCategory,
      date: editDate
    };

    if (state.updateExpense) {
      state.updateExpense(editingExpense.id, updates);
    } else {
      // Fallback
      state.setExpenses(expenses.map(e => String(e.id) === String(editingExpense.id) ? { ...e, ...updates } : e));
    }

    setEditingExpense(null);
  };

  const getCategoryColor = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'Pelo': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Aseo Personal': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'Materiales Escolares': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Salud & Cuidado': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Paseos & Meriendas': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Ahorro & Metas': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto pb-28 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Presupuesto & Registro de Gastos 💰
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Lleva el control de tu mesada, compras escolares, salud y salidas
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 rounded-2xl shadow-sm transition flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Registrar Gasto
        </button>
      </div>

      {/* Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Presupuesto Total */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Presupuesto Inicial</span>
            <button
              onClick={() => setIsEditingBudget(!isEditingBudget)}
              className="text-pink-600 hover:text-pink-700 p-1"
              title="Modificar presupuesto inicial"
            >
              <Edit2 size={14} />
            </button>
          </div>

          {isEditingBudget ? (
            <form onSubmit={handleSaveBudgetAmount} className="flex items-center gap-2 mt-2">
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-24 text-lg font-black border border-slate-300 rounded-xl px-2 py-1"
                autoFocus
              />
              <button
                type="submit"
                className="bg-emerald-600 text-white p-2 rounded-xl text-xs font-bold"
              >
                <Check size={16} />
              </button>
            </form>
          ) : (
            <p className="text-2xl md:text-3xl font-black text-slate-900 mt-2">
              ${(Number(initialBudget) || 0).toLocaleString()}
            </p>
          )}

          <p className="text-xs text-slate-400 mt-1">Monto base asignado para administrar</p>
        </div>

        {/* Total Gastado */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total Gastado
          </span>
          <p className="text-2xl md:text-3xl font-black text-rose-600 mt-2 flex items-center gap-1">
            ${(Number(totalSpent) || 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">{expenses.length} movimientos registrados</p>
        </div>

        {/* Saldo Disponible */}
        <div className={`p-5 rounded-3xl border shadow-sm ${
          remainingBalance >= 0 
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' 
            : 'bg-gradient-to-br from-rose-500 to-red-600 text-white'
        }`}>
          <span className="text-xs font-bold uppercase tracking-wider opacity-90 block">
            Saldo Disponible
          </span>
          <p className="text-2xl md:text-3xl font-black mt-2">
            ${(Number(remainingBalance) || 0).toLocaleString()}
          </p>
          <p className="text-xs opacity-90 mt-1">
            {remainingBalance >= 0 ? '¡Vas muy bien con tu administración!' : 'Has superado el presupuesto inicial'}
          </p>
        </div>
      </div>

      {/* Barra de Progreso del Presupuesto */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-slate-600">Gasto ejecutado: {spentPercentage}%</span>
          <span className="text-emerald-700">Disponible: ${(Number(remainingBalance) || 0).toLocaleString()}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              spentPercentage > 85 ? 'bg-rose-500' : spentPercentage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${spentPercentage}%` }}
          />
        </div>
      </div>

      {/* Desglose de Gastos por Categoría */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <PieChart size={18} className="text-emerald-600" /> Distribución por Categorías
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(Object.keys(categoryTotals) as ExpenseCategory[]).map(cat => {
            const amount = categoryTotals[cat];
            const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;

            return (
              <div key={cat} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 block truncate">{cat}</span>
                <p className="text-base font-black text-slate-800">${amount}</p>
                <span className="text-[10px] text-slate-400 font-semibold">{pct}% del total</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan de Compras Recurrentes y Cuidado Personal (Pelo & Aseo) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-purple-600" /> Plan de Compras de Cuidado Personal & Pelo
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Productos esenciales de cuidado capilar (Yellow / Norex) y aseo personal con sus costos y periodicidad
            </p>
          </div>
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full self-start sm:self-auto">
            7 Productos Clave
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(state?.budgetItems || []).map((b: any) => {
            const isPurchased = Boolean(b.purchased);
            return (
              <div 
                key={`budget-item-${b.id}`} 
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isPurchased ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      b.category === 'Pelo' ? 'bg-purple-100 text-purple-800' : 'bg-pink-100 text-pink-800'
                    }`}>
                      {b.category}
                    </span>
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Calendar size={11} className="text-slate-400" /> {b.date}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">{b.item}</h4>
                </div>

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200/60">
                  <span className="text-base font-black text-slate-900">${Number(b.cost).toFixed(2)}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => state.toggleBudgetItemPurchased && state.toggleBudgetItemPurchased(b.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                        isPurchased 
                          ? 'bg-emerald-600 text-white shadow-xs' 
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isPurchased ? <Check size={14} /> : null}
                      <span>{isPurchased ? 'Comprado' : 'Marcar Comprado'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filtros y Lista de Gastos */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900">
            Historial de Gastos y Compras
          </h3>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
            {['Todas', 'Pelo', 'Aseo Personal', 'Materiales Escolares', 'Salud & Cuidado', 'Paseos & Meriendas', 'Ahorro & Metas'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredExpenses.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-6 text-center">
              No hay gastos registrados en esta categoría.
            </p>
          ) : (
            filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                    $
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{exp.description}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full font-bold border ${getCategoryColor(exp.category)}`}>
                        {exp.category}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar size={11} /> {exp.date}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-900">
                    -${(Number(exp?.amount) || 0).toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleStartEditExpense(exp)}
                    className="text-slate-300 hover:text-pink-600 p-1.5 transition"
                    title="Editar gasto"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => state.deleteExpense(exp.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600 p-1.5 transition"
                    title="Eliminar gasto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Editar Gasto */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-base font-black text-slate-900">Editar Gasto o Compra</h3>
              <button 
                onClick={() => setEditingExpense(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditExpense} className="space-y-3 text-xs font-medium">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Concepto / Nombre del Gasto *</label>
                <input
                  type="text"
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monto ($) *</label>
                  <input
                    type="number"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Categoría</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700"
                >
                  <option value="Pelo">Pelo (Shampoo, Acondicionador, Tratamiento...)</option>
                  <option value="Aseo Personal">Aseo Personal (Scrub, Crema, Splash...)</option>
                  <option value="Materiales Escolares">Materiales Escolares</option>
                  <option value="Salud & Cuidado">Salud & Cuidado</option>
                  <option value="Paseos & Meriendas">Paseos & Meriendas</option>
                  <option value="Ahorro & Metas">Ahorro & Metas</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-5 py-2 rounded-xl shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Gasto */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-base font-black text-slate-900">Registrar Nuevo Gasto</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs font-medium">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Concepto / ¿En qué gastaste? *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cuaderno de dibujo, Meriendas, Plantillas..."
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monto ($) *</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Categoría</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700"
                >
                  <option value="Pelo">Pelo (Shampoo, Acondicionador, Tratamiento...)</option>
                  <option value="Aseo Personal">Aseo Personal (Scrub, Crema, Splash...)</option>
                  <option value="Materiales Escolares">Materiales Escolares</option>
                  <option value="Salud & Cuidado">Salud & Cuidado</option>
                  <option value="Paseos & Meriendas">Paseos & Meriendas</option>
                  <option value="Ahorro & Metas">Ahorro & Metas</option>
                  <option value="Otros">Otros</option>
                </select>
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl shadow-sm"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
