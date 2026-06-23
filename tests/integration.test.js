import {expect, test} from 'vitest'
import {createHttpClient} from '$src/index.js'
import {platformFetch} from '$src/platform-node.js'

const passThrough = error => error

const {
  get, post, put, patch, del,
} = createHttpClient({
  platformFetch,
  mapRequestError: passThrough,
})

test('get request returns axios-like response', async () => {
  const response = await get('https://jsonplaceholder.typicode.com/todos/1')

  expect(response).toHaveProperty('data')
  expect(response).toHaveProperty('status')
  expect(response).toHaveProperty('headers')
  expect(response.status).toBe(200)
  expect(response.data.id).toBe(1)
})

test('post request works', async () => {
  const response = await post('https://jsonplaceholder.typicode.com/posts', {
    title: 'Test',
    body: 'Test body',
    userId: 1,
  })

  expect(response.status).toBe(201)
  expect(response.data).toBeDefined()
  expect(response.data.id).toBeDefined()
})

test('put request works', async () => {
  const response = await put('https://jsonplaceholder.typicode.com/posts/1', {
    id: 1,
    title: 'Updated Title',
    body: 'Updated body',
    userId: 1,
  })

  expect(response.status).toBe(200)
  expect(response.data).toBeDefined()
  expect(response.data.id).toBe(1)
})

test('patch request works', async () => {
  const response = await patch('https://jsonplaceholder.typicode.com/posts/1', {
    title: 'Patched Title',
  })

  expect(response.status).toBe(200)
  expect(response.data).toBeDefined()
  expect(response.data.id).toBe(1)
})

test('delete request works', async () => {
  const response = await del('https://jsonplaceholder.typicode.com/posts/1')

  expect(response.status).toBe(200)
  expect(response.data).toBeDefined()
})

test('404 throws error with response data', async () => {
  expect.assertions(5)
  try {
    await get('https://jsonplaceholder.typicode.com/posts/999999')
    expect.fail('Should have thrown')
  } catch (error) {
    expect(error.name).toBe('HttpError')
    expect(error.message).toBe('HTTP 404')
    expect(error.response).toBeDefined()
    expect(error.response.status).toBe(404)
    expect(error.response.data).toBeDefined()
  }
})

test('timeout fires when fetch exceeds allowed time - clean', async () => {
  expect.assertions(3)
  try {
    await get('https://jsonplaceholder.typicode.com/todos/1', {
      timeout: 1,
    })
    expect.fail('Should have thrown')
  } catch (error) {
    // Node 22+ throws TimeoutError on AbortSignal.timeout
    expect(error.name).toBe('TimeoutError')
    expect(error.message).toBe('The operation was aborted due to timeout')
    expect(error.code).toBe(23)
  }
})

test('timeout fires when fetch exceeds allowed time - custom', async () => {
  expect.assertions(4)
  try {
    await get('https://jsonplaceholder.typicode.com/todos/1', {
      timeout: 1,
      clarifyTimeoutError: true,
    })
    expect.fail('Should have thrown')
  } catch (error) {
    expect(error.name).toBe('TimeoutError')
    expect(error.message).toBe('Request timeout')
    expect(error.code).toBe('TIMEOUT')
    expect(error.status).toBe(499)
  }
})

test('external abort signal abort request - clean', async () => {
  expect.assertions(3)
  const controller = new AbortController()
  setTimeout(() => controller.abort(), 5)
  try {
    await get('https://jsonplaceholder.typicode.com/todos/1', {
      signal: controller.signal,
    })
    expect.fail('Should have thrown')
  } catch (error) {
    expect(error.name).toBe('AbortError')
    expect(error.message).toBe('This operation was aborted')
    expect(error.code).toBe(20)
  }
})

test('external abort signal abort request - custom', async () => {
  expect.assertions(4)
  const controller = new AbortController()
  setTimeout(() => controller.abort(), 5)
  try {
    await get('https://jsonplaceholder.typicode.com/todos/1', {
      signal: controller.signal,
      clarifyTimeoutError: true,
    })
    expect.fail('Should have thrown')
  } catch (error) {
    expect(error.name).toBe('AbortError')
    expect(error.message).toBe('Request aborted')
    expect(error.code).toBe('ABORTED')
    expect(error.status).toBe(499)
  }
})
