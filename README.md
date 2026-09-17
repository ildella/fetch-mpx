# fetch-mpx

[![npm](https://img.shields.io/npm/v/fetch-mpx)](https://www.npmjs.com/package/fetch-mpx)
[![CI](https://github.com/ildella/fetch-mpx/actions/workflows/ci.yml/badge.svg)](https://github.com/ildella/fetch-mpx/actions/workflows/ci.yml)
[![dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen)](https://github.com/ildella/fetch-mpx)

A tiny, axios-shaped HTTP client over platform `fetch`.

Node `fetch` (undici) is capable but bare. This package adds a simple `get` / `post` / `put` / `patch` / `del` API, a first-class `timeout` option, HTTP error throwing, and just enough error mapping — without bringing axios or any other HTTP stack.

**Why this exists**

- **Small, no extra stack.** Core has zero dependencies. The Node adapter imports `undici`, which already ships with Node, only for real connect-timeout control.
- **Axios-like syntax.** `get(url)`, `post(url, body)`, `{timeout: 5000}` — not a thin fetch wrapper that still feels like fetch.
- **`timeout` is a request option.** Works on every platform. On Node you also get `connectTimeout` for the TCP/TLS handshake (otherwise undici keeps its own 10s default).
- **Same client, any platform.** Inject `platformFetch` — browser `fetch`, Node, Tauri's HTTP plugin, whatever. The core does not care.
- **Status ≥ 400 throws.** A 404 is an `HttpError` with `.response`, not a successful `{status: 404}`.
- **Minimal error mapping.** Optional `mapRequestError` turns platform-specific string errors (Tauri, etc.) into `Error` objects with `.code`.

ESM, Node 22.19+, no build step — ships source.

## Install

```bash
yarn add fetch-mpx
```

## Usage

```js
import {createHttpClient} from 'fetch-mpx'

// Create a client with your platform fetch
const {get, post, put, patch, del, ping} = createHttpClient({
  platformFetch: fetch,          // browser built-in
  mapRequestError: error => error, // pass-through, or your own mapper
})

// Use it
const {data, status, headers} = await get('https://api.example.com/todos/1')
const created = await post('https://api.example.com/todos', {title: 'New'})
```

### With platform adapters

```js
import {createHttpClient} from 'fetch-mpx'
import {platformFetch} from 'fetch-mpx/platform-node'

const client = createHttpClient({
  platformFetch,
  mapRequestError: error => error,
})
```

### Content-type detection

```js
import {detectResponseType, RESPONSE_TYPES} from 'fetch-mpx'

detectResponseType('application/json')           // 'json'
detectResponseType('text/html; charset=utf-8')   // 'text'
detectResponseType('audio/mpeg')                 // 'blob'
```

### Error mapping

The `mapRequestError` function is called whenever the platform fetch throws a **string** error (e.g. Tauri plugin). It should return an `Error` object.

```js
const myErrorMapper = errorString => {
  const error = new Error(errorString)
  error.code = 'CUSTOM_CODE'
  return error
}

const client = createHttpClient({
  platformFetch,
  mapRequestError: myErrorMapper,
})
```

### Error clarification

Set `clarifyTimeoutError: true` in request config to standardize timeout/abort errors:

```js
try {
  await get(url, {timeout: 5000, clarifyTimeoutError: true})
} catch (error) {
  error.name   // 'TimeoutError' or 'AbortError'
  error.code   // 'TIMEOUT', 'CONNECT_TIMEOUT' or 'ABORTED'
  error.status // 499
}
```

### Timeouts

Two independent budgets exist when talking HTTP. `fetch` gives you one — the abort
signal — but the TCP/TLS handshake is governed by the underlying connector
(undici on Node), which keeps its own 10s default no matter how long your signal
waits. fetch-mpx exposes both:

- `timeout` — total budget for the whole operation (signal). Default 10000.
  Works on every platform.
- `connectTimeout` — handshake budget (undici `connect.timeout` via a cached
  `Agent` dispatcher). Node adapter only; defaults to `timeout`. A hang during
  TCP/TLS setup now fails at this budget instead of undici's 10s default.

```js
await get(url, {timeout: 30000})            // handshake and total budget: 30s
await get(url, {timeout: 30000, connectTimeout: 5000}) // handshake 5s, total 30s
await get(url, {timeout: 0})                // no budget (caller signal still honored)
```

Connect timeouts are surfaced as `TimeoutError` with `code: 'CONNECT_TIMEOUT'`
(when `clarifyTimeoutError` is on) instead of undici's raw
`TypeError: fetch failed`.

## License

MIT
