import { useFeedbackStore } from '../../stores/feedbackStore';
import type { NotificationItem } from '../../../shared/types/feedback';
import './NotificationLayer.css';

const ICON_MAP: Record<NotificationItem['type'], string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
};

function NotificationCard({ notification }: { notification: NotificationItem }) {
  const removeNotification = useFeedbackStore((s) => s.removeNotification);

  return (
    <div className={`notification-item notification-${notification.type}`}>
      <span className="notification-icon">{ICON_MAP[notification.type]}</span>
      <div className="notification-body">
        {notification.title && (
          <span className="notification-title">{notification.title}</span>
        )}
        <span className="notification-message">{notification.message}</span>
        {notification.action && (
          <div className="notification-actions">
            <button
              className="notification-action-btn"
              onClick={notification.action.onClick}
            >
              {notification.action.label}
            </button>
          </div>
        )}
      </div>
      <button
        className="notification-close"
        onClick={() => removeNotification(notification.id)}
      >
        ✕
      </button>
    </div>
  );
}

export function NotificationLayer() {
  const notifications = useFeedbackStore((s) => s.notifications);

  if (notifications.length === 0) return null;

  return (
    <div className="notification-layer">
      {notifications.map((n) => (
        <NotificationCard key={n.id} notification={n} />
      ))}
    </div>
  );
}
