// catch 404 - route not found
export const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`)
    res.status(404)
    next(error)
  }
  
  // global error handler
  export const errorHandler = (err, req, res, next) => {
    // sometimes an error is thrown with a 200 status I default to 500 in that case
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode
  
    res.status(statusCode).json({
      message: err.message,
      // only show stack trace in development
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    })
  }