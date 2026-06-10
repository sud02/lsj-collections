require('dotenv').config()

const app = require('./src/app')
const logger = require('./src/utils/logger')

const PORT = parseInt(process.env.PORT || '5000', 10)

const server = app.listen(PORT, () => {
  logger.info(`LSJ backend listening on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
})

const shutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully`)
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 10000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: reason?.message || reason })
})

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { message: err.message, stack: err.stack })
  process.exit(1)
})
