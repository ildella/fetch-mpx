import net from 'node:net'
import {createServer as createHttpServer} from 'node:http'
import {
  expect, test, vi, afterEach,
} from 'vitest'
import {createHttpClient} from '$src/index.js'
import {platformFetch} from '$src/platform-node.js'

const {get} = createHttpClient({
  platformFetch,
  mapRequestError: error => error,
})

let server

afterEach(() => {
  server?.close()
  vi.unstubAllGlobals()
})

const silentServer = () => new Promise(resolve => {
  server = net.createServer()
  server.on('connection', socket => socket.pause())
  server.listen(0, '127.0.0.1', () =>
    resolve(server.address().port))
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

test('requests go through the same-module undici fetch, not globalThis.fetch', async () => {
  server = createHttpServer((req, res) => {
    res.writeHead(200, {'content-type': 'application/json'})
    res.end('{"ok":true}')
  })
  server.listen(0, '127.0.0.1')
  await new Promise(resolve => server.on('listening', resolve))
  const port = server.address().port

  vi.stubGlobal('fetch', () => {
    throw new Error('globalThis.fetch was used')
  })

  const {data} = await get(`http://127.0.0.1:${port}`, {timeout: 5000})

  expect(data).toEqual({ok: true})
})
