import { Router } from 'express';
import { getPatientConsents, updateConsent } from '../controllers/consent.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/patient/:patientId', getPatientConsents);
router.post('/patient/:patientId', updateConsent);

export default router;
