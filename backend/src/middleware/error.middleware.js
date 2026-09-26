export function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err)

  const statusCode = err.statusCode || 500
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR'
  const message = err.message || 'An unexpected error occurred on the server'

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  })
}
