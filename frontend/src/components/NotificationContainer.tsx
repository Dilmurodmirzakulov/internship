import React from 'react';
import { useUIStore } from '@/store/uiStore';
import NotificationToast from './NotificationToast';

const NotificationContainer: React.FC = () => {
  const notifications = useUIStore(state => state.notifications);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className="position-fixed top-0 end-0 p-3"
      style={{ zIndex: 9999, maxWidth: '400px' }}
    >
      <div className="toast-container">
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id}
            id={notification.id}
            type={notification.type}
            message={notification.message}
            title={notification.title}
            duration={notification.duration}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationContainer; 