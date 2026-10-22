export interface Task {
  id: string;
  title: string;
  category: 'Escuela' | 'Hogar' | 'Salud' | 'Personal';
  priority: 'Alta' | 'Media' | 'Baja';
  completed: boolean;
  completedAt?: string;
  dueDate?: string;
  notes?: string;
}

export type ActivityType = 'Creativos & Paseos' | 'Competiciones' | 'Salud & Clases' | 'Social' | 'Familia';

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  location?: string;
  notes?: string;
  completed: boolean;
  completedAt?: string;
  icon?: string;
}

export interface SchoolClass {
  id: string;
  day: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';
  time: string;
  subject: string;
  classroom: string;
  teacher: string;
  color: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: 'Alta' | 'Media' | 'Baja';
  completed: boolean;
  notes?: string;
  source?: string;
}

export interface DreamItem {
  id: string;
  title: string;
  category: 'Metas' | 'Viajes' | 'Inspiración' | 'Habilidades';
  imageUrl: string;
  description: string;
  completed: boolean;
}

export interface RewardItem {
  id: string;
  title: string;
  tokenCost: number;
  description: string;
  icon: string;
  claimedCount: number;
}

export interface BibleVerse {
  reference: string;
  text: string;
  theme: string;
}

export interface HealthLog {
  waterGlasses: number;
  stretchedFeet: boolean;
  supportShoesWorn: boolean;
  iceBottleDone: boolean;
  notes: string;
}

// Presupuesto y Gastos detallados
export type ExpenseCategory = 'Pelo' | 'Aseo Personal' | 'Materiales Escolares' | 'Salud & Cuidado' | 'Paseos & Meriendas' | 'Ahorro & Metas' | 'Otros';

export interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
}

export interface BudgetItem {
  id: number | string;
  category: string;
  item: string;
  cost: number;
  date: string;
  purchased: boolean;
}

export interface WeeklyRoutineItem {
  id: string;
  time: string;
  title: string;
  category: 'levantarse' | 'colegio' | 'comida' | 'pantalla' | 'estudio' | 'salud' | 'dormir';
  days: ('Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo')[];
  description: string;
  icon?: string;
  completedDays?: Record<string, boolean>;
}

// Desafío de Actitud Diaria (Puntos)
export interface AttitudeChallenge {
  day: string;
  title: string;
  description: string;
  points: number;
}

// Registro emocional y Rincón de Calma
export interface CalmReflection {
  id: string;
  date: string;
  mood: 'radiante' | 'tranquila' | 'pensativa' | 'con dudas' | 'estresada';
  gratitude: string;
  achievement: string;
}

export interface UserProfile {
  name: string;
  schoolGrade: string;
  studentCode?: string;
  schoolGroup?: string;
  schoolAccessUsername?: string;
  schoolAccessPassword?: string;
  activeHealthHabit: string;
  favoriteVerse: string;
}

export interface ReportCardGrade {
  subject: string;
  period1?: number | string;
  period2?: number | string;
  period3?: number | string;
  period4?: number | string;
  finalAverage?: number | string;
  q1?: string;
  q2?: string;
  q3?: string;
  final?: string;
  status?: string;
  teacher?: string;
}

export interface HabitEvaluation {
  habit: string;
  name?: string;
  evaluation?: string;
  category?: string;
  p1?: string;
  p2?: string;
  p3?: string;
  p4?: string;
}

export interface AttendanceRecord {
  totalSchoolDays: number;
  attendedDays: number;
  justifiedAbsences: number;
  unjustifiedAbsences: number;
  tardinessCount: number;
  attendancePercentage: number;
}

export interface TeacherObservation {
  dateOrPeriod: string;
  author: string;
  comment: string;
}

export interface StudentProfileData {
  name?: string;
  studentCode?: string;
  cedula?: string;
  schoolGrade?: string;
  academicYear?: string;
}

export interface SchoolReportCard {
  studentName?: string;
  studentCode?: string;
  groupName?: string;
  academicYear?: string;
  studentProfile?: StudentProfileData;
  grades: ReportCardGrade[];
  habits: HabitEvaluation[];
  attendance: AttendanceRecord;
  observations: TeacherObservation[];
}

export interface SchoolScheduleSlot {
  time: string;
  monday?: { subject: string; teacher?: string; room?: string };
  tuesday?: { subject: string; teacher?: string; room?: string };
  wednesday?: { subject: string; teacher?: string; room?: string };
  thursday?: { subject: string; teacher?: string; room?: string };
  friday?: { subject: string; teacher?: string; room?: string };
}

// NUEVAS INTERFACES PARA BOLETÍN
export interface GradeItem {
  subject: string;
  q1?: string;
  q2?: string;
  q3?: string;
  period1?: string;
  period2?: string;
  period3?: string;
  period4?: string;
  final?: string;
  finalAverage?: string;
  status?: string;
  teacher?: string;
}

export interface SchoolGradesData {
  studentProfile?: StudentProfileData;
  grades: GradeItem[];
  habits: { name?: string; habit?: string; evaluation?: string; p1?: string; p2?: string; p3?: string; p4?: string; category?: string }[];
  attendance: { type: string; count: string }[];
  observations: (string | TeacherObservation)[];
}
