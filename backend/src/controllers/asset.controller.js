import { store } from '../services/store.service.js'

export async function getAssets(req, res, next) {
  try {
    const { status, department } = req.query
    const assets = store.listAssets({ status, department })
    res.json({ success: true, data: assets })
  } catch (err) {
    next(err)
  }
}

export async function createAsset(req, res, next) {
  try {
    const asset = store.createAsset(req.body, req.user)
    res.status(201).json({ success: true, data: asset })
  } catch (err) {
    next(err)
  }
}

export async function getMaintenances(req, res, next) {
  try {
    res.json({ success: true, data: store.maintenances })
  } catch (err) {
    next(err)
  }
}
