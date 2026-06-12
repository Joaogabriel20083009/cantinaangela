import express from 'express';
import productController from '../controllers/productController.js';

const router = express.Router();
router.get('/', productController.list);
router.post('/', productController.create);
router.put('/:id', productController.update);

export default router;
