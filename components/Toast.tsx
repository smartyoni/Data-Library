import React, { useEffect } from 'react';
import { Icons } from './ui/Icons';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number; // milliseconds
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }[type];

  const borderColor = {
    success: 'border-green-600',
    error: 'border-red-600',
    info: 'border-blue-600'
  }[type];

  return (
    <div
      className={`fixed top-4 right-4 max-w-sm px-4 py-3 rounded-lg border ${bgColor} ${borderColor} text-white text-sm font-medium shadow-lg animate-fade-in z-50`}
      role="alert"
    >
      <div className="flex items-center gap-2">
        {type === 'success' && <Icons.Check className="w-4 h-4" />}
        {type === 'error' && <Icons.Close className="w-4 h-4" />}
        {type === 'info' && <Icons.File className="w-4 h-4" />}
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Toast;
