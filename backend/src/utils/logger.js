const winston = require('winston')

const { combine, timestamp, printf, colorize, errors, json } = winston.format

const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
  return `${ts} [${level}] ${message}${metaStr}`
})

const isProd = process.env.NODE_ENV === 'production'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  format: combine(
    errors({ stack: true }),
    timestamp(),
    isProd ? json() : combine(colorize(), devFormat)
  ),
  transports: [new winston.transports.Console()]
})

module.exports = logger
