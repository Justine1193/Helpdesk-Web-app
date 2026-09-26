import { store } from '../services/store.service.js'

export async function getDashboardReport(req, res, next) {
  try {
    const stats = store.getDashboardStats(req.user.role, req.user.id)
    res.json({ success: true, data: stats })
  } catch (err) {
    next(err)
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const logs = store.listAuditLogs()
    res.json({ success: true, data: logs })
  } catch (err) {
    next(err)
  }
}
