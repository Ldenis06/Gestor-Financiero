import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  query,
  orderBy
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { Transaction, MonthSummary } from './types';
import Login from './components/Login';
import Header, { MESES } from './components/Header';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import GoogleDriveModal from './components/GoogleDriveModal';
import MarketTicker from './components/MarketTicker';
import ConversorRapido from './components/ConversorRapido';
import CalculadoraCuotas from './components/CalculadoraCuotas';
import { ShieldCheck, Download, Trash2, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const [hideBalances, setHideBalances] = useState<boolean>(() => {
    const saved = localStorage.getItem('hideBalances');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('hideBalances', hideBalances ? 'true' : 'false');
  }, [hideBalances]);

  const toggleHideBalances = () => setHideBalances(prev => !prev);
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        console.warn("Test connection skipped / failed:", error);
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }
    setTransactionsLoading(true);
    const transactionsRef = collection(db, 'users', user.uid, 'transactions');
    const q = query(transactionsRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        list.push({
          id: docSnapshot.id,
          fecha: data.fecha,
          categoria: data.categoria,
          monto: Number(data.monto),
          motivo: data.motivo,
          createdAt: data.createdAt,
          uid: data.uid
        });
      });
      setTransactions(list);
      setTransactionsLoading(false);
    }, (error) => {
      console.error("Error fetching transactions:", error);
      setTransactionsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const getMonthYearFromDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10) - 1
    };
  };

  const calculateSummary = (): MonthSummary => {
    let plataInicial = 0;
    let ingresoReal = 0;
    let ingresos = 0;
    let gastos = 0;
    let inversiones = 0;
    let efectivo = 0;

    transactions.forEach((t) => {
      const { year, month } = getMonthYearFromDate(t.fecha);
      const esAnterior = (year < selectedYear) || (year === selectedYear && month < selectedMonth);
      const esEsteMes = (year === selectedYear && month === selectedMonth);

      if (esAnterior) {
        if (t.categoria === 'Ingreso') plataInicial += t.monto;
        if (t.categoria === 'Gasto') plataInicial -= t.monto;
        if (t.categoria === 'Inversion') plataInicial -= t.monto;
        if (t.categoria === 'Ef+') plataInicial += t.monto;
        if (t.categoria === 'Ef-') plataInicial -= t.monto;
      }

      if (esEsteMes) {
        if (t.categoria === 'Ingreso') {
          ingresoReal += t.monto;
          ingresos += t.monto;
        }
        if (t.categoria === 'Gasto') gastos += t.monto;
        if (t.categoria === 'Inversion') inversiones += t.monto;
        if (t.categoria === 'Ef+') {
          ingresos += t.monto;
          efectivo += t.monto;
        }
        if (t.categoria === 'Ef-') efectivo -= t.monto;
      }
    });

    const dineroEnCuenta = plataInicial + ingresoReal - gastos - inversiones;
    const totalActual = dineroEnCuenta + efectivo;

    return {
      plataInicial,
      ingresos,
      gastos,
      inversiones,
      dineroEnCuenta,
      efectivo,
      totalActual
    };
  };

  const summary = calculateSummary();

  const handleAddTransaction = async (data: {
    fecha: string;
    categoria: 'Ingreso' | 'Gasto' | 'Inversion' | 'Ef+' | 'Ef-';
    monto: number;
    motivo: string;
  }) => {
    if (!user) return;
    if (data.categoria === 'Ef-' && data.monto > summary.efectivo) {
      alert(`No podés retirar $${data.monto.toLocaleString('es-AR')} en efectivo porque solo tenés $${summary.efectivo.toLocaleString('es-AR')} disponibles.`);
      return;
    }
    if ((data.categoria === 'Gasto' || data.categoria === 'Inversion') && data.monto > summary.dineroEnCuenta) {
      alert(`No podés registrar $${data.monto.toLocaleString('es-AR')} porque solo tenés $${summary.dineroEnCuenta.toLocaleString('es-AR')} disponibles.`);
      return;
    }
    const newTx = {
      ...data,
      createdAt: Date.now(),
      uid: user.uid
    };
    try {
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      await addDoc(transactionsRef, newTx);
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      const txRef = doc(db, 'users', user.uid, 'transactions', id);
      await deleteDoc(txRef);
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const handleExportJSON = () => {
    const thisMonthTxs = transactions.filter((t) => {
      const { year, month } = getMonthYearFromDate(t.fecha);
      return year === selectedYear && month === selectedMonth;
    });
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(thisMonthTxs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `finanzas_${MESES[selectedMonth]}_${selectedYear}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleClearMonth = async () => {
    if (!user) return;
    const thisMonthTxs = transactions.filter((t) => {
      const { year, month } = getMonthYearFromDate(t.fecha);
      return year === selectedYear && month === selectedMonth;
    });
    if (thisMonthTxs.length === 0) {
      alert("No hay transacciones para borrar.");
      return;
    }
    if (confirm(`¿Borrar ${thisMonthTxs.length} registros de ${MESES[selectedMonth]} ${selectedYear}?`)) {
      for (const tx of thisMonthTxs) {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'transactions', tx.id));
        } catch (error) {
          console.error("Error deleting:", error);
        }
      }
    }
  };

  const handleImportTransactions = async (imported: Transaction[], mergeMode: 'overwrite' | 'merge') => {
    if (!user) return;
    try {
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      if (mergeMode === 'overwrite') {
        for (const tx of transactions) {
          await deleteDoc(doc(db, 'users', user.uid, 'transactions', tx.id));
        }
      }
      for (const impTx of imported) {
        if (mergeMode === 'merge') {
          const alreadyExists = transactions.some(
            (t) => t.fecha === impTx.fecha && t.categoria === impTx.categoria && t.monto === impTx.monto && t.motivo === impTx.motivo
          );
          if (alreadyExists) continue;
        }
        const newTx = {
          fecha: impTx.fecha,
          categoria: impTx.categoria,
          monto: Number(impTx.monto),
          motivo: impTx.motivo || '',
          createdAt: impTx.createdAt || Date.now(),
          uid: user.uid
        };
        await addDoc(transactionsRef, newTx);
      }
    } catch (error) {
      console.error("Error importing:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-slate-500 font-sans">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={(token) => { if (token) setDriveToken(token); }} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />;
  }

  const activeMonthTransactions = transactions.filter((t) => {
    const { year, month } = getMonthYearFromDate(t.fecha);
    return year === selectedYear && month === selectedMonth;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-200">
<div className="sticky top-0 z-50 bg-slate-50 dark:bg-slate-950">
  <MarketTicker />

  <Header
    user={user}
    selectedMonth={selectedMonth}
    selectedYear={selectedYear}
    onMonthChange={setSelectedMonth}
    onYearChange={setSelectedYear}
    onLogout={handleLogout}
    darkMode={darkMode}
    onToggleDarkMode={toggleDarkMode}
    hideBalances={hideBalances}
    onToggleHideBalances={toggleHideBalances}
  />
</div>

<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-colors duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">¡Hola, {user.displayName || 'Invitado'}!</h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{MESES[selectedMonth]} de {selectedYear}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setIsDriveModalOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 border border-blue-200 dark:border-blue-900/40 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg text-[10px] font-bold text-blue-600 dark:text-blue-450 transition cursor-pointer"><Cloud className="w-3 h-3" /><span>DRIVE</span></button>
            <button onClick={handleExportJSON} className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"><Download className="w-3 h-3" /><span>EXPORTAR</span></button>
            <button onClick={handleClearMonth} className="flex items-center gap-1 px-2.5 py-1.5 border border-rose-100 dark:border-rose-950/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-[10px] font-bold text-rose-600 dark:text-rose-400 transition cursor-pointer"><Trash2 className="w-3 h-3" /><span>LIMPIAR</span></button>
          </div>
        </div>
        <Dashboard summary={summary} hideBalances={hideBalances} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 space-y-4">
            <TransactionForm onAddTransaction={handleAddTransaction} selectedMonth={selectedMonth} selectedYear={selectedYear} />
            <CalculadoraCuotas />
            <ConversorRapido />
          </div>
          <div className="lg:col-span-8">
            <TransactionList transactions={activeMonthTransactions} onDeleteTransaction={handleDeleteTransaction} loading={transactionsLoading} hideBalances={hideBalances} />
          </div>
        </div>
      </main>
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 mt-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-0.5">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">Mi Gestor Financiero © {new Date().getFullYear()}</p>
        </div>
      </footer>
      <AnimatePresence>
        {isDriveModalOpen && (
          <GoogleDriveModal isOpen={isDriveModalOpen} onClose={() => setIsDriveModalOpen(false)} transactions={transactions} onImportTransactions={handleImportTransactions} currentMonthName={MESES[selectedMonth]} currentYear={selectedYear} driveToken={driveToken} onSetDriveToken={setDriveToken} />
        )}
      </AnimatePresence>
    </div>
  );
}
export { App };
