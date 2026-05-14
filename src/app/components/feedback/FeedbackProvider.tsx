import ToastLayer from './ToastLayer';
import { NotificationLayer } from './NotificationLayer';
import ConfirmDialog from './ConfirmDialog';

export function FeedbackProvider() {
  return (
    <>
      <ToastLayer />
      <NotificationLayer />
      <ConfirmDialog />
    </>
  );
}
