import { Router } from 'express';
import { handleSearch } from '../controllers/searchController';

const router = Router();

router.post('/search', handleSearch);

export default router;
