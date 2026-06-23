/* eslint-disable max-lines */
import {
  expect, test, vi, beforeEach, afterEach,
} from 'vitest'
import {createHttpClient} from '$src/index.js'

// Pass-through: leaves errors unchanged. String errors stay as strings.
const passThrough = error => error

// Test mapper: wraps strings into Error objects with a code.
const mapAsError = errorString => {
  const error = new Error(errorString)
  error.code = 'MAPPED_ERROR'
  return error
}

// Test mapper: maps timout-ish strings to ETIMEDOUT.
const mapAsTimedout = errorString => {
  const error = new Error(errorString)
  error.code = 'ETIMEDOUT'
  return error
}

// Test mapper: maps abort-ish strings to AbortError name.
const mapAsAbort = errorString => {
  const error = new Error(errorString)
  error.name = 'AbortError'
  return error
}

let mockPlatformFetch

beforeEach(() => {
  mockPlatformFetch = vi.fn()
})

afterEach(() => {
  vi.clearAllMocks()
})

// Helper: create a fresh client with the mock platform
const fresh = (mapRequestError = passThrough) =>
  createHttpClient({platformFetch: mockPlatformFetch, mapRequestError})

test(
  'post with JSON body sends application/json content-type and accept',
  async () => {
    mockPlatformFetch.mockResolvedValue({
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve({success: true}),
    })

    const {post} = fresh()
    await post('https://example.com/api', {name: 'test'})

    expect(mockPlatformFetch).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'content-type': 'application/json',
          'accept': 'application/json',
        }),
        body: '{"name":"test"}',
        connectTimeout: 10000,
      })
    )
  }
)

test('post with custom content-type does not override it', async () => {
  mockPlatformFetch.mockResolvedValue({
    status: 200,
    headers: new Map([['content-type', 'text/plain']]),
    text: () => Promise.resolve('ok'),
  })

  const {post} = fresh()
  await post('https://example.com/api', 'raw text', {
    headers: {'content-type': 'text/plain'},
  })

  expect(mockPlatformFetch).toHaveBeenCalledWith(
    'https://example.com/api',
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'content-type': 'text/plain',
      }),
      body: 'raw text',
      connectTimeout: 10000,
    })
  )
})

test('request always includes default timeout', async () => {
  mockPlatformFetch.mockResolvedValue({
    status: 200,
    headers: new Map([['content-type', 'application/json']]),
    json: () => Promise.resolve({}),
  })

  const {get} = fresh()
  await get('https://example.com/api')

  expect(mockPlatformFetch).toHaveBeenCalledWith(
    'https://example.com/api',
    expect.objectContaining({
      connectTimeout: 10000,
    })
  )
})

test('custom timeout overrides default', async () => {
  mockPlatformFetch.mockResolvedValue({
    status: 200,
    headers: new Map([['content-type', 'application/json']]),
    json: () => Promise.resolve({}),
  })

  const {get} = fresh()
  await get('https://example.com/api', {timeout: 5000})

  expect(mockPlatformFetch).toHaveBeenCalledWith(
    'https://example.com/api',
    expect.objectContaining({
      connectTimeout: 5000,
    })
  )
})

test('404 throws error with response attached', async () => {
  expect.assertions(4)
  mockPlatformFetch.mockResolvedValue({
    status: 404,
    headers: new Map([['content-type', 'application/json']]),
    json: () => Promise.resolve({error: 'Not found'}),
  })

  const {get} = fresh()
  try {
    await get('https://example.com/api/missing')
    expect.fail('Should have thrown')
  } catch (error) {
    expect(error.message).toBe('HTTP 404')
    expect(error.response).toBeDefined()
    expect(error.response.status).toBe(404)
    expect(error.response.data).toEqual({error: 'Not found'})
  }
})

test('500 throws error with response attached', async () => {
  expect.assertions(4)
  mockPlatformFetch.mockResolvedValue({
    status: 500,
    headers: new Map([['content-type', 'text/plain']]),
    text: () => Promise.resolve('Internal Server Error'),
  })

  const {post} = fresh()
  try {
    await post('https://example.com/api', {data: 'test'})
    expect.fail('Should have thrown')
  } catch (error) {
    expect(error.message).toBe('HTTP 500')
    expect(error.response).toBeDefined()
    expect(error.response.status).toBe(500)
    expect(error.response.data).toBe('Internal Server Error')
  }
})

test('Error objects from platform fetch are re-thrown unchanged', async () => {
  mockPlatformFetch.mockRejectedValue(new Error('Network error'))

  const {get} = fresh()
  await expect(get('https://example.com/api')).rejects.toThrow('Network error')
})

test('mapRequestError transforms string errors from platform fetch', async () => {
  mockPlatformFetch.mockRejectedValue('some raw string error')

  const {get} = fresh(mapAsError)
  const thrown = await get('https://example.com/api').catch(error => error)

  expect(thrown).toBeInstanceOf(Error)
  expect(thrown.message).toBe('some raw string error')
  expect(thrown.code).toBe('MAPPED_ERROR')
})

test('clarifyTimeoutError standardizes ETIMEDOUT errors', async () => {
  expect.assertions(4)
  mockPlatformFetch.mockRejectedValue('something timed out in the platform')

  const {get} = fresh(mapAsTimedout)
  try {
    await get('https://example.com/api', {clarifyTimeoutError: true})
    expect.fail('Should have thrown')
  } catch (error) {
    expect(error.name).toBe('TimeoutError')
    expect(error.code).toBe('TIMEOUT')
    expect(error.status).toBe(499)
    expect(error.message).toBe('Request timeout')
  }
})

test('clarifyTimeoutError standardizes AbortError errors', async () => {
  expect.assertions(4)
  mockPlatformFetch.mockRejectedValue('operation was aborted')

  const {get} = fresh(mapAsAbort)
  try {
    await get('https://example.com/api', {clarifyTimeoutError: true})
    expect.fail('Should have thrown')
  } catch (error) {
    expect(error.name).toBe('AbortError')
    expect(error.code).toBe('ABORTED')
    expect(error.status).toBe(499)
    expect(error.message).toBe('Request aborted')
  }
})

test('string error passes through when mapRequestError is identity', async () => {
  mockPlatformFetch.mockRejectedValue('raw string')

  const {get} = fresh()
  await expect(get('https://example.com/api')).rejects.toBe('raw string')
})

describe('ping', () => {
  test('returns true on success', async () => {
    mockPlatformFetch.mockResolvedValue({
      status: 200,
      headers: new Map([['content-type', 'text/plain']]),
      text: () => Promise.resolve(''),
    })

    const {ping} = fresh()
    const result = await ping('https://example.com')
    expect(result).toBe(true)
    expect(mockPlatformFetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        method: 'HEAD',
        connectTimeout: 2000,
        cache: 'no-store',
      })
    )
  })

  test('returns false on failure', async () => {
    mockPlatformFetch.mockRejectedValue(new Error('Network error'))

    const {ping} = fresh()
    const result = await ping('https://example.com')
    expect(result).toBe(false)
  })

  test('returns false on timeout', async () => {
    mockPlatformFetch.mockRejectedValue({name: 'TimeoutError'})

    const {ping} = fresh()
    const result = await ping('https://example.com', {timeout: 10})
    expect(result).toBe(false)
  })
})
