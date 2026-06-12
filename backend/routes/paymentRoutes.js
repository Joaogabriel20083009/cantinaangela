import express from 'express';
import paymentController from '../controllers/paymentController.js';

const router = express.Router();
router.get('/', paymentController.listPayments);
router.post('/upload', paymentController.uploadReceipt);
router.put('/:paymentId/approve', paymentController.approve);
router.put('/:paymentId/reject', paymentController.reject);

export default router;
