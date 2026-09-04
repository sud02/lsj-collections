/**
 * Which environment are we really in?
 *
 * NODE_ENV alone is not trustworthy: a host that simply doesn't set it leaves
 * every `NODE_ENV !== 'production'` check believing it is in development, which
 * would silently enable OTP bypass and disable rate limiting on a live site.
 *
 * The database is the honest signal — a deployment serving real customers is by
 * definition connected to the real customer database. Development shortcuts
 * therefore require BOTH a non-production NODE_ENV and a throwaway database.
 */
const DEV_DB_PATTERN = /dev|test|local|staging/i
const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1|::1)$/

/** True when DB_NAME/DB_HOST clearly point at a throwaway database. */
const isDevDatabase = () =>
  DEV_DB_PATTERN.test(String(process.env.DB_NAME || '')) ||
  LOCAL_HOST_PATTERN.test(String(process.env.DB_HOST || ''))

const isProductionRuntime = () => process.env.NODE_ENV === 'production'

/**
 * Gate for anything that weakens security for convenience — the OTP bypass and
 * skipping rate limits. Fails closed: if either signal says "real", it's off.
 */
const devToolsAllowed = () => !isProductionRuntime() && isDevDatabase()

module.exports = { isDevDatabase, isProductionRuntime, devToolsAllowed }
