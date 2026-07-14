import React from 'react';
import { AnimatePresence } from 'motion/react';
import Toast from './Toast';
import { useNotification } from '../context/NotificationContext';

export default function ToastContainer() {
  const { toasts, closeToast } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-40 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onClose={closeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
