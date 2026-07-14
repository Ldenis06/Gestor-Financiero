import React, { createContext, useContext, useState, useCallback } from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  onConfirm?: () => void;
  isConfirm?: boolean;
  onCancel?: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface NotificationContextType {
  alerts: Alert[];
  toasts: Toast[];
  showAlert: (alert: Omit<Alert, 'id'>) => void;
  closeAlert: (id: string) => void;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  closeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showAlert = useCallback((alert: Omit<Alert, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setAlerts((prev) => [...prev, { ...alert, id }]);
  }, []);

  const closeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      closeToast(id);
    }, 4000);
  }, []);

  const closeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ alerts, toasts, showAlert, closeAlert, showToast, closeToast }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe usarse dentro de NotificationProvider');
  }
  return context;
};
