import {detectResponseType} from './response-type.js'

export const headersToObject = headers => {
  const object = {}
  headers.forEach((value, key) => {
    object[key] = value
  })
  return object
}

export const detectHeaders = (body, headers) => {
  if (body && typeof body === 'object') {
    return {
      'content-type': 'application/json',
      'accept': 'application/json',
      ...headers,
    }
  }
  return headers
}

export const prepareBody = body => {
  if (body)
    return typeof body === 'object' ? JSON.stringify(body) : body
}

export const createHttpError = (status, result) => {
  const error = new Error(`HTTP ${status}`)
  error.name = 'HttpError'
  error.response = result
  return error
}

export const createTimeoutError = () => {
  const error = new Error('Request timeout')
  error.name = 'TimeoutError'
  error.code = 'TIMEOUT'
  error.status = 499
  return error
}

export const createConnectTimeoutError = () => {
  const error = new Error('Connect timeout')
  error.name = 'TimeoutError'
  error.code = 'CONNECT_TIMEOUT'
  error.status = 499
  return error
}

export const composeAbortSignal = ({signal, timeout}) => {
  if (!(timeout > 0))
    return signal
  const budget = AbortSignal.timeout(timeout)
  return signal ? AbortSignal.any([signal, budget]) : budget
}

export const createAbortError = () => {
  const error = new Error('Request aborted')
  error.name = 'AbortError'
  error.code = 'ABORTED'
  error.status = 499
  return error
}

export const cleanRequestError = ({error, mapRequestError}) =>
  typeof error === 'string'
    ? mapRequestError(error)
    : error

const CONNECT_TIMEOUT_CODE = 'UND_ERR_CONNECT_TIMEOUT'

const timeoutCodeOf = cleanedError =>
  cleanedError.code ?? cleanedError.cause?.code

const isTimeoutError = error =>
  error.name === 'TimeoutError' || error.code === 'ETIMEDOUT'

const isAbortError = error =>
  error.name === 'AbortError' || error.code === 'AbortError'

const throwTimeoutError = cleanedError => {
  if (timeoutCodeOf(cleanedError) === CONNECT_TIMEOUT_CODE)
    throw createConnectTimeoutError()
  if (isTimeoutError(cleanedError))
    throw createTimeoutError()
  if (isAbortError(cleanedError))
    throw createAbortError()
}

export const createRequest = ({platformFetch, mapRequestError}) => async (url, {
  method = 'GET',
  body,
  headers = {},
  timeout = 10000,
  connectTimeout,
  signal,
  clarifyTimeoutError = false,
  ...config
// eslint-disable-next-line complexity
} = {}) => {
  const options = {
    method,
    headers: detectHeaders(body, headers),
    body: prepareBody(body),
    ...config,
    signal: composeAbortSignal({signal, timeout}),
    connectTimeout: connectTimeout ?? timeout,
  }

  try {
    const response = await platformFetch(url, options)
    const contentType = response.headers.get('content-type')
    const responseType = detectResponseType(contentType)
    const data = await response[responseType]()

    const result = {
      data,
      status: response.status,
      headers: headersToObject(response.headers),
    }

    if (response.status >= 400) {
      throw createHttpError(response.status, result)
    }

    return result
  } catch (error) {
    const cleanedError = cleanRequestError({error, mapRequestError})
    if (clarifyTimeoutError) {
      throwTimeoutError(cleanedError)
    }
    throw cleanedError
  }
}

export const createHttpClient = dependencies => {
  const request = createRequest(dependencies)

  const get = (url, config = {}) =>
    request(url, config)

  const post = (url, body, config = {}) =>
    request(url, {method: 'POST', body, ...config})

  const put = (url, body, config = {}) =>
    request(url, {method: 'PUT', body, ...config})

  const patch = (url, body, config = {}) =>
    request(url, {method: 'PATCH', body, ...config})

  const del = (url, config = {}) =>
    request(url, {method: 'DELETE', ...config})

  const ping = async (url, {timeout = 2000} = {}) => {
    try {
      await request(url, {method: 'HEAD', timeout, cache: 'no-store'})
      return true
    } catch (error) {
      console.debug('PING FAILED |', url, error.message)
      return false
    }
  }

  return {
    get,
    post,
    put,
    patch,
    del,
    ping,
  }
}
