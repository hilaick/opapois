import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Task, Activity, SchoolClass, Assignment, DreamItem, 
  RewardItem, BibleVerse, HealthLog, ExpenseItem, ExpenseCategory,
  AttitudeChallenge, CalmReflection, SchoolGradesData, BudgetItem, WeeklyRoutineItem 
} from '../types';
import { 
  auth, db, loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, logoutUser, onAuthStateChanged, 
  doc, setDoc, getDoc, onSnapshot, collection, getDocs, User 
} from '../firebase';

export const getRelativeDateString = (offsetDays: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const normalizeDate = (rawDate?: any): string => {
  if (!rawDate) return '';

  // Handle Firestore Timestamp or Date object
  if (typeof rawDate === 'object') {
    if (typeof rawDate.toDate === 'function') {
      try {
        const d = rawDate.toDate();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } catch (e) {}
    } else if (rawDate.seconds !== undefined) {
      try {
        const d = new Date(rawDate.seconds * 1000);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } catch (e) {}
    } else if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
      return `${rawDate.getFullYear()}-${String(rawDate.getMonth() + 1).padStart(2, '0')}-${String(rawDate.getDate()).padStart(2, '0')}`;
    }
  }

  const d = String(rawDate).trim();
  if (!d) return '';

  // YYYY-MM-DD anywhere in string
  const isoMatch = d.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }
  // YYYY/MM/DD anywhere in string
  const ymdSlashMatch = d.match(/\b(\d{4})\/(\d{2})\/(\d{2})\b/);
  if (ymdSlashMatch) {
    return `${ymdSlashMatch[1]}-${ymdSlashMatch[2]}-${ymdSlashMatch[3]}`;
  }

  // DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY anywhere in string (even after "Lunes, ")
  const dmyMatch = d.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (dmyMatch) {
    let p1 = parseInt(dmyMatch[1], 10);
    let p2 = parseInt(dmyMatch[2], 10);
    const y = dmyMatch[3];
    // If second number > 12, it is MM/DD/YYYY (e.g. 10/19/2026)
    let dayNum = p1;
    let monthNum = p2;
    if (p2 > 12 && p1 <= 12) {
      monthNum = p1;
      dayNum = p2;
    }
    const day = String(dayNum).padStart(2, '0');
    const month = String(monthNum).padStart(2, '0');
    return `${y}-${month}-${day}`;
  }

  // DD/MM or DD-MM (without year, default to current year)
  const dmMatch = d.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (dmMatch) {
    const day = dmMatch[1].padStart(2, '0');
    const month = dmMatch[2].padStart(2, '0');
    const y = new Date().getFullYear();
    return `${y}-${month}-${day}`;
  }

  // Spanish & English text format: e.g. "lunes, octubre 19, 2026", "Viernes 23 de Octubre", "19-Oct-2026"
  const monthMap: Record<string, string> = {
    enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
    julio: '07', agosto: '08', septiembre: '09', setiembre: '09', octubre: '10',
    noviembre: '11', diciembre: '12',
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
    ene: '01', feb: '02', mar: '03', abr: '04', apr: '04', jun: '06',
    jul: '07', ago: '08', aug: '08', sep: '09', oct: '10', nov: '11', dic: '12', dec: '12'
  };

  const lower = d.toLowerCase();
  for (const [mName, mNum] of Object.entries(monthMap)) {
    const regex = new RegExp(`\\b${mName}\\b`, 'i');
    if (regex.test(lower) || (mName.length >= 4 && lower.includes(mName))) {
      // Remove any 4-digit year first when looking for the 1-2 digit day
      const withoutYear = lower.replace(/\b20\d{2}\b/g, '');
      const dayMatch = withoutYear.match(/\b(\d{1,2})\b/);
      if (dayMatch) {
        const day = dayMatch[1].padStart(2, '0');
        const yearMatch = lower.match(/\b(20\d{2})\b/);
        const y = yearMatch ? yearMatch[1] : new Date().getFullYear();
        return `${y}-${mNum}-${day}`;
      }
    }
  }

  return d;
};

export const isMatchingDate = (date1?: any, date2?: any): boolean => {
  if (!date1 || !date2) return false;
  const n1 = normalizeDate(date1);
  const n2 = normalizeDate(date2);
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;
  if (n1.startsWith(n2) || n2.startsWith(n1)) return true;

  // If year differs or is fuzzy, match on Month-Day (e.g. -10-23)
  if (n1.length >= 10 && n2.length >= 10) {
    if (n1.substring(5, 10) === n2.substring(5, 10)) {
      return true;
    }
  }
  return false;
};

export const normalizeActivity = (item: any): Activity => {
  if (!item || typeof item !== 'object') {
    return {
      id: 'act-' + Math.random().toString(36).substring(2, 9),
      title: 'Actividad',
      type: 'Creativos & Paseos',
      date: getRelativeDateString(0),
      completed: false
    };
  }

  const title = item.title || item.titulo || item.name || item.nombre || item.activity || item.actividad || item.event || item.evento || item.description || item.descripcion || 'Actividad';

  const rawDate = item.date || item.fecha || item.dia || item.day || item.dueDate || item.fechaEvento || item.startDate || '';
  const parsedDate = normalizeDate(rawDate) || getRelativeDateString(0);

  const time = item.time || item.hora || item.horario || item.startTime || '16:00';
  const location = item.location || item.lugar || item.ubicacion || item.place || item.sede || undefined;
  const notes = item.notes || item.notas || item.detalles || item.details || item.description || undefined;
  const type = item.type || item.tipo || item.category || item.categoria || 'Creativos & Paseos';
  const completed = Boolean(item.completed || item.completada || item.completado || item.done);
  const completedAt = item.completedAt || item.completadaEl || item.fechaCompletado || undefined;

  return {
    ...item,
    id: String(item.id || item._id || item.uuid || 'act-' + Math.random().toString(36).substring(2, 9)),
    title: String(title),
    type,
    date: parsedDate,
    time: time ? String(time) : undefined,
    location: location ? String(location) : undefined,
    notes: notes ? String(notes) : undefined,
    completed,
    completedAt
  };
};

export const normalizeDream = (raw: any, index: number = 0): DreamItem => {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `dream-${index}-${Date.now()}`,
      title: String(raw || 'Meta o Sueño'),
      category: 'Metas',
      imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
      description: '',
      completed: false
    };
  }

  const id = (raw.id !== undefined && raw.id !== null && String(raw.id).trim() !== '')
    ? String(raw.id)
    : (raw._id ? String(raw._id) : `d-${index}-${Date.now()}`);

  const title = String(raw.title || raw.titulo || raw.name || raw.texto || 'Mi Sueño o Meta').trim();
  const rawCat = raw.category || raw.categoria;
  const category = (['Metas', 'Viajes', 'Inspiración', 'Habilidades'].includes(rawCat) ? rawCat : 'Metas') as any;
  const imageUrl = String(raw.imageUrl || raw.image || raw.img || raw.url || raw.foto || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80').trim();
  const description = String(raw.description || raw.descripcion || raw.desc || raw.notes || raw.notas || '').trim();

  // Normalización exhaustiva de estado completado
  const isCompleted = raw.completed === true || 
                      raw.completed === 'true' || 
                      raw.completed === 1 ||
                      raw.cumplido === true || 
                      raw.cumplido === 'true' || 
                      raw.cumplida === true || 
                      raw.cumplida === 'true' || 
                      raw.completado === true || 
                      raw.completado === 'true' || 
                      raw.completada === true || 
                      raw.completada === 'true' || 
                      raw.done === true || 
                      raw.done === 'true' || 
                      raw.status === 'completed' || 
                      raw.status === 'cumplido';

  return {
    ...raw,
    id,
    title,
    category,
    imageUrl,
    description,
    completed: Boolean(isCompleted)
  };
};

export const normalizeExpense = (raw: any, index: number = 0): ExpenseItem => {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `exp-${index}-${Date.now()}`,
      description: String(raw || 'Gasto registrado'),
      amount: 0,
      category: 'Otros',
      date: getRelativeDateString(0)
    };
  }

  const rawAmount = raw.amount ?? raw.monto ?? raw.cost ?? raw.costo ?? raw.precio ?? raw.valor ?? raw.total ?? 0;
  const numAmount = typeof rawAmount === 'number' ? rawAmount : (parseFloat(String(rawAmount).replace(/[^0-9.-]+/g, '')) || 0);

  let rawCat = raw.category || raw.categoria;
  const validCategories: ExpenseCategory[] = ['Pelo', 'Aseo Personal', 'Materiales Escolares', 'Salud & Cuidado', 'Paseos & Meriendas', 'Ahorro & Metas', 'Otros'];
  
  let desc = String(raw.description || raw.item || raw.descripcion || raw.title || raw.titulo || raw.concepto || raw.name || 'Gasto').trim();

  // Mapear conceptos antiguos a los ítems reales de cuidado y presupuesto si corresponde
  if (desc.toLowerCase().includes('acuarela') || desc.toLowerCase().includes('plantilla')) {
    if (numAmount >= 26 || index === 0) {
      desc = 'Shampoo Yellow';
      rawCat = 'Pelo';
    } else {
      desc = 'Acondicionador Yellow';
      rawCat = 'Pelo';
    }
  } else if (desc.toLowerCase().includes('merienda')) {
    desc = 'Tratamiento';
    rawCat = 'Pelo';
  } else if (desc.toLowerCase().includes('alcancia') || desc.toLowerCase().includes('alcancía')) {
    desc = 'Body Scrub';
    rawCat = 'Aseo Personal';
  }

  const category = (validCategories.includes(rawCat) ? rawCat : 'Otros') as ExpenseCategory;

  return {
    ...raw,
    id: String(raw.id || raw._id || `exp-${index}-${Date.now()}`),
    description: desc,
    amount: isNaN(numAmount) ? 0 : Math.abs(numAmount),
    category,
    date: normalizeDate(raw.date || raw.fecha) || getRelativeDateString(0)
  };
};

export const isEventPassed = (activity: { date: string; time?: string }): boolean => {
  if (!activity.date) return false;
  const now = new Date();
  const todayStr = getRelativeDateString(0);
  const normalized = normalizeDate(activity.date);
  
  if (normalized < todayStr) return true;
  if (normalized > todayStr) return false;
  
  if (activity.time) {
    const [hours, minutes] = activity.time.split(':').map(Number);
    const eventTime = new Date();
    eventTime.setHours(hours || 0, minutes || 0, 0, 0);
    return now.getTime() > eventTime.getTime();
  }
  return false;
};

export const getCurrentWeekRange = (referenceDate: Date = new Date()) => {
  const currentDay = referenceDate.getDay(); // 0 es Domingo, 1 es Lunes
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate() + diffToMonday, 0, 0, 0, 0);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);

  const pad = (n: number) => String(n).padStart(2, '0');
  const mondayIso = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
  const sundayIso = `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;

  return { monday, sunday, mondayIso, sundayIso };
};

export const isDateInCurrentWeek = (rawDate?: any, referenceDate?: Date): boolean => {
  if (!rawDate) return false;
  const iso = normalizeDate(rawDate);
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  
  const { mondayIso, sundayIso } = getCurrentWeekRange(referenceDate);
  return iso >= mondayIso && iso <= sundayIso;
};

export const filterTasksByCurrentWeek = <T extends { dueDate?: string; date?: string }>(items: T[], referenceDate?: Date): T[] => {
  if (!Array.isArray(items)) return [];
  return items.filter(item => isDateInCurrentWeek(item.dueDate || item.date, referenceDate));
};

export const WEEKLY_CHALLENGES: Record<string, AttitudeChallenge> = {
  Lunes: {
    day: 'Lunes',
    title: 'Paciencia y Escucha Atenta 👂',
    description: 'Escuchar con atención en clase sin interrumpir y responder con amabilidad.',
    points: 15
  },
  Martes: {
    day: 'Martes',
    title: 'Sonrisa y Buenos Días al Despertar ☀️',
    description: 'Comenzar la mañana saludando con alegría a mamá, papá y hermanos.',
    points: 15
  },
  Miércoles: {
    day: 'Miércoles',
    title: 'Mantener la Calma y Respirar 🌸',
    description: 'Ante un momento de frustración o tarea difícil, pausar y respirar hondo.',
    points: 20
  },
  Jueves: {
    day: 'Jueves',
    title: 'Colaborar en Casa con Iniciativa 🧹',
    description: 'Hacer una ayuda sorpresa en el hogar sin que nadie tenga que pedirlo.',
    points: 15
  },
  Viernes: {
    day: 'Viernes',
    title: 'Celebrar el Esfuerzo de Otros 🌟',
    description: 'Felicitar sinceramente a una compañera o amiga por su trabajo.',
    points: 15
  },
  Sábado: {
    day: 'Sábado',
    title: 'Cuidar mis Cosas con Gratitud 🎨',
    description: 'Dejar mis útiles y mi habitación limpios como agradecimiento por lo que tengo.',
    points: 15
  },
  Domingo: {
    day: 'Domingo',
    title: 'Amor en Familia y Agradecer a Dios 🕊️',
    description: 'Disfrutar la comida en familia y rezar dando gracias por la semana.',
    points: 20
  }
};

// Presupuesto Inicial y Cuidados (Pelo & Aseo Personal)
export const INITIAL_BUDGET: BudgetItem[] = [
  { id: 1, category: "Pelo", item: "Shampoo Yellow", cost: 26.00, date: "Cada 2/3 meses", purchased: false },
  { id: 2, category: "Pelo", item: "Acondicionador Yellow", cost: 26.00, date: "Cada 2/3 meses", purchased: false },
  { id: 3, category: "Pelo", item: "Tratamiento", cost: 20.00, date: "Por definir", purchased: false },
  { id: 4, category: "Pelo", item: "Recarga Norex", cost: 5.00, date: "Por definir", purchased: false },
  { id: 5, category: "Aseo Personal", item: "Body Scrub", cost: 10.00, date: "Mensual", purchased: false },
  { id: 6, category: "Aseo Personal", item: "Crema Cuerpo", cost: 8.00, date: "Mensual", purchased: false },
  { id: 7, category: "Aseo Personal", item: "Splash", cost: 5.00, date: "Mensual", purchased: false },
];

export const INITIAL_EXPENSES: ExpenseItem[] = [
  { id: 'exp-1', description: 'Shampoo Yellow', amount: 26.00, category: 'Pelo', date: getRelativeDateString(-2) },
  { id: 'exp-2', description: 'Acondicionador Yellow', amount: 26.00, category: 'Pelo', date: getRelativeDateString(-2) },
  { id: 'exp-3', description: 'Tratamiento', amount: 20.00, category: 'Pelo', date: getRelativeDateString(-5) },
  { id: 'exp-4', description: 'Recarga Norex', amount: 5.00, category: 'Pelo', date: getRelativeDateString(-8) },
  { id: 'exp-5', description: 'Body Scrub', amount: 10.00, category: 'Aseo Personal', date: getRelativeDateString(-1) },
  { id: 'exp-6', description: 'Crema Cuerpo', amount: 8.00, category: 'Aseo Personal', date: getRelativeDateString(-3) },
  { id: 'exp-7', description: 'Splash', amount: 5.00, category: 'Aseo Personal', date: getRelativeDateString(-6) },
];

export const INITIAL_WEEKLY_ROUTINES: WeeklyRoutineItem[] = [
  {
    id: 'rout-1',
    time: '05:45 - 06:30',
    title: 'Hora de Levantarse y Aseo Matutino',
    category: 'levantarse',
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    description: 'Despertar con energía, estiramientos con toalla para fascitis, calzado ergonómico y desayuno nutritivo.',
    icon: '🌅'
  },
  {
    id: 'rout-2',
    time: '06:40 - 07:15',
    title: 'Salida hacia el Colegio Real de Panamá',
    category: 'colegio',
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    description: 'Mochila organizada con libros y agenda. Salida puntual con mamá/papá.',
    icon: '🚌'
  },
  {
    id: 'rout-3',
    time: '07:30 - 14:15',
    title: 'Horario Escolar y Clases Académicas',
    category: 'colegio',
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    description: 'Atención a clases, actividades grupales, recreo con merienda y postura ergonómica.',
    icon: '🏫'
  },
  {
    id: 'rout-4',
    time: '14:45 - 15:30',
    title: 'Hora de Comer al Llegar del Colegio',
    category: 'comida',
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    description: 'Llegada a casa, lavado de manos, cambio a calzado cómodo de descanso y almuerzo familiar saludable.',
    icon: '🍽️'
  },
  {
    id: 'rout-5',
    time: '15:30 - 17:00',
    title: 'Hora de Deberes y Tareas Escolares',
    category: 'estudio',
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    description: 'Realizar deberes de SchoolAccess, repasar vocabulario de inglés, matemáticas y preparar la cartuchera.',
    icon: '📚'
  },
  {
    id: 'rout-6',
    time: '17:00 - 18:00',
    title: 'Tiempos de Pantalla (Límite 1 hora)',
    category: 'pantalla',
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    description: 'Uso de dispositivos equilibrado: juegos educativos, contenidos creativos o comunicación familiar. Máximo 1 hora.',
    icon: '📱'
  },
  {
    id: 'rout-7',
    time: '18:00 - 18:45',
    title: 'Terapia de Pies & Tiempo Libre sin Pantallas',
    category: 'salud',
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    description: 'Rodar botella fría con hielo por 15 minutos en la planta del pie. Dibujo, plastilina o lectura recreativa.',
    icon: '🧊'
  },
  {
    id: 'rout-8',
    time: '19:00 - 19:45',
    title: 'Cena en Familia y Charla del Día',
    category: 'comida',
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    description: 'Cena ligera en la mesa, compartir momentos bonitos del día y reír juntos.',
    icon: '🥗'
  },
  {
    id: 'rout-9',
    time: '19:45 - 20:30',
    title: 'Aseo Personal y Cuidado de Cabello',
    category: 'salud',
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    description: 'Ducha tibia, cuidado capilar con Yellow / Norex, cepillado dental y pijama limpia.',
    icon: '🚿'
  },
  {
    id: 'rout-10',
    time: '20:30 - 21:00',
    title: 'Lectura Espiritual y Preparación de Noche',
    category: 'dormir',
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    description: 'Lectura de Filipenses 4:13, agradecimiento del día y ambiente relajante con luces tenues.',
    icon: '📖'
  },
  {
    id: 'rout-11',
    time: '21:00',
    title: 'Hora de Dormir y Descanso Total',
    category: 'dormir',
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    description: 'Sueño reparador de 8 a 9 horas para crecer fuerte, regenerar los pies y levantarse con energía.',
    icon: '🌙'
  },
  // Rutinas específicas para Sábados y Domingos
  {
    id: 'rout-12',
    time: '07:30 - 08:30',
    title: 'Hora de Levantarse (Fin de Semana)',
    category: 'levantarse',
    days: ['Sábado', 'Domingo'],
    description: 'Despertar con calma, estiramientos de pies en la cama y desayuno relajado en familia.',
    icon: '☀️'
  },
  {
    id: 'rout-13',
    time: '12:30 - 13:30',
    title: 'Almuerzo Familiar de Fin de Semana',
    category: 'comida',
    days: ['Sábado', 'Domingo'],
    description: 'Comida rica en familia, hidratación fresca y descanso de mediodía.',
    icon: '🍲'
  },
  {
    id: 'rout-14',
    time: '14:00 - 15:30',
    title: 'Tiempos de Pantalla (Fin de Semana)',
    category: 'pantalla',
    days: ['Sábado', 'Domingo'],
    description: 'Tiempo de entretenimiento digital, ver películas o videojuegos compartidos (1.5 horas máximo).',
    icon: '🎮'
  },
  {
    id: 'rout-15',
    time: '16:00 - 18:30',
    title: 'Paseo al Aire Libre / Actividades Creativas',
    category: 'salud',
    days: ['Sábado', 'Domingo'],
    description: 'Paseo al parque con calzado de arco amortiguado, dibujo, manualidades o visita a familiares.',
    icon: '🎨'
  }
];

const INITIAL_TASKS: Task[] = [
  {
    id: 't-1',
    title: 'Terminar maqueta de Biología sobre la célula',
    category: 'Escuela',
    priority: 'Alta',
    completed: false,
    dueDate: getRelativeDateString(0),
    notes: 'Llevar plastilina y etiquetas'
  },
  {
    id: 't-2',
    title: 'Rodar botella fría con hielo en la planta del pie (15 min)',
    category: 'Salud',
    priority: 'Alta',
    completed: false,
    dueDate: getRelativeDateString(0),
    notes: 'Importante para aliviar la fascitis plantar'
  },
  {
    id: 't-3',
    title: 'Repasar vocabulario de Inglés Unit 4',
    category: 'Escuela',
    priority: 'Media',
    completed: false,
    dueDate: getRelativeDateString(1),
  },
  {
    id: 't-4',
    title: 'Preparar ropa y tenis con soporte para la clase deportiva',
    category: 'Salud',
    priority: 'Media',
    completed: true,
    completedAt: 'Hoy 07:30',
    dueDate: getRelativeDateString(0),
  },
  {
    id: 't-5',
    title: 'Organizar mochila y estuche de colores',
    category: 'Hogar',
    priority: 'Baja',
    completed: true,
    completedAt: 'Ayer 20:00',
    dueDate: getRelativeDateString(-1),
  }
];

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    title: 'Taller de Acuarela Botánica y Dibujo Libre',
    type: 'Creativos & Paseos',
    date: getRelativeDateString(-2),
    time: '16:00',
    location: 'Centro Cultural Los Pinos',
    notes: 'Llevar bloc de papel de 300g y pinceles',
    completed: false
  },
  {
    id: 'act-2',
    title: 'Cita con el Fisioterapeuta (Revisión de pisada)',
    type: 'Salud & Clases',
    date: getRelativeDateString(-1),
    time: '11:30',
    location: 'Clínica Ortopédica San Rafael',
    notes: 'Llevar las plantillas ortopédicas nuevas',
    completed: true,
    completedAt: 'Ayer 12:15'
  },
  {
    id: 'act-3',
    title: 'Torneo Intercolegial de Ajedrez (Ronda Clasificatoria)',
    type: 'Competiciones',
    date: getRelativeDateString(0),
    time: '17:00',
    location: 'Gimnasio del Colegio',
    notes: 'Llegar 15 minutos antes con la credencial escolar',
    completed: false
  },
  {
    id: 'act-4',
    title: 'Paseo al Jardín Botánico con la Familia',
    type: 'Creativos & Paseos',
    date: getRelativeDateString(2),
    time: '10:00',
    location: 'Jardín Botánico Nacional',
    notes: 'Llevar tenis cómodos con soporte y cámara de fotos',
    completed: false
  },
  {
    id: 'act-5',
    title: 'Clase Magistral de Piano y Lectura Musical',
    type: 'Salud & Clases',
    date: getRelativeDateString(4),
    time: '15:30',
    location: 'Academia Mozart',
    notes: 'Practicar la sonatina en Sol mayor',
    completed: false
  }
];

const INITIAL_CLASSES: SchoolClass[] = [
  { id: 'c-1', day: 'Lunes', time: '08:00 - 09:30', subject: 'Matemáticas', classroom: 'Aula 204', teacher: 'Prof. García', color: 'blue' },
  { id: 'c-2', day: 'Lunes', time: '09:45 - 11:15', subject: 'Ciencias Naturales', classroom: 'Lab 1', teacher: 'Dra. Méndez', color: 'emerald' },
  { id: 'c-3', day: 'Lunes', time: '11:45 - 13:15', subject: 'Lengua y Literatura', classroom: 'Aula 102', teacher: 'Lic. Morales', color: 'pink' },
  { id: 'c-4', day: 'Martes', time: '08:00 - 09:30', subject: 'Historia Universal', classroom: 'Aula 105', teacher: 'Prof. Rivas', color: 'amber' },
  { id: 'c-5', day: 'Martes', time: '09:45 - 11:15', subject: 'Inglés Avanzado', classroom: 'Aula Idiomas', teacher: 'Ms. Thompson', color: 'indigo' },
  { id: 'c-6', day: 'Martes', time: '11:45 - 13:15', subject: 'Educación Física', classroom: 'Pistas / Cancha', teacher: 'Entr. Carlos', color: 'teal' },
  { id: 'c-7', day: 'Miércoles', time: '08:00 - 09:30', subject: 'Matemáticas', classroom: 'Aula 204', teacher: 'Prof. García', color: 'blue' },
  { id: 'c-8', day: 'Miércoles', time: '09:45 - 11:15', subject: 'Artes Visuales', classroom: 'Taller de Arte', teacher: 'Mtra. Lucía', color: 'purple' },
  { id: 'c-9', day: 'Jueves', time: '08:00 - 09:30', subject: 'Geografía', classroom: 'Aula 103', teacher: 'Prof. Romero', color: 'orange' },
  { id: 'c-10', day: 'Jueves', time: '09:45 - 11:15', subject: 'Inglés Avanzado', classroom: 'Aula Idiomas', teacher: 'Ms. Thompson', color: 'indigo' },
  { id: 'c-11', day: 'Viernes', time: '08:00 - 09:30', subject: 'Formación Ética y Cívica', classroom: 'Aula 108', teacher: 'Lic. Herrera', color: 'rose' },
  { id: 'c-12', day: 'Viernes', time: '09:45 - 11:15', subject: 'Computación y Robótica', classroom: 'Sala de Cómputo', teacher: 'Ing. Ortiz', color: 'cyan' },
];

const INITIAL_ASSIGNMENTS: Assignment[] = [
  { id: 'as-1', title: 'Ensayo sobre Don Quijote de la Mancha', subject: 'Lengua y Literatura', dueDate: getRelativeDateString(3), priority: 'Alta', completed: false, notes: 'Mínimo 2 páginas, incluir citas textuales' },
  { id: 'as-2', title: 'Ejercicios de Ecuaciones Lineales (Pág 84)', subject: 'Matemáticas', dueDate: getRelativeDateString(1), priority: 'Alta', completed: false, notes: 'Mostrar todos los pasos' },
  { id: 'as-3', title: 'Glosario de Términos Geológicos', subject: 'Ciencias Naturales', dueDate: getRelativeDateString(5), priority: 'Media', completed: false },
  { id: 'as-4', title: 'Lectura Chapter 5 - The Secret Garden', subject: 'Inglés Avanzado', dueDate: getRelativeDateString(-1), priority: 'Media', completed: true },
];

const INITIAL_REWARDS: RewardItem[] = [
  { id: 'r-1', title: 'Elegir la película del viernes en familia 🎬', tokenCost: 5, description: 'Tú tienes el control remoto y las palomitas', icon: 'Film', claimedCount: 2 },
  { id: 'r-2', title: 'Tarde de helado o postre favorito 🍦', tokenCost: 8, description: 'Una salida especial por tu esfuerzo y constancia', icon: 'IceCream', claimedCount: 1 },
  { id: 'r-3', title: 'Sesión de acuarelas y manualidades sin interrupción 🎨', tokenCost: 6, description: 'Tiempo libre para crear con música suave', icon: 'Palette', claimedCount: 3 },
  { id: 'r-4', title: 'Día de descanso de una tarea del hogar 🌟', tokenCost: 10, description: 'Un pase libre especial canjeable con mamá o papá', icon: 'Sparkles', claimedCount: 0 },
  { id: 'r-5', title: 'Nuevo libro o cuaderno decorativo 📖', tokenCost: 15, description: 'Para tu colección de lectura o dibujos', icon: 'BookOpen', claimedCount: 1 },
];

const BIBLE_VERSES: BibleVerse[] = [
  { reference: 'Filipenses 4:13', text: 'Todo lo puedo en Cristo que me fortalece.', theme: 'Fortaleza y Confianza' },
  { reference: 'Jeremías 29:11', text: 'Porque yo sé bien los planes que tengo para ustedes, planes de bienestar y no de calamidad, para darles un futuro y una esperanza.', theme: 'Paz y Esperanza' },
  { reference: 'Salmo 23:1', text: 'El Señor es mi pastor, nada me faltará.', theme: 'Cuidado y Protección' },
  { reference: 'Proverbios 3:5-6', text: 'Confía en el Señor con todo tu corazón, y no te apoyes en tu propia prudencia; reconócelo en todos tus caminos, y Él enderezará tus senderos.', theme: 'Sabiduría Diaria' },
  { reference: 'Isaías 40:31', text: 'Los que esperan en el Señor renovarán sus fuerzas; volarán como las águilas, correrán y no se fatigarán, caminarán y no se cansarán.', theme: 'Ánimo y Renovación' },
  { reference: 'Josué 1:9', text: 'Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque el Señor tu Dios estará contigo dondequiera que vayas.', theme: 'Valentía' },
  { reference: 'Mateo 5:14', text: 'Ustedes son la luz del mundo: no se puede ocultar una ciudad puesta en lo alto de un monte.', theme: 'Propósito y Bondad' }
];

const INITIAL_DREAMS: DreamItem[] = [
  {
    id: 'd-1',
    title: 'Escribir e ilustrar mi propio libro de cuentos',
    category: 'Creativos & Paseos' as any,
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
    description: 'Historias de naturaleza, magia y amistad con dibujos hechos con acuarela.',
    completed: false
  },
  {
    id: 'd-2',
    title: 'Recuperar al 100% la fuerza de mis pies para correr feliz',
    category: 'Habilidades',
    imageUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=600&q=80',
    description: 'Hacer mis estiramientos diarios, usar zapatos con excelente amortiguación y cuidar mi salud.',
    completed: false
  },
  {
    id: 'd-3',
    title: 'Viaje a Roma y Asís con mi familia',
    category: 'Viajes',
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80',
    description: 'Conocer las iglesias históricas, comer auténtico helado italiano y disfrutar juntos.',
    completed: false
  }
];

export function useAppState() {
  const [activeTab, setActiveTab] = useState<'hoy' | 'calendario' | 'actividades' | 'escuela' | 'bienestar' | 'calma' | 'presupuesto' | 'espacio'>(() => {
    return (localStorage.getItem('mop_active_tab') as any) || 'hoy';
  });

  // User auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline' | 'quota-exceeded'>('offline');
  const activeFirestoreDocId = useRef<string>('main');
  const isQuotaExceededRef = useRef<boolean>(false);

  // Dual Currency: Tokens (Fichas) & Points (Puntos de Actitud)
  const [tokens, setTokens] = useState<number>(() => {
    const saved = localStorage.getItem('mop_tokens');
    return saved !== null ? Number(saved) : 14;
  });

  const [points, setPoints] = useState<number>(() => {
    const saved = localStorage.getItem('mop_points');
    return saved !== null ? Number(saved) : 60;
  });

  // Attitude Challenges by Day
  const [challengesByDay, setChallengesByDay] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('mop_challenges_day');
    return saved ? JSON.parse(saved) : { Lunes: true, Martes: true };
  });

  const [streakDays, setStreakDays] = useState<number>(() => {
    const saved = localStorage.getItem('mop_streak');
    return saved !== null ? Number(saved) : 6;
  });

  // User Profile: Default to Helen Nicole with SchoolAccess credentials
  const [userProfile, setUserProfile] = useState(() => {
    const savedUser = localStorage.getItem('sa_saved_user') || '1660';
    const savedPass = localStorage.getItem('sa_saved_pass') || '';
    const saved = localStorage.getItem('mop_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name === 'Sofía' || !parsed.name) {
          parsed.name = 'Helen Nicole Yard Garcia';
        }
        if (!parsed.studentCode) parsed.studentCode = savedUser;
        if (!parsed.schoolGroup) parsed.schoolGroup = '535';
        if (!parsed.schoolAccessUsername) parsed.schoolAccessUsername = savedUser;
        if (!parsed.schoolAccessPassword && savedPass) parsed.schoolAccessPassword = savedPass;
        return parsed;
      } catch (e) { /* ignore */ }
    }
    return {
      name: 'Helen Nicole Yard Garcia',
      schoolGrade: '5º - Primaria A',
      studentCode: savedUser,
      schoolGroup: '535',
      schoolAccessUsername: savedUser,
      schoolAccessPassword: savedPass,
      activeHealthHabit: 'Calzado ergonómico con soporte de arco (Evitar chanclas planas/Crocs)',
      favoriteVerse: 'Filipenses 4:13'
    };
  });

  // Presupuesto detallado y Gastos
  const [initialBudgetAmount, setInitialBudgetAmount] = useState<number>(() => {
    const saved = localStorage.getItem('mop_initial_budget');
    return saved !== null ? Number(saved) : 1500;
  });

  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem('mop_expenses');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((e, idx) => normalizeExpense(e, idx));
        }
      } catch (e) {
        console.warn('Error reading mop_expenses:', e);
      }
    }
    return INITIAL_EXPENSES.map((e, idx) => normalizeExpense(e, idx));
  });

  // Ítems de Presupuesto Inicial y Cuidados (Pelo & Aseo Personal)
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(() => {
    const saved = localStorage.getItem('mop_budget_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_BUDGET;
  });

  // Horario y Rutinas Semanales (Levantarse, tiempos de pantalla, hora de comer de colegio, etc.)
  const [routines, setRoutines] = useState<WeeklyRoutineItem[]>(() => {
    const saved = localStorage.getItem('mop_weekly_routines');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_WEEKLY_ROUTINES;
  });

  // Cumplimiento de rutinas por fecha y rutina (clave: YYYY-MM-DD_routineId)
  const [routineCompletions, setRoutineCompletions] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('mop_routine_completions');
    return saved ? JSON.parse(saved) : {};
  });

  // Rincón de calma y reflexiones
  const [calmJournal, setCalmJournal] = useState<CalmReflection[]>(() => {
    const saved = localStorage.getItem('mop_calm_journal');
    return saved ? JSON.parse(saved) : [
      {
        id: 'calm-1',
        date: getRelativeDateString(-1),
        mood: 'tranquila',
        gratitude: 'Agradezco el apoyo de mis papás con mis ejercicios del pie.',
        achievement: 'Logré mantener la calma durante el examen difícil de Matemáticas.'
      }
    ];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('mop_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const isCloudDataLoadedRef = useRef<boolean>(false);
  const isDirtyRef = useRef<boolean>(false);

  const [activities, setActivities] = useState<Activity[]>(() => {
    const keys = [
      'mop_activities',
      'mop_appointments',
      'appointments',
      'activities',
      'user_appointments',
      'citas',
      'eventos',
      'agenda',
      'UserData',
      'user_data',
      'organizer_data'
    ];

    const candidateItems: Activity[] = [];
    const seenIds = new Set<string>();

    const extractList = (parsed: any): any[] => {
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') {
        const inner = parsed.appointments || parsed.activities || parsed.citas || parsed.eventos || parsed.agenda;
        if (Array.isArray(inner)) return inner;
      }
      return [];
    };

    // 1. Scan candidate keys
    for (const key of keys) {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          const list = extractList(parsed);
          for (const item of list) {
            if (item && typeof item === 'object') {
              const norm = normalizeActivity(item);
              if (!seenIds.has(norm.id)) {
                seenIds.add(norm.id);
                candidateItems.push(norm);
              }
            }
          }
        }
      } catch (e) { /* ignore */ }
    }

    // 2. Scan ANY other key in localStorage for possible saved activities
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || keys.includes(k)) continue;
        const saved = localStorage.getItem(k);
        if (!saved || (!saved.startsWith('[') && !saved.startsWith('{'))) continue;
        try {
          const parsed = JSON.parse(saved);
          const list = extractList(parsed);
          for (const item of list) {
            if (item && typeof item === 'object' && (item.title || item.titulo || item.lugar || item.location || item.fecha || item.date)) {
              const norm = normalizeActivity(item);
              if (!seenIds.has(norm.id)) {
                seenIds.add(norm.id);
                candidateItems.push(norm);
              }
            }
          }
        } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }

    if (candidateItems.length > 0) {
      return candidateItems;
    }

    return INITIAL_ACTIVITIES.map(normalizeActivity);
  });

  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>(() => {
    const saved = localStorage.getItem('mop_school_classes');
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });

  const isMetadataGrade = (text: string = '') => {
    const clean = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (!clean) return true;
    if (clean.includes('espanol')) return false;
    return clean.includes('codigo') || clean.includes('cedula') || clean.includes('nombre') ||
           clean.includes('grado') || clean.includes('ano lectivo') || clean.startsWith('ano ') || clean === 'ano' ||
           clean.includes('seccion') || clean.includes('seleccionar') || clean.includes('boletin') ||
           clean.includes('estudiante') || clean.includes('materia') || clean.includes('asignatura') ||
           clean.includes('promedio') || clean.includes('periodo') || clean.includes('condicion');
  };

  const [gradesData, setGradesData] = useState<SchoolGradesData>(() => {
    const saved = localStorage.getItem('mop_grades');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.grades)) {
            parsed.grades = parsed.grades.filter((g: any) => g && g.subject && !isMetadataGrade(g.subject));
          }
          return parsed;
        }
      } catch (e) {}
    }
    return { grades: [], habits: [], attendance: [], observations: [] };
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('mop_assignments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seenIds = new Set<string>();
          return parsed.map((item: any, idx: number) => {
            let id = String(item.id || `as-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`);
            if (seenIds.has(id)) {
              id = `as-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
            }
            seenIds.add(id);
            return { ...item, id };
          });
        }
      } catch (e) {}
    }
    return INITIAL_ASSIGNMENTS;
  });

  const [rewards, setRewards] = useState<RewardItem[]>(() => {
    const saved = localStorage.getItem('mop_rewards');
    return saved ? JSON.parse(saved) : INITIAL_REWARDS;
  });

  const [dreams, setDreams] = useState<DreamItem[]>(() => {
    const saved = localStorage.getItem('mop_dreams');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((it, idx) => normalizeDream(it, idx));
        }
      } catch (e) {
        console.warn('Error reading mop_dreams:', e);
      }
    }
    return INITIAL_DREAMS.map((it, idx) => normalizeDream(it, idx));
  });

  const [healthLog, setHealthLog] = useState<HealthLog>(() => {
    const saved = localStorage.getItem('mop_health_log');
    return saved ? JSON.parse(saved) : {
      waterGlasses: 5,
      stretchedFeet: true,
      supportShoesWorn: true,
      iceBottleDone: false,
      notes: 'Me siento mucho mejor sin dolor al levantarme por la mañana.'
    };
  });

  // Function to apply incoming data from Cloud Firestore (supports all schemas)
  const applyCloudData = useCallback((data: any) => {
    if (!data) return;
    isCloudDataLoadedRef.current = true;

    if (Array.isArray(data.tasks)) setTasks(data.tasks);

    // Support both 'appointments' and 'activities'
    const cloudActivities = data.appointments || data.activities || data.citas || data.eventos || data.agenda;
    if (Array.isArray(cloudActivities) && cloudActivities.length > 0) {
      setActivities(cloudActivities.map(normalizeActivity));
    }

    // Support both 'budget' and 'expenses'
    const cloudExpenses = data.budget || data.expenses;
    if (Array.isArray(cloudExpenses)) {
      setExpenses(cloudExpenses.map((e, idx) => normalizeExpense(e, idx)));
    }

    if (Array.isArray(data.budgetItems)) {
      setBudgetItems(data.budgetItems);
    }

    if (data.initialBudgetAmount !== undefined) {
      setInitialBudgetAmount(Number(data.initialBudgetAmount));
    }

    if (data.tokens !== undefined) setTokens(Number(data.tokens));
    if (data.points !== undefined) setPoints(Number(data.points));
    if (data.streakDays !== undefined) setStreakDays(Number(data.streakDays));

    if (data.challengesByDay && typeof data.challengesByDay === 'object') {
      setChallengesByDay(data.challengesByDay);
    }

    if (Array.isArray(data.routines)) {
      setRoutines(data.routines);
    }

    if (data.routineCompletions && typeof data.routineCompletions === 'object') {
      setRoutineCompletions(data.routineCompletions);
    }

    if (Array.isArray(data.calmJournal)) {
      setCalmJournal(data.calmJournal);
    }

    // Support both 'healthAlerts' and 'healthLog'
    if (data.healthLog || data.healthAlerts) {
      setHealthLog(data.healthLog || data.healthAlerts);
    }

    // Support both 'visionBoard' and 'dreams'
    const cloudDreams = data.visionBoard || data.dreams;
    if (Array.isArray(cloudDreams)) {
      setDreams(prev => {
        const normalizedCloud = cloudDreams.map((item, idx) => normalizeDream(item, idx));
        if (!prev || prev.length === 0) return normalizedCloud;
        return normalizedCloud.map(cd => {
          const localMatch = prev.find(p => String(p.id) === String(cd.id) || p.title.toLowerCase() === cd.title.toLowerCase());
          if (localMatch && (isDirtyRef.current || localMatch.completed)) {
            return {
              ...cd,
              completed: localMatch.completed
            };
          }
          return cd;
        });
      });
    }

    if (Array.isArray(data.rewards)) {
      setRewards(data.rewards);
    }

    if (Array.isArray(data.schoolClasses)) {
      setSchoolClasses(data.schoolClasses);
    }

    if (Array.isArray(data.assignments)) {
      const seenIds = new Set<string>();
      const sanitized = data.assignments.map((item: any, idx: number) => {
        let id = String(item.id || `as-${Date.now()}-${idx}`);
        if (seenIds.has(id)) {
          id = `as-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
        }
        seenIds.add(id);
        return { ...item, id };
      });
      setAssignments(sanitized);
    }

    if (data.gradesData && typeof data.gradesData === 'object') {
      setGradesData(data.gradesData);
    }

    const profileObj = data.userProfile || data.profile;
    const cloudName = profileObj?.name || data.name || data.userName;
    if (profileObj || cloudName) {
      setUserProfile((prev: any) => ({
        ...prev,
        ...(profileObj || {}),
        name: (cloudName && cloudName !== 'Sofía') ? cloudName : (prev.name || 'Helen Nicole')
      }));
    }
  }, []);

  // Firebase Auth listener and automatic user name & Firestore data resolution
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        setSyncStatus('synced');

        // Resolve user display name
        const nameToUse = user.displayName 
          ? user.displayName 
          : (user.email ? user.email.split('@')[0] : 'Helen Nicole');

        setUserProfile((prev: any) => ({
          ...prev,
          name: prev.name && prev.name !== 'Sofía' ? prev.name : nameToUse
        }));

        // Search for existing Firestore data in user's scoped document
        try {
          const mainDocRef = doc(db, 'users', user.uid, 'data', 'main');
          const mainSnap = await getDoc(mainDocRef);

          if (mainSnap.exists()) {
            activeFirestoreDocId.current = 'main';
            applyCloudData(mainSnap.data());
          } else {
            // Check direct document /users/{uid}
            const directDocRef = doc(db, 'users', user.uid);
            const directSnap = await getDoc(directDocRef);
            if (directSnap.exists()) {
              applyCloudData(directSnap.data());
            } else {
              // First time user login! Seed initial state into Firestore database
              const initialUserData = {
                userProfile: {
                  name: nameToUse,
                  schoolGrade: '5º - Primaria A',
                  studentCode: '1660',
                  schoolGroup: '535',
                  schoolAccessUsername: '1660',
                  schoolAccessPassword: '',
                  activeHealthHabit: 'Calzado ergonómico con soporte de arco (Evitar chanclas planas/Crocs)',
                  favoriteVerse: 'Filipenses 4:13'
                },
                tasks: INITIAL_TASKS,
                activities: INITIAL_ACTIVITIES,
                appointments: INITIAL_ACTIVITIES,
                tokens: 14,
                points: 60,
                streakDays: 6,
                expenses: INITIAL_EXPENSES,
                budget: INITIAL_EXPENSES,
                budgetItems: INITIAL_BUDGET,
                initialBudgetAmount: 1500,
                challengesByDay: { Lunes: true, Martes: true },
                routines: INITIAL_WEEKLY_ROUTINES,
                routineCompletions: {},
                calmJournal: [
                  {
                    id: 'calm-1',
                    date: getRelativeDateString(-1),
                    mood: 'tranquila',
                    gratitude: 'Agradezco el apoyo de mis papás con mis ejercicios del pie.',
                    achievement: 'Logré mantener la calma durante el examen difícil de Matemáticas.'
                  }
                ],
                healthLog: {
                  waterGlasses: 5,
                  stretchedFeet: true,
                  supportShoesWorn: true,
                  iceBottleDone: false,
                  notes: 'Me siento mucho mejor sin dolor al levantarme por la mañana.'
                },
                healthAlerts: {
                  waterGlasses: 5,
                  stretchedFeet: true,
                  supportShoesWorn: true,
                  iceBottleDone: false,
                  notes: 'Me siento mucho mejor sin dolor al levantarme por la mañana.'
                },
                dreams: INITIAL_DREAMS,
                visionBoard: INITIAL_DREAMS,
                rewards: INITIAL_REWARDS,
                schoolClasses: INITIAL_CLASSES,
                assignments: INITIAL_ASSIGNMENTS,
                gradesData: { grades: [], habits: [], attendance: [], observations: [] },
                updatedAt: new Date().toISOString()
              };

              try {
                await setDoc(mainDocRef, initialUserData, { merge: true });
                applyCloudData(initialUserData);
              } catch (seedErr) {
                console.warn('Initial cloud seed notice:', seedErr);
              }
            }
          }
        } catch (err) {
          console.warn('Error reading initial Firestore collections:', err);
        }
      } else {
        // User is logged out: clear state so no private data remains visible
        setSyncStatus('offline');
        setTasks([]);
        setAssignments([]);
        setActivities([]);
        setTokens(0);
        setPoints(0);
        setStreakDays(0);
        setExpenses([]);
        setBudgetItems([]);
        setRoutines([]);
        setRoutineCompletions({});
        setCalmJournal([]);
        setHealthLog({
          waterGlasses: 0,
          stretchedFeet: false,
          supportShoesWorn: false,
          iceBottleDone: false,
          notes: ''
        });
        setRewards([]);
        setDreams([]);
        setSchoolClasses([]);
        setGradesData({ grades: [], habits: [], attendance: [], observations: [] });
        setUserProfile({
          name: '',
          schoolGrade: '',
          studentCode: '',
          schoolGroup: '',
          schoolAccessUsername: '',
          schoolAccessPassword: '',
          activeHealthHabit: '',
          favoriteVerse: ''
        });
      }
    });

    return () => unsubscribe();
  }, [applyCloudData]);

  // Real-time snapshot listener on the active document
  useEffect(() => {
    if (!currentUser) return;
    const activeDocRef = doc(db, 'users', currentUser.uid, 'data', activeFirestoreDocId.current);

    const unsubscribe = onSnapshot(activeDocRef, (snap) => {
      // Ignore local optimistic writes to prevent feedback/write loops
      if (snap.metadata.hasPendingWrites) {
        return;
      }
      if (snap.exists()) {
        applyCloudData(snap.data());
        setSyncStatus('synced');
      }
    }, (error: any) => {
      if (error?.code === 'resource-exhausted' || error?.message?.includes('Quota limit exceeded')) {
        console.warn('Firestore write/read quota reached. Using local persistence mode.');
        isQuotaExceededRef.current = true;
        setSyncStatus('quota-exceeded');
      } else if (error?.code === 'unavailable' || error?.message?.includes('access control checks') || error?.message?.includes('network')) {
        console.warn('Firestore streaming channel unavailable in this environment.');
        setSyncStatus('offline');
      } else {
        console.warn('Firestore snapshot error:', error);
        setSyncStatus('offline');
      }
    });

    return () => unsubscribe();
  }, [currentUser, applyCloudData]);

  // Push local changes to Firestore when state updates and user is logged in
  const pushToFirestore = useCallback(async () => {
    if (!currentUser) return;
    // Stop if quota is exceeded
    if (isQuotaExceededRef.current) return;
    // Only write if user explicitly made local modifications!
    if (!isDirtyRef.current) {
      return;
    }

    setSyncStatus('saving');
    try {
      const activeDocRef = doc(db, 'users', currentUser.uid, 'data', activeFirestoreDocId.current);
      
      // Save full user state directly to Firestore
      await setDoc(activeDocRef, {
        userProfile,
        tasks,
        activities,
        appointments: activities,
        tokens,
        points,
        streakDays,
        expenses,
        budget: expenses,
        budgetItems,
        initialBudgetAmount,
        challengesByDay,
        routines,
        routineCompletions,
        calmJournal,
        healthLog,
        healthAlerts: healthLog,
        dreams,
        visionBoard: dreams,
        rewards,
        schoolClasses,
        assignments,
        gradesData,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      isDirtyRef.current = false;
      setSyncStatus('synced');
    } catch (err: any) {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
        console.warn('Firestore daily write quota reached.');
        isQuotaExceededRef.current = true;
        setSyncStatus('quota-exceeded');
      } else {
        console.error('Error saving to Firestore:', err);
        setSyncStatus('offline');
      }
    }
  }, [currentUser, userProfile, tasks, activities, tokens, points, streakDays, expenses, budgetItems, initialBudgetAmount, challengesByDay, routines, routineCompletions, calmJournal, healthLog, dreams, rewards, schoolClasses, assignments, gradesData]);

  // Debounced push to Firestore (800ms) - triggers when user modified data
  useEffect(() => {
    if (!currentUser || !isDirtyRef.current || isQuotaExceededRef.current) return;
    const timer = setTimeout(() => {
      pushToFirestore();
    }, 800);
    return () => clearTimeout(timer);
  }, [currentUser, pushToFirestore]);

  // Persist local state
  useEffect(() => { localStorage.setItem('mop_active_tab', activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem('mop_tokens', tokens.toString()); }, [tokens]);
  useEffect(() => { localStorage.setItem('mop_points', points.toString()); }, [points]);
  useEffect(() => { localStorage.setItem('mop_streak', streakDays.toString()); }, [streakDays]);
  useEffect(() => { localStorage.setItem('mop_challenges_day', JSON.stringify(challengesByDay)); }, [challengesByDay]);
  useEffect(() => { localStorage.setItem('mop_initial_budget', initialBudgetAmount.toString()); }, [initialBudgetAmount]);
  useEffect(() => { localStorage.setItem('mop_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('mop_calm_journal', JSON.stringify(calmJournal)); }, [calmJournal]);
  useEffect(() => { localStorage.setItem('mop_user_profile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem('mop_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('mop_activities', JSON.stringify(activities)); }, [activities]);
  useEffect(() => { localStorage.setItem('mop_assignments', JSON.stringify(assignments)); }, [assignments]);
  useEffect(() => { localStorage.setItem('mop_school_classes', JSON.stringify(schoolClasses)); }, [schoolClasses]);
  useEffect(() => { localStorage.setItem('mop_grades', JSON.stringify(gradesData)); }, [gradesData]);
  useEffect(() => { localStorage.setItem('mop_rewards', JSON.stringify(rewards)); }, [rewards]);
  useEffect(() => { localStorage.setItem('mop_dreams', JSON.stringify(dreams)); }, [dreams]);
  useEffect(() => { localStorage.setItem('mop_health_log', JSON.stringify(healthLog)); }, [healthLog]);

  // Attitude Challenge toggles
  const toggleChallengeDay = useCallback((dayName: string) => {
    isDirtyRef.current = true;
    setChallengesByDay(prev => {
      const isCurrentlyDone = !!prev[dayName];
      const nextDone = !isCurrentlyDone;
      const challenge = WEEKLY_CHALLENGES[dayName];
      const pts = challenge ? challenge.points : 15;
      
      if (nextDone) {
        setPoints(p => p + pts);
      } else {
        setPoints(p => Math.max(0, p - pts));
      }

      return {
        ...prev,
        [dayName]: nextDone
      };
    });
  }, []);

  // Budget Actions
  const addExpense = useCallback((exp: Omit<ExpenseItem, 'id'>) => {
    isDirtyRef.current = true;
    const newExp: ExpenseItem = normalizeExpense({
      ...exp,
      id: 'exp-' + Date.now()
    });
    setExpenses(prev => {
      const updated = [newExp, ...prev];
      try {
        localStorage.setItem('mop_expenses', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    isDirtyRef.current = true;
    setExpenses(prev => {
      const updated = prev.filter(e => String(e.id) !== String(id) && e.id !== id);
      try {
        localStorage.setItem('mop_expenses', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<ExpenseItem>) => {
    isDirtyRef.current = true;
    setExpenses(prev => {
      const updated = prev.map(e => {
        if (String(e.id) === String(id) || e.id === id) {
          return normalizeExpense({ ...e, ...updates });
        }
        return e;
      });
      try {
        localStorage.setItem('mop_expenses', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Budget Items Actions (INITIAL_BUDGET)
  const toggleBudgetItemPurchased = useCallback((id: number | string) => {
    isDirtyRef.current = true;
    setBudgetItems(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          const nextPurchased = !item.purchased;
          // Si se marca como comprado, registrar también en el historial de gastos
          if (nextPurchased) {
            addExpense({
              description: item.item,
              amount: item.cost,
              category: (item.category as any) || 'Pelo',
              date: getRelativeDateString(0)
            });
          }
          return { ...item, purchased: nextPurchased };
        }
        return item;
      });
      try {
        localStorage.setItem('mop_budget_items', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, [addExpense]);

  const addBudgetItem = useCallback((item: Omit<BudgetItem, 'id'>) => {
    isDirtyRef.current = true;
    const newItem: BudgetItem = {
      ...item,
      id: Date.now()
    };
    setBudgetItems(prev => {
      const updated = [...prev, newItem];
      try {
        localStorage.setItem('mop_budget_items', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Routine Actions (Rutinas Semanales: Levantarse, Comidas, Pantallas, Escuela)
  const toggleRoutineCompletion = useCallback((routineId: string, dateStr?: string) => {
    isDirtyRef.current = true;
    const date = dateStr || getRelativeDateString(0);
    const key = `${date}_${routineId}`;
    setRoutineCompletions(prev => {
      const nextDone = !prev[key];
      const next = { ...prev, [key]: nextDone };
      try {
        localStorage.setItem('mop_routine_completions', JSON.stringify(next));
      } catch (e) {}
      if (nextDone) {
        setPoints(p => p + 5);
        setTokens(t => t + 1);
      }
      return next;
    });
  }, []);

  const addRoutine = useCallback((routineData: Omit<WeeklyRoutineItem, 'id'>) => {
    isDirtyRef.current = true;
    const newRoutine: WeeklyRoutineItem = {
      ...routineData,
      id: `rout-${Date.now()}`
    };
    setRoutines(prev => {
      const updated = [...prev, newRoutine];
      try {
        localStorage.setItem('mop_weekly_routines', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const updateRoutine = useCallback((id: string, updates: Partial<WeeklyRoutineItem>) => {
    isDirtyRef.current = true;
    setRoutines(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      try {
        localStorage.setItem('mop_weekly_routines', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const deleteRoutine = useCallback((id: string) => {
    isDirtyRef.current = true;
    setRoutines(prev => {
      const updated = prev.filter(r => r.id !== id);
      try {
        localStorage.setItem('mop_weekly_routines', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Calm Journal Actions
  const addCalmReflection = useCallback((ref: Omit<CalmReflection, 'id' | 'date'>) => {
    isDirtyRef.current = true;
    const newRef: CalmReflection = {
      ...ref,
      id: 'calm-' + Date.now(),
      date: getRelativeDateString(0)
    };
    setCalmJournal(prev => [newRef, ...prev]);
    setPoints(p => p + 10);
  }, []);

  // Actions for Tasks
  const toggleTask = useCallback((id: string) => {
    isDirtyRef.current = true;
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const isNowDone = !t.completed;
        const now = new Date();
        const timeStr = `Hoy ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (isNowDone) {
          setTokens(tok => tok + 1);
        }
        return {
          ...t,
          completed: isNowDone,
          completedAt: isNowDone ? timeStr : undefined
        };
      }
      return t;
    }));
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'completed'>) => {
    isDirtyRef.current = true;
    const newTask: Task = {
      ...task,
      id: 't-' + Date.now(),
      completed: false
    };
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const deleteTask = useCallback((id: string) => {
    isDirtyRef.current = true;
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  // Actions for Activities / Events
  const toggleActivityCompleted = useCallback((id: string) => {
    isDirtyRef.current = true;
    setActivities(prev => prev.map(act => {
      if (act.id === id) {
        const isNowDone = !act.completed;
        const now = new Date();
        const timeStr = `Hoy ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (isNowDone) {
          setTokens(tok => tok + 2);
        }
        return {
          ...act,
          completed: isNowDone,
          completedAt: isNowDone ? timeStr : undefined
        };
      }
      return act;
    }));
  }, []);

  const markAllPastActivitiesAsCompleted = useCallback(() => {
    isDirtyRef.current = true;
    let completedCount = 0;
    const now = new Date();
    const timeStr = `Hoy ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setActivities(prev => prev.map(act => {
      if (isEventPassed(act) && !act.completed) {
        completedCount++;
        return {
          ...act,
          completed: true,
          completedAt: timeStr
        };
      }
      return act;
    }));

    if (completedCount > 0) {
      setTokens(tok => tok + (completedCount * 2));
    }
  }, []);

  const addActivity = useCallback((act: Omit<Activity, 'id'>) => {
    isDirtyRef.current = true;
    const newAct = normalizeActivity({
      ...act,
      id: 'act-' + Date.now()
    });
    setActivities(prev => [newAct, ...prev]);
  }, []);

  const updateActivity = useCallback((updated: Activity) => {
    isDirtyRef.current = true;
    const norm = normalizeActivity(updated);
    setActivities(prev => prev.map(a => a.id === norm.id ? norm : a));
  }, []);

  const deleteActivity = useCallback((id: string) => {
    isDirtyRef.current = true;
    setActivities(prev => prev.filter(a => a.id !== id));
  }, []);

  // Actions for Assignments
  const toggleAssignment = useCallback((id: string) => {
    isDirtyRef.current = true;
    setAssignments(prev => prev.map(as => {
      if (as.id === id) {
        const isNowDone = !as.completed;
        if (isNowDone) setTokens(tok => tok + 2);
        return { ...as, completed: isNowDone };
      }
      return as;
    }));
  }, []);

  const addAssignment = useCallback((as: Omit<Assignment, 'id' | 'completed'> & { id?: string; completed?: boolean }) => {
    isDirtyRef.current = true;
    const uniqueId = as.id || `as-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newAs: Assignment = {
      ...as,
      id: uniqueId,
      completed: as.completed || false
    };
    setAssignments(prev => {
      // Evitar duplicados por id
      const filtered = prev.filter(item => item.id !== uniqueId);
      return [newAs, ...filtered];
    });
  }, []);

  const deleteAssignment = useCallback((id: string) => {
    isDirtyRef.current = true;
    setAssignments(prev => prev.filter(as => as.id !== id));
  }, []);

  // Actions for Rewards
  const claimReward = useCallback((id: string) => {
    const reward = rewards.find(r => r.id === id);
    if (!reward) return false;
    if (tokens < reward.tokenCost) return false;

    isDirtyRef.current = true;
    setTokens(prev => prev - reward.tokenCost);
    setRewards(prev => prev.map(r => r.id === id ? { ...r, claimedCount: r.claimedCount + 1 } : r));
    return true;
  }, [rewards, tokens]);

  // Actions for Health & Habits
  const drinkWater = useCallback(() => {
    isDirtyRef.current = true;
    setHealthLog(prev => ({
      ...prev,
      waterGlasses: Math.min(prev.waterGlasses + 1, 10)
    }));
    setTokens(tok => tok + 1);
  }, []);

  const resetWater = useCallback(() => {
    isDirtyRef.current = true;
    setHealthLog(prev => ({ ...prev, waterGlasses: 0 }));
  }, []);

  const toggleHealthCheck = useCallback((key: 'stretchedFeet' | 'supportShoesWorn' | 'iceBottleDone') => {
    isDirtyRef.current = true;
    setHealthLog(prev => {
      const nextVal = !prev[key];
      if (nextVal) setTokens(tok => tok + 1);
      return { ...prev, [key]: nextVal };
    });
  }, []);

  // Actions for Dreams / Vision Board
  const toggleDream = useCallback((id: string) => {
    isDirtyRef.current = true;
    setDreams(prev => {
      let toggledToDone = false;
      const updated = prev.map(d => {
        if (String(d.id) === String(id) || d.id === id) {
          const nextCompleted = !Boolean(d.completed);
          if (nextCompleted) {
            toggledToDone = true;
          }
          return { ...d, completed: nextCompleted };
        }
        return d;
      });

      if (toggledToDone) {
        setTokens(tok => tok + 5);
        setPoints(pts => pts + 10);
      }

      try {
        localStorage.setItem('mop_dreams', JSON.stringify(updated));
      } catch (e) {
        console.warn('Error saving mop_dreams to localStorage:', e);
      }
      return updated;
    });
  }, []);

  const updateDream = useCallback((id: string, updates: Partial<DreamItem>) => {
    isDirtyRef.current = true;
    setDreams(prev => {
      const updated = prev.map(d => {
        if (String(d.id) === String(id) || d.id === id) {
          return normalizeDream({ ...d, ...updates });
        }
        return d;
      });
      try {
        localStorage.setItem('mop_dreams', JSON.stringify(updated));
      } catch (e) {
        console.warn('Error saving mop_dreams to localStorage:', e);
      }
      return updated;
    });
  }, []);

  const addDream = useCallback((dream: Omit<DreamItem, 'id'>) => {
    isDirtyRef.current = true;
    const newDream: DreamItem = normalizeDream({
      ...dream,
      id: 'd-' + Date.now()
    });
    setDreams(prev => {
      const updated = [newDream, ...prev];
      try {
        localStorage.setItem('mop_dreams', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const deleteDream = useCallback((id: string) => {
    isDirtyRef.current = true;
    setDreams(prev => {
      const updated = prev.filter(d => String(d.id) !== String(id) && d.id !== id);
      try {
        localStorage.setItem('mop_dreams', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Action for User Profile
  const updateUserProfile = useCallback((updates: Partial<typeof userProfile>) => {
    isDirtyRef.current = true;
    setUserProfile((prev: any) => {
      const updated = {
        ...prev,
        ...updates
      };
      try {
        localStorage.setItem('mop_user_profile', JSON.stringify(updated));
        if (updated.schoolAccessUsername) localStorage.setItem('sa_saved_user', updated.schoolAccessUsername);
        if (updated.schoolAccessPassword) localStorage.setItem('sa_saved_pass', updated.schoolAccessPassword);
      } catch (e) {}
      return updated;
    });
  }, []);

  const updateSchoolClasses = useCallback((classes: SchoolClass[]) => {
    isDirtyRef.current = true;
    setSchoolClasses(classes);
    try {
      localStorage.setItem('mop_school_classes', JSON.stringify(classes));
    } catch (e) {}
  }, []);

  const updateGradesData = useCallback((data: SchoolGradesData) => {
    isDirtyRef.current = true;
    const isMeta = (t: string = '') => {
      const clean = t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      if (!clean) return true;
      if (clean.includes('espanol')) return false;
      return clean.includes('codigo') || clean.includes('cedula') || clean.includes('nombre') ||
             clean.includes('grado') || clean.includes('ano lectivo') || clean.startsWith('ano ') || clean === 'ano' ||
             clean.includes('seccion') || clean.includes('seleccionar') || clean.includes('boletin') ||
             clean.includes('estudiante') || clean.includes('materia') || clean.includes('asignatura') ||
             clean.includes('promedio') || clean.includes('periodo') || clean.includes('condicion');
    };
    const cleaned: SchoolGradesData = {
      ...data,
      grades: Array.isArray(data?.grades) ? data.grades.filter(g => g && g.subject && !isMeta(g.subject)) : []
    };
    setGradesData(cleaned);
    try {
      localStorage.setItem('mop_grades', JSON.stringify(cleaned));
    } catch (e) {}
  }, []);

  // Filtrado de asignaciones y tareas exclusivamente para la semana en curso (Lunes a Domingo)
  const currentWeekAssignments = useMemo(() => {
    return filterTasksByCurrentWeek(assignments);
  }, [assignments]);

  const currentWeekTasks = useMemo(() => {
    return tasks.filter(t => !t.dueDate || isDateInCurrentWeek(t.dueDate));
  }, [tasks]);

  const getWeekAssignments = useCallback((refDate?: Date) => {
    return filterTasksByCurrentWeek(assignments, refDate);
  }, [assignments]);

  const pastUncompletedCount = activities.filter(act => isEventPassed(act) && !act.completed).length;

  const clearAllUserDataAndLogout = useCallback(async () => {
    isDirtyRef.current = false;
    try {
      await logoutUser();
    } catch (e) {}

    const keysToRemove = [
      'mop_user_profile',
      'mop_tasks',
      'mop_assignments',
      'mop_activities',
      'mop_appointments',
      'mop_tokens',
      'mop_points',
      'mop_expenses',
      'mop_initial_budget',
      'mop_calm_journal',
      'mop_health_log',
      'mop_rewards',
      'mop_dreams',
      'mop_school_classes',
      'mop_grades',
      'sa_saved_user',
      'sa_saved_pass',
      'sa_remember_creds'
    ];

    for (const k of keysToRemove) {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    }

    setUserProfile({
      name: '',
      schoolGrade: '',
      studentCode: '',
      schoolGroup: '',
      schoolAccessUsername: '',
      schoolAccessPassword: '',
      activeHealthHabit: '',
      favoriteVerse: ''
    });
    setTasks([]);
    setAssignments([]);
    setActivities([]);
    setTokens(0);
    setPoints(0);
    setExpenses([]);
    setInitialBudgetAmount(0);
    setCalmJournal([]);
    setHealthLog({
      waterGlasses: 0,
      stretchedFeet: false,
      supportShoesWorn: false,
      iceBottleDone: false,
      notes: ''
    });
    setRewards(INITIAL_REWARDS);
    setDreams([]);
    setSchoolClasses([]);
    setGradesData({ grades: [], habits: [], attendance: [], observations: [] });
    setCurrentUser(null);
    setSyncStatus('offline');
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      if (currentUser && isDirtyRef.current) {
        const activeDocRef = doc(db, 'users', currentUser.uid, 'data', activeFirestoreDocId.current);
        await setDoc(activeDocRef, {
          userProfile,
          tasks,
          activities,
          appointments: activities,
          tokens,
          points,
          streakDays,
          expenses,
          budget: expenses,
          budgetItems,
          initialBudgetAmount,
          challengesByDay,
          routines,
          routineCompletions,
          calmJournal,
          healthLog,
          healthAlerts: healthLog,
          dreams,
          visionBoard: dreams,
          rewards,
          schoolClasses,
          assignments,
          gradesData,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (e) {
      console.warn('Error saving before logout:', e);
    }

    const keysToRemove = [
      'mop_user_profile', 'mop_tasks', 'mop_assignments', 'mop_activities',
      'mop_appointments', 'mop_tokens', 'mop_points', 'mop_streak', 'mop_expenses',
      'mop_initial_budget', 'mop_budget_items', 'mop_weekly_routines',
      'mop_routine_completions', 'mop_challenges_day', 'mop_calm_journal',
      'mop_health_log', 'mop_rewards', 'mop_dreams', 'mop_school_classes',
      'mop_grades', 'sa_saved_user', 'sa_saved_pass', 'sa_remember_creds'
    ];

    for (const k of keysToRemove) {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    }

    isDirtyRef.current = false;

    setUserProfile({
      name: '',
      schoolGrade: '',
      studentCode: '',
      schoolGroup: '',
      schoolAccessUsername: '',
      schoolAccessPassword: '',
      activeHealthHabit: '',
      favoriteVerse: ''
    });
    setTasks([]);
    setAssignments([]);
    setActivities([]);
    setTokens(0);
    setPoints(0);
    setStreakDays(0);
    setExpenses([]);
    setBudgetItems([]);
    setRoutines([]);
    setRoutineCompletions({});
    setInitialBudgetAmount(0);
    setCalmJournal([]);
    setHealthLog({
      waterGlasses: 0,
      stretchedFeet: false,
      supportShoesWorn: false,
      iceBottleDone: false,
      notes: ''
    });
    setRewards([]);
    setDreams([]);
    setSchoolClasses([]);
    setGradesData({ grades: [], habits: [], attendance: [], observations: [] });
    setCurrentUser(null);
    setSyncStatus('offline');

    try {
      await logoutUser();
    } catch (e) {}
  }, [currentUser, userProfile, tasks, activities, tokens, points, streakDays, expenses, budgetItems, initialBudgetAmount, challengesByDay, routines, routineCompletions, calmJournal, healthLog, dreams, rewards, schoolClasses, assignments, gradesData]);

  return {
    activeTab, setActiveTab,
    currentUser, authLoading, syncStatus, 
    loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, logoutUser, handleLogout, clearAllUserDataAndLogout,
    tokens, setTokens,
    points, setPoints,
    challengesByDay, toggleChallengeDay,
    streakDays, setStreakDays,
    userProfile, setUserProfile, updateUserProfile,
    initialBudgetAmount, setInitialBudgetAmount,
    expenses, addExpense, updateExpense, deleteExpense,
    budgetItems, setBudgetItems, toggleBudgetItemPurchased, addBudgetItem,
    routines, setRoutines, routineCompletions, toggleRoutineCompletion, addRoutine, updateRoutine, deleteRoutine,
    calmJournal, addCalmReflection,
    tasks, toggleTask, addTask, deleteTask,
    activities, toggleActivityCompleted, markAllPastActivitiesAsCompleted, addActivity, updateActivity, deleteActivity,
    pastUncompletedCount,
    schoolClasses, updateSchoolClasses, setSchoolClasses,
    gradesData, updateGradesData, setGradesData,
    assignments, toggleAssignment, addAssignment, deleteAssignment,
    currentWeekAssignments,
    currentWeekTasks,
    filterTasksByCurrentWeek,
    isDateInCurrentWeek,
    getCurrentWeekRange,
    getWeekAssignments,
    rewards, claimReward,
    dreams, setDreams, toggleDream, updateDream, addDream, deleteDream,
    healthLog, drinkWater, resetWater, toggleHealthCheck,
    bibleVerses: BIBLE_VERSES
  };
}
