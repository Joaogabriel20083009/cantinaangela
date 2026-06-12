import express from 'express';
import messageController from '../controllers/messageController.js';

const router = express.Router();
router.get('/', messageController.list);
router.post('/', messageController.create);

export default router;
