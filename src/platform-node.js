// Node.js platform fetch with connectTimeout support.
// Translates connectTimeout into an AbortSignal.timeout for native fetch.

export const platformFetch = (url, options = {}) => {
  if (options.connectTimeout) {
    const timeoutSignal = AbortSignal.timeout(options.connectTimeout)
    options.signal = options.signal
      ? AbortSignal.any([options.signal, timeoutSignal])
      : timeoutSignal
  }
  return globalThis.fetch(url, options)
}
