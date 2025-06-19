import React, { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';

interface NotificationToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  id,
  type,
  message,
  title,
  duration = 5000,
}) => {
  const removeNotification = useUIStore(state => state.removeNotification);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        removeNotification(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, removeNotification]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'bx bx-check-circle';
      case 'error':
        return 'bx bx-x-circle';
      case 'warning':
        return 'bx bx-error';
      case 'info':
        return 'bx bx-info-circle';
      default:
        return 'bx bx-bell';
    }
  };

  const getBgClass = () => {
    switch (type) {
      case 'success':
        return 'bg-success';
      case 'error':
        return 'bg-danger';
      case 'warning':
        return 'bg-warning';
      case 'info':
        return 'bg-info';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className={`toast show ${getBgClass()} text-white`} role="alert" aria-live="assertive" aria-atomic="true">
      <div className="toast-header">
        <i className={`${getIcon()} me-2`}></i>
        <strong className="me-auto">{title || type.charAt(0).toUpperCase() + type.slice(1)}</strong>
        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={() => removeNotification(id)}
          aria-label="Close"
        ></button>
      </div>
      <div className="toast-body">
        {message}
      </div>
    </div>
  );
};

export default NotificationToast; 