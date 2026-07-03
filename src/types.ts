export interface Transaction {
  id: string;
  fecha: string; // Format: YYYY-MM-DD
  categoria: 'Ingreso' | 'Gasto' | 'Inversion' | 'Ef+' | 'Ef-';
  monto: number;
  motivo: string;
  createdAt: number;
  uid: string;
}

export interface MonthSummary {
  plataInicial: number;
  ingresos: number;
  gastos: number;
  inversiones: number;
  dineroEnCuenta: number; // plataInicial + ingresos - gastos - inversiones (only bank / non-cash entries)
  efectivo: number; // sum of Ef+ minus Ef- up to the selected month
  totalActual: number; // dineroEnCuenta + efectivo
}
