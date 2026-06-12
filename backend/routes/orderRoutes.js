import express from 'express';
import orderController from '../controllers/orderController.js';

const router = express.Router();
router.get('/daily', orderController.getDailyReserves);
router.post('/debt', orderController.addDebt);
router.post('/reserve', orderController.createReserve);
router.put('/:orderId/status', orderController.updateStatus);

export default router;
