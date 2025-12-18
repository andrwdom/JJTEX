import express from 'express';
import {
    calculateShippingWithRules,
    getAllShippingRules,
    getShippingRuleByCategory,
    createShippingRule,
    updateShippingRule,
    deleteShippingRule
} from '../controllers/shippingRulesController.js';
import { verifyToken } from '../middleware/auth.js';

const shippingRulesRouter = express.Router();

// Public calculation endpoint (checkout/cart)
shippingRulesRouter.post('/calculate', calculateShippingWithRules);

// Admin CRUD (protected)
shippingRulesRouter.get('/', verifyToken, getAllShippingRules);
shippingRulesRouter.get('/:category', verifyToken, getShippingRuleByCategory);
shippingRulesRouter.post('/', verifyToken, createShippingRule);
shippingRulesRouter.put('/:category', verifyToken, updateShippingRule);
shippingRulesRouter.delete('/:category', verifyToken, deleteShippingRule);

export default shippingRulesRouter; 