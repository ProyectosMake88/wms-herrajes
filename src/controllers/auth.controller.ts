import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  }

  /** Solo admin puede crear usuarios */
  async createUser(req: AuthRequest, res: Response) {
    try {
      const { email, password, name, role } = req.body;
      const user = await authService.register({ email, password, name, role });
      res.status(201).json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /** Solo admin puede listar usuarios */
  async getUsers(_req: AuthRequest, res: Response) {
    try {
      const users = await authService.getAllUsers();
      res.json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /** Solo admin puede editar usuarios */
  async updateUser(req: AuthRequest, res: Response) {
    try {
      const user = await authService.updateUser(Number(req.params.id), req.body);
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /** Solo admin puede desactivar usuarios */
  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const user = await authService.deleteUser(Number(req.params.id));
      res.json({ success: true, data: user, message: 'Usuario desactivado' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /** Obtener perfil del usuario autenticado */
  async getProfile(req: AuthRequest, res: Response) {
    res.json({ success: true, data: req.user });
  }
}

export default new AuthController();
