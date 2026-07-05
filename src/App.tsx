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
    document.body.appendChild(downloadAnchor
