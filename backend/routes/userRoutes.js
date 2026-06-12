import express from 'express';
import userController from '../controllers/userController.js';

const router = express.Router();
router.get('/', userController.list);
router.get('/:userId/ledger', userController.getClientLedger);

export default router;
