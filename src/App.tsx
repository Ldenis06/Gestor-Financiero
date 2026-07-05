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
import { Sparkles, Info, ArrowUpRight, ShieldCheck, Download, Trash2, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Google Drive scopes token and modal state
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Dark mode state with localStorage persistence
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

  // Ocultar/mostrar montos (como el "ojito" de las apps de bancos), con persistencia
  const [hideBalances, setHideBalances] = useState<boolean>(() => {
    const saved = localStorage.getItem('hideBalances');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('hideBalances', hideBalances ? 'true' : 'false');
  }, [hideBalances]);

  const toggleHideBalances = () => setHideBalances(prev => !prev);

  // Set default selected month/year to today's month/year
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  // 1. Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Validate connection to Firestore on initial boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        } else {
          console.warn("Test connection skipped / failed under current rules:", error);
        }
      }
    }
    testConnection();
  }, []);

  // 3. Realtime Firestore listener for logged in user's transactions
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    setTransactionsLoading(true);
    const path = `users/${user.uid}/transactions`;
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
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [user]);

  // Helper: get month & year from date string (YYYY-MM-DD)
  const getMonthYearFromDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10) - 1
    };
  };

  // 4. Calculations based on active selectedMonth and selectedYear
  const calculateSummary = (): MonthSummary => {
    let plataInicial = 0;
    let ingresos = 0;
    let gastos = 0;
    let inversiones = 0;
    let efectivo = 0;

    transactions.forEach((t) => {
      const { year, month } = getMonthYearFromDate(t.fecha);

      // Check if transaction date is strictly BEFORE the selected month/year
      const esAnterior = (year < selectedYear) || (year === selectedYear && month < selectedMonth);
      // Check if transaction date is in the CURRENT selected month/year
      const esEsteMes = (year === selectedYear && month === selectedMonth);
      // Check if transaction date is up to the current selected month/year
      const esHastaEsteMes = (year < selectedYear) || (year === selectedYear && month <= selectedMonth);

      // Plata inicial calculations (Income - Expense - Investment from previous periods)
      if (esAnterior) {
        if (t.categoria === 'Ingreso') plataInicial += t.monto;
        if (t.categoria === 'Gasto') plataInicial -= t.monto;
        if (t.categoria === 'Inversion') plataInicial -= t.monto;
      }

      // Selected month statistics
      if (esEsteMes) {
        if (t.categoria === 'Ingreso') ingresos += t.monto;
        if (t.categoria === 'Gasto') gastos += t.monto;
        if (t.categoria === 'Inversion') inversiones += t.monto;
      }

      // Cash balance calculation (all-time Ef+ minus Ef- up to the selected month)
      if (esHastaEsteMes) {
        if (t.categoria === 'Ef+') efectivo += t.monto;
        if (t.categoria === 'Ef-') efectivo -= t.monto;
      }
    });

    const dineroEnCuenta = plataInicial + ingresos - gastos - inversiones;
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

  // 5. Actions: Add transaction
  const handleAddTransaction = async (data: {
    fecha: string;
    categoria: 'Ingreso' | 'Gasto' | 'Inversion' | 'Ef+' | 'Ef-';
    monto: number;
    motivo: string;
  }) => {
    if (!user) return;

    const newTx = {
      ...data,
      createdAt: Date.now(),
      uid: user.uid
    };

    const path = `users/${user.uid}/transactions`;
    try {
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      await addDoc(transactionsRef, newTx);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  // 6. Actions: Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/transactions/${id}`;
    try {
      const txRef = doc(db, 'users', user.uid, 'transactions', id);
      await deleteDoc(txRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  // 7. Action: Export current month as JSON Backup
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

  // 8. Action: Clear all transactions in selected month with confirmation
  const handleClearMonth = async () => {
    if (!user) return;
    const thisMonthTxs = transactions.filter((t) => {
      const { year, month } = getMonthYearFromDate(t.fecha);
      return year === selectedYear && month === selectedMonth;
    });

    if (thisMonthTxs.length === 0) {
      alert("No hay transacciones registradas en este mes para borrar.");
      return;
    }

    if (confirm(`¿ATENCIÓN! Estás seguro de borrar los ${thisMonthTxs.length} registros del mes de ${MESES[selectedMonth]} de ${selectedYear}? Esta acción no se puede deshacer.`)) {
      for (const tx of thisMonthTxs) {
        const path = `users/${user.uid}/transactions/${tx.id}`;
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'transactions', tx.id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, path);
        }
      }
    }
  };

  // 9. Action: Import transactions from backup (Overwrite or Merge)
  const handleImportTransactions = async (imported: Transaction[], mergeMode: 'overwrite' | 'merge') => {
    if (!user) return;

    const path = `users/${user.uid}/transactions`;
    try {
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');

      if (mergeMode === 'overwrite') {
        // Delete all current records
        for (const tx of transactions) {
          const deletePath = `users/${user.uid}/transactions/${tx.id}`;
          await deleteDoc(doc(db, 'users', user.uid, 'transactions', tx.id));
        }
      }

      // Add the imported items
      for (const impTx of imported) {
        if (mergeMode === 'merge') {
          // Check for exact duplicate: same date, category, amount, and description
          const alreadyExists = transactions.some(
            (t) => t.fecha === impTx.fecha &&
                   t.categoria === impTx.categoria &&
                   t.monto === impTx.monto &&
                   t.motivo === impTx.motivo
          );
          if (alreadyExists) {
            continue; // Skip exact matches
          }
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
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // Render auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-slate-500 font-sans">Iniciando aplicación segura...</p>
        </div>
      </div>
    );
  }

  // Render login screen if no user is signed in
  if (!user) {
    return (
      <Login
        onLoginSuccess={(token) => {
          if (token) {
            setDriveToken(token);
          }
        }}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />
    );
  }

  // Filter transactions belonging only to the selected month & year for list rendering
  const activeMonthTransactions = transactions.filter((t) => {
    const { year, month } = getMonthYearFromDate(t.fecha);
    return year === selectedYear && month === selectedMonth;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* Cinta de precios de mercado (dólar y cripto) */}
      <MarketTicker />

      {/* Header component */}
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* User Welcome Banner */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-colors duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                ¡Hola, {user.displayName || 'Invitado'}!
              </h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Estás viendo tus registros para <span className="font-semibold text-slate-600 dark:text-slate-300">{MESES[selectedMonth]} de {selectedYear}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {/* Google Drive Backup & Restore Button */}
            <button
              onClick={() => setIsDriveModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-blue-200 dark:border-blue-900/40 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg text-[10px] font-bold text-blue-600 dark:text-blue-450 transition cursor-pointer"
              title="Copia de seguridad y restauración con Google Drive"
            >
              <Cloud className="w-3 h-3" />
              <span>GOOGLE DRIVE</span>
            </button>

            {/* Export JSON Button */}
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Descargar copia de seguridad mensual"
            >
              <Download className="w-3 h-3" />
              <span>EXPORTAR MES</span>
            </button>

            {/* Clear Month Button */}
            <button
              onClick={handleClearMonth}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-rose-100 dark:border-rose-950/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-[10px] font-bold text-rose-600 dark:text-rose-400 transition cursor-pointer"
              title="Borrar todos los registros de este mes"
            >
              <Trash2 className="w-3 h-3" />
              <span>LIMPIAR MES</span>
            </button>
          </div>
        </div>

        {/* Dashboard displays all calculated totals */}
        <Dashboard summary={summary} hideBalances={hideBalances} />

        {/* Two column layout: Form & List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Input Form (colspan 4) */}
          <div className="lg:col-span-4 space-y-4">
            <TransactionForm
              onAddTransaction={handleAddTransaction}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />

            {/* Informative Help Card */}
            <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 shadow-3xs transition-colors duration-200">
              <div className="flex gap-2">
                <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                    ¿Cómo funciona la Plata Inicial?
                  </h4>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-normal font-sans">
                    La <strong>Plata Inicial</strong> se calcula automáticamente sumando todos tus ingresos y restando todos tus gastos e inversiones de los meses anteriores.
                  </p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-normal font-sans">
                    Esto asegura que los fondos sobrantes de cada mes se trasladen de forma automática al mes siguiente. ¡Prueba a cambiar de mes para ver el efecto!
                  </p>
                </div>
              </div>
            </div>

            {/* Conversor rápido de monedas */}
            <ConversorRapido />

            {/* Calculadora de cuotas */}
            <CalculadoraCuotas />
          </div>

          {/* Right Column: List & Filter (colspan 8) */}
          <div className="lg:col-span-8">
            <TransactionList
              transactions={activeMonthTransactions}
              onDeleteTransaction={handleDeleteTransaction}
              loading={transactionsLoading}
              hideBalances={hideBalances}
            />
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 mt-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-0.5">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">
            Mi Gestor Financiero © {new Date().getFullYear()} — Base de datos sincronizada de forma segura en Google Cloud Firestore.
          </p>
          <p className="text-[9px] text-slate-300 dark:text-slate-600 font-mono">
            ID de la Base de Datos: {db.app.options.projectId}
          </p>
        </div>
      </footer>

      {/* Google Drive modal for backup management */}
      <AnimatePresence>
        {isDriveModalOpen && (
          <GoogleDriveModal
            isOpen={isDriveModalOpen}
            onClose={() => setIsDriveModalOpen(false)}
            transactions={transactions}
            onImportTransactions={handleImportTransactions}
            currentMonthName={MESES[selectedMonth]}
            currentYear={selectedYear}
            driveToken={driveToken}
            onSetDriveToken={setDriveToken}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
export { App };
