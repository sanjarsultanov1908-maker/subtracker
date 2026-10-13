import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller.js';
import { GroupController } from '../controllers/group.controller.js';
import { UserController } from '../controllers/user.controller.js';

const router = Router();

// Subscriptions
router.get('/subscriptions', SubscriptionController.list);
router.post('/subscriptions', SubscriptionController.create);
router.put('/subscriptions/:id', SubscriptionController.update);
router.delete('/subscriptions/:id', SubscriptionController.delete);
router.get('/subscriptions/calendar', SubscriptionController.getCalendar);
router.get('/subscriptions/analytics', SubscriptionController.getAnalytics);

// Groups & Sharing
router.get('/groups', GroupController.list);
router.post('/groups', GroupController.create);
router.post('/groups/split', GroupController.splitSubscription);
router.patch('/groups/shares/:shareId', GroupController.updateShareStatus);

// Users & Settings & Rates
router.get('/user/profile', UserController.getProfile);
router.post('/user/budget', UserController.updateBudget);
router.get('/rates', UserController.getRates);

export default router;
