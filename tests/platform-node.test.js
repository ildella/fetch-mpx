import {
  expect, test, vi, beforeEach, afterEach,
} from 'vitest'

const {FakeAgent, fetchMock} = vi.hoisted(() => {
  class FakeAgent {
    constructor () {
      this.dispatch = () => true
    }
  }
  const fetchMock = vi.fn().mockResolvedValue({
    status: 200,
    headers: new Map(),
    text: () => Promise.resolve(''),
  })
  return {FakeAgent, fetchMock}
})

vi.mock('undici', () => ({
  Agent: FakeAgent,
  fetch: fetchMock,
}))

const {platformFetch} = await import('$src/platform-node.js')

beforeEach(() => {
  fetchMock.mockClear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('connectTimeout is translated into a dispatcher for the same-module fetch', async () => {
  await platformFetch('https://example.com', {connectTimeout: 3000})

  const [, options] = fetchMock.mock.calls[0]
  expect(options.connectTimeout).toBeUndefined()
  expect(typeof options.dispatcher.dispatch).toBe('function')
})

test('agents are cached per connectTimeout value', async () => {
  await platformFetch('https://example.com', {connectTimeout: 3000})
  await platformFetch('https://example.com', {connectTimeout: 3000})

  expect(fetchMock.mock.calls[0][1].dispatcher).toBe(fetchMock.mock.calls[1][1].dispatcher)
})

test('different connectTimeout values use different agents', async () => {
  await platformFetch('https://example.com', {connectTimeout: 3000})
  await platformFetch('https://example.com', {connectTimeout: 7000})

  expect(fetchMock.mock.calls[0][1].dispatcher).not.toBe(fetchMock.mock.calls[1][1].dispatcher)
})

test('caller provided dispatcher is preserved', async () => {
  const dispatcher = {
    dispatch: () => true,
  }
  await platformFetch('https://example.com', {connectTimeout: 3000, dispatcher})

  expect(fetchMock.mock.calls[0][1].dispatcher).toBe(dispatcher)
})

test('no connectTimeout leaves fetch options untouched', async () => {
  await platformFetch('https://example.com', {method: 'POST'})

  const [, options] = fetchMock.mock.calls[0]
  expect(options.dispatcher).toBeUndefined()
  expect(options.connectTimeout).toBeUndefined()
  expect(options.method).toBe('POST')
})
