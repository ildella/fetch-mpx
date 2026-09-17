# fetch-mpx

A dependency-injected HTTP client with pluggable platform fetch, content-type detection, and error mapping.

- ESM, `"type": "module"`, Node 22+
- Yarn 4 (Corepack)
- Vitest for testing
- No build step — ships source directly
- Core has zero dependencies; the Node platform adapter uses `undici` for real connect-timeout control

## Design

`fetch-mpx` is built around two injected dependencies:

- **`platformFetch(url, options)`** — the actual fetch implementation (browser `fetch`, Node built-in, Tauri's HTTP plugin, etc.)
- **`mapRequestError(error)`** — converts platform-specific error strings into `Error` objects with `.code` properties

The library provides optional convenience platform adapters (`platform-browser`, `platform-node`), but the core is completely platform-agnostic.

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
