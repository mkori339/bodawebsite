import { Router } from 'express';
import {
  acceptRide,
  completeRide,
  createRide,
  getAssignedRides,
  getAvailableRides,
  getCustomerRides,
  payForRide,
  quoteRide,
  startRide
} from '../controllers/rideController.js';
import { authRequired, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/quote', authRequired, requireRole('customer'), quoteRide);
router.post('/', authRequired, requireRole('customer'), createRide);
router.get('/mine', authRequired, requireRole('customer'), getCustomerRides);
router.post('/:rideId/pay', authRequired, requireRole('customer'), payForRide);

router.get('/available', authRequired, requireRole('rider'), getAvailableRides);
router.get('/assigned', authRequired, requireRole('rider'), getAssignedRides);
router.post('/:rideId/accept', authRequired, requireRole('rider'), acceptRide);
router.post('/:rideId/start', authRequired, requireRole('rider'), startRide);
router.post('/:rideId/complete', authRequired, requireRole('rider'), completeRide);

export default router;
