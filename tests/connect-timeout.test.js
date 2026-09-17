import {createServer} from 'node:net'
import {expect, test, afterEach} from 'vitest'
import {createHttpClient} from '$src/index.js'
import {platformFetch} from '$src/platform-node.js'

const {get} = createHttpClient({
  platformFetch,
  mapRequestError: error => error,
})

let server

const silentServer = () => new Promise(resolve => {
  server = createServer()
  server.on('connection', socket => socket.pause())
  server.listen(0, '127.0.0.1', () =>
    resolve(server.address().port))
})

afterEach(() => {
  server?.close()
})

test(
  'hanging TLS handshake fails at connectTimeout with a clean error',
  async () => {
    const port = await silentServer()
    const t0 = performance.now()

    await expect(
      get(`https://127.0.0.1:${port}`, {
        connectTimeout: 2000,
        timeout: 30000,
        clarifyTimeoutError: true,
      })
    ).rejects.toMatchObject({
      name: 'TimeoutError',
      code: 'CONNECT_TIMEOUT',
      status: 499,
    })

    const elapsed = performance.now() - t0
    expect(elapsed).toBeGreaterThan(1500)
    expect(elapsed).toBeLessThan(6000)
  },
  8000
)
