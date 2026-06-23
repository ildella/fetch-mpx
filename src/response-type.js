const RESPONSE_TYPES = {
  JSON: 'json',
  TEXT: 'text',
  BLOB: 'blob',
  ARRAY_BUFFER: 'arrayBuffer',
}

const CONTENT_TYPE_MAP = {
  'application/json': RESPONSE_TYPES.JSON,
  'application/ld+json': RESPONSE_TYPES.JSON,
  'application/vnd.api+json': RESPONSE_TYPES.JSON,

  'text/plain': RESPONSE_TYPES.TEXT,
  'text/html': RESPONSE_TYPES.TEXT,
  'text/xml': RESPONSE_TYPES.TEXT,
  'text/csv': RESPONSE_TYPES.TEXT,
  'text/css': RESPONSE_TYPES.TEXT,
  'text/javascript': RESPONSE_TYPES.TEXT,
  'application/xml': RESPONSE_TYPES.TEXT,
  'application/xhtml+xml': RESPONSE_TYPES.TEXT,
  'application/rss+xml': RESPONSE_TYPES.TEXT,
  'application/atom+xml': RESPONSE_TYPES.TEXT,
  'application/soap+xml': RESPONSE_TYPES.TEXT,

  'image/jpeg': RESPONSE_TYPES.BLOB,
  'image/png': RESPONSE_TYPES.BLOB,
  'image/gif': RESPONSE_TYPES.BLOB,
  'image/webp': RESPONSE_TYPES.BLOB,
  'image/svg+xml': RESPONSE_TYPES.TEXT,
  'image/bmp': RESPONSE_TYPES.BLOB,
  'image/tiff': RESPONSE_TYPES.BLOB,

  'application/pdf': RESPONSE_TYPES.BLOB,
  'application/zip': RESPONSE_TYPES.BLOB,
  'application/gzip': RESPONSE_TYPES.BLOB,
  'application/octet-stream': RESPONSE_TYPES.BLOB,

  'audio/mpeg': RESPONSE_TYPES.BLOB,
  'audio/wav': RESPONSE_TYPES.BLOB,
  'audio/ogg': RESPONSE_TYPES.BLOB,

  'video/mp4': RESPONSE_TYPES.BLOB,
  'video/mpeg': RESPONSE_TYPES.BLOB,
  'video/webm': RESPONSE_TYPES.BLOB,

  'font/woff': RESPONSE_TYPES.BLOB,
  'font/woff2': RESPONSE_TYPES.BLOB,
  'font/ttf': RESPONSE_TYPES.BLOB,
  'font/otf': RESPONSE_TYPES.BLOB,

  'application/vnd.ms-excel': RESPONSE_TYPES.BLOB,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    RESPONSE_TYPES.BLOB,
  'application/vnd.ms-powerpoint': RESPONSE_TYPES.BLOB,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    RESPONSE_TYPES.BLOB,
  'application/msword': RESPONSE_TYPES.BLOB,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    RESPONSE_TYPES.BLOB,
}

export const detectFromNormalized = normalizedType => {
  if (CONTENT_TYPE_MAP[normalizedType])
    return CONTENT_TYPE_MAP[normalizedType]

  if (normalizedType.startsWith('text/'))
    return RESPONSE_TYPES.TEXT

  if (normalizedType.includes('json'))
    return RESPONSE_TYPES.JSON

  if (normalizedType.includes('xml'))
    return RESPONSE_TYPES.TEXT

  return RESPONSE_TYPES.BLOB
}

export const detectResponseType = contentType => {
  if (!contentType)
    return RESPONSE_TYPES.TEXT

  const normalizedType = contentType.toLowerCase().split(';', 1)[0].trim()
  return detectFromNormalized(normalizedType)
}

export {RESPONSE_TYPES}
