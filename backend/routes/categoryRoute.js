import express from 'express';
import { getAllCategories, getCategoryBySlug, getProductsByCategory, addCategory, getCategoryTree, getCategoryByPath } from '../controllers/categoryController.js';

const router = express.Router();

router.post('/', addCategory);
router.get('/', getAllCategories);
router.get('/tree', getCategoryTree);
router.get('/path/:path(*)', getCategoryByPath);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:slug', getCategoryBySlug);
router.get('/:slug/products', getProductsByCategory);

export default router; 