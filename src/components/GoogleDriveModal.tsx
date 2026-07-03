import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, provider } from '../firebase';
import { 
  Cloud, 
  CloudOff, 
  X, 
  RefreshCw, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  FolderOpen, 
  FileText,
  HelpCircle,
  Database,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction } from '../types';
import { 
  findOrCreateBackupFolder, 
  uploadBackupFile, 
  listBackupFiles, 
  downloadBackupFile, 
  deleteBackupFile, 
  DriveBackupFile 
} from '../lib/googleDriveService';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onImportTransactions: (imported: Transaction[], mergeMode: 'overwrite' | 'merge') => Promise<void>;
  currentMonthName: string;
  currentYear: number;
  driveToken: string | null;
  onSetDriveToken: (token: string | null) => void;
}

export default function GoogleDriveModal({
  isOpen,
  onClose,
  transactions,
  onImportTransactions,
  currentMonthName,
  currentYear,
  driveToken,
  onSetDriveToken
}: GoogleDriveModalProps) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // tracks specific file action
  const [folderId, setFolderId] = useState<string | null>(null);
  const [backups, setBackups] = useState<DriveBackupFile[]>([]);
  const [backupScope, setBackupScope] = useState<'all' | 'month'>('all');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Restore flow confirmation dialog state
  const [pendingRestore, setPendingRestore] = useState<{
    file: DriveBackupFile;
    data: Transaction[];
  } | null>(null);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('merge');

  // Trigger loading folder and backup list when token is available
  useEffect(() => {
    if (isOpen && driveToken) {
      loadDriveData();
    } else {
      // Clear alerts/states on close
      setStatusMessage(null);
      setPendingRestore(null);
    }
  }, [isOpen, driveToken]);

  const loadDriveData = async () => {
    if (!driveToken) return;
    setLoading(true);
    setStatusMessage(null);
    try {
      const fId = await findOrCreateBackupFolder(driveToken);
      setFolderId(fId);
      const list = await listBackupFiles(driveToken, fId);
      setBackups(list);
    } catch (error: any) {
      console.error(error);
      setStatusMessage({
        text: 'Error al conectar con Google Drive. Por favor, vuelve a vincular tu cuenta.',
        type: 'error'
      });
      // Token might be expired
      onSetDriveToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectDrive = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        onSetDriveToken(credential.accessToken);
        setStatusMessage({
          text: '¡Conexión con Google Drive establecida correctamente!',
          type: 'success'
        });
      } else {
        throw new Error('No se recibió un token de acceso válido de Google.');
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/popup-blocked') {
        setStatusMessage({
          text: 'La ventana emergente de inicio de sesión fue bloqueada. Habilítala para conectar tu cuenta.',
          type: 'error'
        });
      } else {
        setStatusMessage({
          text: 'Error al iniciar sesión con Google para Google Drive.',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!driveToken || !folderId) return;
    
    // Filter data according to scope
    let dataToBackup = [...transactions];
    let filenameSuffix = 'historial_completo';

    if (backupScope === 'month') {
      const MESES_MAP = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      const monthIndex = MESES_MAP.indexOf(currentMonthName);
      
      dataToBackup = transactions.filter((t) => {
        const parts = t.fecha.split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        return y === currentYear && m === monthIndex;
      });
      filenameSuffix = `${currentMonthName.toLowerCase()}_${currentYear}`;
    }

    if (dataToBackup.length === 0) {
      setStatusMessage({
        text: 'No hay transacciones registradas para realizar el respaldo seleccionado.',
        type: 'info'
      });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
    const filename = `finanzas_${filenameSuffix}_${dateStr}_${timeStr}.json`;

    try {
      const content = JSON.stringify(dataToBackup, null, 2);
      await uploadBackupFile(driveToken, filename, content, folderId);
      
      setStatusMessage({
        text: `Copia de seguridad "${filename}" guardada con éxito en Google Drive.`,
        type: 'success'
      });
      
      // Refresh list
      const list = await listBackupFiles(driveToken, folderId);
      setBackups(list);
    } catch (error: any) {
      console.error(error);
      setStatusMessage({
        text: 'Error al guardar la copia de seguridad. Revisa la conexión de red.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartRestore = async (file: DriveBackupFile) => {
    if (!driveToken) return;
    setActionLoading(file.id);
    setStatusMessage(null);
    try {
      const data = await downloadBackupFile(driveToken, file.id);
      
      // Validate backup content structure
      if (!Array.isArray(data)) {
        throw new Error('El archivo de respaldo no es válido. Debe ser una lista de transacciones.');
      }
      
      setPendingRestore({ file, data });
    } catch (error: any) {
      console.error(error);
      setStatusMessage({
        text: 'No se pudo descargar o validar la copia de seguridad.',
        type: 'error'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;
    setLoading(true);
    setStatusMessage(null);
    try {
      await onImportTransactions(pendingRestore.data, restoreMode);
      setStatusMessage({
        text: `Se importaron correctamente las ${pendingRestore.data.length} transacciones de la copia "${pendingRestore.file.name}".`,
        type: 'success'
      });
      setPendingRestore(null);
    } catch (error: any) {
      console.error(error);
      setStatusMessage({
        text: 'Ocurrió un error al importar los registros en la base de datos.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (file: DriveBackupFile) => {
    if (!driveToken) return;
    if (!confirm(`¿Estás seguro de eliminar de forma permanente la copia de seguridad "${file.name}" en tu Google Drive? Esta acción es irreversible.`)) {
      return;
    }

    setActionLoading(file.id);
    setStatusMessage(null);
    try {
      await deleteBackupFile(driveToken, file.id);
      setStatusMessage({
        text: `Copia de seguridad "${file.name}" eliminada de Google Drive.`,
        type: 'success'
      });
      // Refresh list
      if (folderId) {
        const list = await listBackupFiles(driveToken, folderId);
        setBackups(list);
      }
    } catch (error: any) {
      console.error(error);
      setStatusMessage({
        text: 'Error al intentar eliminar el archivo de Google Drive.',
        type: 'error'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = () => {
    onSetDriveToken(null);
    setFolderId(null);
    setBackups([]);
    setPendingRestore(null);
    setStatusMessage({
      text: 'Se desconectó Google Drive correctamente de esta sesión.',
      type: 'info'
    });
  };

  const formatSize = (bytesStr?: string) => {
    if (!bytesStr) return 'N/A';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatDate = (dateISO: string) => {
    try {
      const d = new Date(dateISO);
      return d.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateISO;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/45 dark:bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-display">
                Respaldo en Google Drive
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Sincroniza y restaura tus datos mes a mes de forma segura
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal body (scrollable) */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3 rounded-xl border text-xs flex gap-2 items-start ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                : statusMessage.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400'
                  : 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Connected view vs Disconnected view */}
          {!driveToken ? (
            <div className="flex flex-col items-center justify-center text-center py-8 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/10">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                <CloudOff className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                Google Drive no vinculado
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed mb-4">
                Vincule su cuenta de Google para poder crear copias de seguridad de sus finanzas directamente en su nube privada de Google Drive.
              </p>
              
              <button
                type="button"
                onClick={handleConnectDrive}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 focus:outline-none transition-all duration-150 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.68 14.93 1 12 1 7.35 1 3.39 3.68 1.48 7.59l3.75 2.91C6.18 7.32 8.87 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.46c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.37-4.88 3.37-8.5z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.23 10.5c-.23-.68-.36-1.41-.36-2.17s.13-1.49.36-2.17L1.48 3.25C.53 5.16 0 7.29 0 9.53s.53 4.37 1.48 6.28l3.75-2.91z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-4.3 1.09-3.13 0-5.82-2.28-6.77-5.46l-3.75 2.9C3.39 20.32 7.35 23 12 23z"
                    />
                  </svg>
                )}
                <span>Vincular con Google Drive</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Actions Box */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Nueva Copia de Seguridad
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadDriveData}
                      disabled={loading}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 transition cursor-pointer"
                      title="Sincronizar lista de archivos"
                    >
                      <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="text-[9px] font-bold text-rose-500 hover:text-rose-600 transition cursor-pointer"
                    >
                      DESVINCULAR
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBackupScope('all')}
                    className={`py-2 px-3 border rounded-xl text-left transition cursor-pointer flex flex-col justify-between ${
                      backupScope === 'all'
                        ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/10 text-blue-700 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5 mb-1" />
                    <span className="text-[11px] font-bold font-sans">Todo el historial</span>
                    <span className="text-[9px] opacity-80 mt-0.5">({transactions.length} registros)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBackupScope('month')}
                    className={`py-2 px-3 border rounded-xl text-left transition cursor-pointer flex flex-col justify-between ${
                      backupScope === 'month'
                        ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/10 text-blue-700 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 mb-1" />
                    <span className="text-[11px] font-bold font-sans">Solo este mes</span>
                    <span className="text-[9px] opacity-80 mt-0.5">({currentMonthName} {currentYear})</span>
                  </button>
                </div>

                <button
                  onClick={handleCreateBackup}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl text-xs font-bold font-sans transition cursor-pointer shadow-3xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>RESPALDAR AHORA EN GOOGLE DRIVE</span>
                </button>
              </div>

              {/* Pending Restore Confirmation (Conditional UI) */}
              <AnimatePresence>
                {pendingRestore && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 space-y-3"
                  >
                    <div className="flex gap-2 items-start text-amber-800 dark:text-amber-400">
                      <ArrowRightLeft className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider">
                          Restaurar Copia de Seguridad
                        </h4>
                        <p className="text-[11px] mt-0.5 leading-relaxed font-sans">
                          Se detectaron <strong className="text-amber-900 dark:text-amber-300 font-bold">{pendingRestore.data.length} movimientos</strong> en la copia: 
                          <span className="block font-mono text-[9px] bg-white dark:bg-slate-950/40 p-1 rounded mt-1 border border-amber-100 dark:border-amber-900/10 truncate font-semibold">
                            {pendingRestore.file.name}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider block">
                        Modo de Importación:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRestoreMode('merge')}
                          className={`py-1.5 px-2.5 border rounded-lg text-left text-[11px] transition cursor-pointer font-sans ${
                            restoreMode === 'merge'
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 font-semibold'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Combinar (Evitar duplicados)
                        </button>
                        <button
                          type="button"
                          onClick={() => setRestoreMode('overwrite')}
                          className={`py-1.5 px-2.5 border rounded-lg text-left text-[11px] transition cursor-pointer font-sans ${
                            restoreMode === 'overwrite'
                              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 font-semibold'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Sobrescribir historial
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1.5">
                      <button
                        onClick={handleConfirmRestore}
                        disabled={loading}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg font-sans transition cursor-pointer disabled:opacity-50"
                      >
                        CONFIRMAR RESTAURACIÓN
                      </button>
                      <button
                        onClick={() => setPendingRestore(null)}
                        className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 text-slate-600 dark:text-slate-300 font-bold text-xs py-1.5 px-3 rounded-lg font-sans transition cursor-pointer"
                      >
                        CANCELAR
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* List of Backups */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Respaldos Guardados en Drive ({backups.length})
                </span>

                {loading && backups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin mb-2" />
                    <span className="text-[11px] text-slate-400">Leyendo Google Drive...</span>
                  </div>
                ) : backups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-950/5">
                    <FolderOpen className="w-6 h-6 text-slate-300 dark:text-slate-700 mb-2" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-0.5">No hay copias guardadas</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal max-w-[200px]">
                      Aún no has creado respaldos. Haz clic en "RESPALDAR AHORA" para guardar tu primer copia.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                    {backups.map((file) => (
                      <div 
                        key={file.id} 
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-200 dark:hover:border-slate-700 transition"
                      >
                        <div className="flex items-start gap-2.5 min-w-0 max-w-[70%]">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p 
                              className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate font-sans cursor-help" 
                              title={file.name}
                            >
                              {file.name}
                            </p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                              {formatDate(file.createdTime)} — {formatSize(file.size)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartRestore(file)}
                            disabled={!!actionLoading || loading}
                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 py-1 px-2 rounded-lg transition cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === file.id ? 'Descargando...' : 'Restaurar'}
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file)}
                            disabled={!!actionLoading || loading}
                            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition cursor-pointer disabled:opacity-50"
                            title="Eliminar del Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-center flex items-center justify-center gap-1 text-[9px] text-slate-400 dark:text-slate-500 font-sans">
          <HelpCircle className="w-3 h-3 text-blue-500" />
          <span>Tus respaldos se guardan en la carpeta privada "Mi Gestor Financiero Backups".</span>
        </div>

      </motion.div>
    </div>
  );
}
