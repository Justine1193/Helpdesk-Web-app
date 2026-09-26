export function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      })
      req.validated = parsed
      next()
    } catch (error) {
      const errors = error.errors?.map((e) => `${e.path.join('.')}: ${e.message}`) || [error.message]
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: errors.join(', ')
        }
      })
    }
  }
}
