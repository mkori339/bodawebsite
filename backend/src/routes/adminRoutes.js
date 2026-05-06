import { Router } from 'express';
import {
  getOverview,
  getPayments,
  getRiders,
  getTrips
} from '../controllers/adminController.js';
import { authRequired, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authRequired, requireRole('admin'));
router.get('/overview', getOverview);
router.get('/trips', getTrips);
router.get('/payments', getPayments);
router.get('/riders', getRiders);

export default router;
