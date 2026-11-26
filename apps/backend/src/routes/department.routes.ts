import { Router } from 'express';
import { listDepartments, getDepartmentById } from '../controllers/department.controller';

const router = Router();

router.get('/', listDepartments);
router.get('/:id', getDepartmentById);

export default router;
