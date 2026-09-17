import {
  expect, test, vi, afterEach,
} from 'vitest'
import {platformFetch} from '$src/platform-node.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

const stubFetch = () => {
  const mock = vi.fn().mockResolvedValue({
    status: 200,
    headers: new Map(),
    text: () => Promise.resolve(''),
  })
  vi.stubGlobal('fetch', mock)
  return mock
}

test('connectTimeout is translated into a dispatcher for global fetch', async () => {
  const mock = stubFetch()
  await platformFetch('https://example.com', {connectTimeout: 3000})

  const [, options] = mock.mock.calls[0]
  expect(options.connectTimeout).toBeUndefined()
  expect(typeof options.dispatcher.dispatch).toBe('function')
})

test('agents are cached per connectTimeout value', async () => {
  const mock = stubFetch()
  await platformFetch('https://example.com', {connectTimeout: 3000})
  await platformFetch('https://example.com', {connectTimeout: 3000})

  expect(mock.mock.calls[0][1].dispatcher).toBe(mock.mock.calls[1][1].dispatcher)
})

test('different connectTimeout values use different agents', async () => {
  const mock = stubFetch()
  await platformFetch('https://example.com', {connectTimeout: 3000})
  await platformFetch('https://example.com', {connectTimeout: 7000})

  expect(mock.mock.calls[0][1].dispatcher).not.toBe(mock.mock.calls[1][1].dispatcher)
})

test('caller provided dispatcher is preserved', async () => {
  const mock = stubFetch()
  const dispatcher = {
    dispatch: () => true,
  }
  await platformFetch('https://example.com', {connectTimeout: 3000, dispatcher})

  expect(mock.mock.calls[0][1].dispatcher).toBe(dispatcher)
})

test('no connectTimeout leaves fetch options untouched', async () => {
  const mock = stubFetch()
  await platformFetch('https://example.com', {method: 'POST'})

  const [, options] = mock.mock.calls[0]
  expect(options.dispatcher).toBeUndefined()
  expect(options.connectTimeout).toBeUndefined()
  expect(options.method).toBe('POST')
})
