import { Router } from 'express'
import { getAssets, createAsset, getMaintenances } from '../controllers/asset.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.use(requireAuth)

router.get('/', getAssets)
router.post('/', requireRole('ADMIN'), createAsset)
router.get('/maintenance', getMaintenances)

export default router
