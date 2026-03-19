import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import notificationService from '../services/notification.service';

export class NotificationController {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const notifications = await notificationService.getAll();
      const unreadCount = await notificationService.getUnreadCount();
      res.json({ success: true, data: { notifications, unreadCount } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      await notificationService.markAsRead(Number(req.params.id));
      res.json({ success: true, message: 'Notificación marcada como leída' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      await notificationService.markAllAsRead();
      res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new NotificationController();
