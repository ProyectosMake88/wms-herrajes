import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import routes from './routes';
import prisma from './config/database';
import authService from './services/auth.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir imágenes estáticas desde /uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), service: 'WMS Herrajes API' });
});

// Rutas de la API
app.use('/api', routes);

// Manejo de rutas no encontradas
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Iniciar servidor
async function start() {
  try {
    await prisma.$connect();
    console.log('📦 Base de datos conectada');

    // Crear usuario admin por defecto si no existe ninguno
    await authService.seedAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 WMS Herrajes API corriendo en http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

start();

export default app;
