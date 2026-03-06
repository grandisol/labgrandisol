import express, { Request, Response } from 'express';
import { alertManager } from '../utils/alerts.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';
import Logger from '../utils/logger.js';

const router = express.Router();
const logger = new Logger('AdminAlerts');

// GET /api/admin/alerts/rules - Listar regras de alerta
router.get('/rules', verifyToken, verifyAdmin, (req: Request, res: Response) => {
  try {
    const rules = alertManager.getActiveRules();
    logger.info(`Regras de alerta listadas por ${req.user?.name}`);
    res.json({ success: true, rules });
  } catch (error) {
    logger.error('Erro ao listar regras de alerta', error as Error);
    res.status(500).json({ success: false, message: 'Erro ao listar regras de alerta' });
  }
});

// GET /api/admin/alerts/history - Histórico de alertas
router.get('/history', verifyToken, verifyAdmin, (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string || '100');
    const history = alertManager.getAlertHistory(limit);
    logger.info(`Histórico de alertas consultado por ${req.user?.name}`);
    res.json({ success: true, history });
  } catch (error) {
    logger.error('Erro ao consultar histórico de alertas', error as Error);
    res.status(500).json({ success: false, message: 'Erro ao consultar histórico de alertas' });
  }
});

// POST /api/admin/alerts/rules - Adicionar nova regra de alerta
router.post('/rules', verifyToken, verifyAdmin, (req: Request, res: Response) => {
  try {
    const { name, description, condition, severity, cooldown } = req.body;

    if (!name || !description || !condition || !severity || !cooldown) {
      return res.status(400).json({ success: false, message: 'Campos obrigatórios: name, description, condition, severity, cooldown' });
    }

    // Validação básica da condição
    if (typeof condition !== 'function') {
      return res.status(400).json({ success: false, message: 'Condição deve ser uma função' });
    }

    const rule = {
      id: `custom-${Date.now()}`,
      name,
      description,
      condition,
      severity,
      cooldown,
      enabled: true
    };

    alertManager.addRule(rule);
    logger.info(`Nova regra de alerta adicionada por ${req.user?.name}: ${name}`);
    res.json({ success: true, message: 'Regra de alerta adicionada com sucesso' });
  } catch (error) {
    logger.error('Erro ao adicionar regra de alerta', error as Error);
    res.status(500).json({ success: false, message: 'Erro ao adicionar regra de alerta' });
  }
});

// PUT /api/admin/alerts/rules/:id/enable - Habilitar regra de alerta
router.put('/rules/:id/enable', verifyToken, verifyAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    alertManager.enableRule(id);
    logger.info(`Regra de alerta habilitada por ${req.user?.name}: ${id}`);
    res.json({ success: true, message: 'Regra de alerta habilitada com sucesso' });
  } catch (error) {
    logger.error('Erro ao habilitar regra de alerta', error as Error);
    res.status(500).json({ success: false, message: 'Erro ao habilitar regra de alerta' });
  }
});

// PUT /api/admin/alerts/rules/:id/disable - Desabilitar regra de alerta
router.put('/rules/:id/disable', verifyToken, verifyAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    alertManager.disableRule(id);
    logger.info(`Regra de alerta desabilitada por ${req.user?.name}: ${id}`);
    res.json({ success: true, message: 'Regra de alerta desabilitada com sucesso' });
  } catch (error) {
    logger.error('Erro ao desabilitar regra de alerta', error as Error);
    res.status(500).json({ success: false, message: 'Erro ao desabilitar regra de alerta' });
  }
});

// DELETE /api/admin/alerts/rules/:id - Remover regra de alerta
router.delete('/rules/:id', verifyToken, verifyAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    alertManager.removeRule(id);
    logger.info(`Regra de alerta removida por ${req.user?.name}: ${id}`);
    res.json({ success: true, message: 'Regra de alerta removida com sucesso' });
  } catch (error) {
    logger.error('Erro ao remover regra de alerta', error as Error);
    res.status(500).json({ success: false, message: 'Erro ao remover regra de alerta' });
  }
});

// GET /api/admin/alerts/rules/:id/status - Status da regra de alerta
router.get('/rules/:id/status', verifyToken, verifyAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const status = alertManager.getRuleStatus(id);
    logger.info(`Status da regra de alerta consultado por ${req.user?.name}: ${id}`);
    res.json({ success: true, status });
  } catch (error) {
    logger.error('Erro ao consultar status da regra de alerta', error as Error);
    res.status(500).json({ success: false, message: 'Erro ao consultar status da regra de alerta' });
  }
});

// POST /api/admin/alerts/history/clear - Limpar histórico de alertas
router.post('/history/clear', verifyToken, verifyAdmin, (req: Request, res: Response) => {
  try {
    alertManager.clearHistory();
    logger.info(`Histórico de alertas limpo por ${req.user?.name}`);
    res.json({ success: true, message: 'Histórico de alertas limpo com sucesso' });
  } catch (error) {
    logger.error('Erro ao limpar histórico de alertas', error as Error);
    res.status(500).json({ success: false, message: 'Erro ao limpar histórico de alertas' });
  }
});

// GET /api/admin/alerts/status - Status geral do sistema de alertas
router.get('/status', verifyToken, verifyAdmin, (req: Request, res: Response) => {
  try {
    const activeRules = alertManager.getActiveRules();
    const recentAlerts = alertManager.getAlertHistory(10);
    
    const status = {
      activeRules: activeRules.length,
      totalAlerts: alertManager.getAlertHistory().length,
      recentAlerts,
      lastCheck: new Date().toISOString()
    };

    logger.info(`Status do sistema de alertas consultado por ${req.user?.name}`);
    res.json({ success: true, status });
  } catch (error) {
    logger.error('Erro ao consultar status do sistema de alertas', error as Error);
    res.status(500).json({ success: false, message: 'Erro ao consultar status do sistema de alertas' });
  }
});

export default router;