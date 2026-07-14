import React from 'react';
import { AnimatePresence } from 'motion/react';
import AlertModal from './AlertModal';
import { useNotification } from '../context/NotificationContext';

export default function AlertContainer() {
  const { alerts, closeAlert } = useNotification();

  return (
    <AnimatePresence>
      {alerts.map((alert) => (
        <AlertModal key={alert.id} alert={alert} onClose={closeAlert} />
      ))}
    </AnimatePresence>
  );
}
