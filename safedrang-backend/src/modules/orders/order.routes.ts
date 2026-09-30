import { Router, raw } from 'express';
import { OrderController } from './order.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
const ctrl = new OrderController();

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ORDER_MANAGER'] as const;

// Webhook (raw body required)
router.post('/webhook', raw({ type: 'application/json' }), ctrl.webhook);

// Customer routes
router.post('/', authenticate, ctrl.create);
router.post('/razorpay-order', authenticate, ctrl.createRazorpayOrder);
router.post('/verify-payment', ctrl.verifyPayment);
router.get('/my', authenticate, ctrl.myOrders);
router.get('/:id', authenticate, ctrl.getOne);

// Admin routes
router.get('/', authenticate, authorize(...ADMIN_ROLES), ctrl.list);
router.put('/:id/status', authenticate, authorize(...ADMIN_ROLES), ctrl.updateStatus);
router.put('/:id/tracking', authenticate, authorize(...ADMIN_ROLES), ctrl.addTracking);
router.post('/:id/refund', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'MANAGER'), ctrl.refund);

export default router;
