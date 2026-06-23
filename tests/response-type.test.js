/* eslint-disable max-lines */
import {describe, test, expect} from 'vitest'
import {detectResponseType, RESPONSE_TYPES} from '$src/response-type.js'

describe('JSON content types', () => {
  test('detects standard application/json', () => {
    expect(detectResponseType('application/json')).toBe(RESPONSE_TYPES.JSON)
  })

  test('detects application/json with charset', () => {
    expect(detectResponseType('application/json; charset=utf-8'))
      .toBe(RESPONSE_TYPES.JSON)
  })

  test('detects JSON-LD', () => {
    expect(detectResponseType('application/ld+json')).toBe(RESPONSE_TYPES.JSON)
  })

  test('detects JSON API', () => {
    const result = detectResponseType('application/vnd.api+json')
    expect(result).toBe(RESPONSE_TYPES.JSON)
  })

  test('detects custom JSON types by pattern', () => {
    expect(detectResponseType('application/vnd.custom+json'))
      .toBe(RESPONSE_TYPES.JSON)
  })
})

describe('Text content types', () => {
  test('detects text/plain', () => {
    expect(detectResponseType('text/plain')).toBe(RESPONSE_TYPES.TEXT)
  })

  test('detects text/html', () => {
    expect(detectResponseType('text/html')).toBe(RESPONSE_TYPES.TEXT)
  })

  test('detects text/xml', () => {
    expect(detectResponseType('text/xml')).toBe(RESPONSE_TYPES.TEXT)
  })

  test('detects text/csv', () => {
    expect(detectResponseType('text/csv')).toBe(RESPONSE_TYPES.TEXT)
  })

  test('detects text/css', () => {
    expect(detectResponseType('text/css')).toBe(RESPONSE_TYPES.TEXT)
  })

  test('detects text/javascript', () => {
    expect(detectResponseType('text/javascript')).toBe(RESPONSE_TYPES.TEXT)
  })

  test('detects any text/* by pattern', () => {
    expect(detectResponseType('text/markdown')).toBe(RESPONSE_TYPES.TEXT)
  })
})

describe('XML content types', () => {
  test('detects application/xml', () => {
    expect(detectResponseType('application/xml')).toBe(RESPONSE_TYPES.TEXT)
  })

  test('detects application/xhtml+xml', () => {
    const result = detectResponseType('application/xhtml+xml')
    expect(result).toBe(RESPONSE_TYPES.TEXT)
  })

  test('detects RSS', () => {
    expect(detectResponseType('application/rss+xml')).toBe(RESPONSE_TYPES.TEXT)
  })

  test('detects Atom', () => {
    expect(detectResponseType('application/atom+xml')).toBe(RESPONSE_TYPES.TEXT)
  })

  test('detects SOAP', () => {
    expect(detectResponseType('application/soap+xml')).toBe(RESPONSE_TYPES.TEXT)
  })

  test('detects SVG as text', () => {
    expect(detectResponseType('image/svg+xml')).toBe(RESPONSE_TYPES.TEXT)
  })

  test('detects custom XML by pattern', () => {
    expect(detectResponseType('application/vnd.custom+xml'))
      .toBe(RESPONSE_TYPES.TEXT)
  })
})

describe('Image content types', () => {
  test('detects JPEG', () => {
    expect(detectResponseType('image/jpeg')).toBe(RESPONSE_TYPES.BLOB)
  })

  test('detects PNG', () => {
    expect(detectResponseType('image/png')).toBe(RESPONSE_TYPES.BLOB)
  })

  test('detects GIF', () => {
    expect(detectResponseType('image/gif')).toBe(RESPONSE_TYPES.BLOB)
  })

  test('detects WebP', () => {
    expect(detectResponseType('image/webp')).toBe(RESPONSE_TYPES.BLOB)
  })

  test('detects BMP', () => {
    expect(detectResponseType('image/bmp')).toBe(RESPONSE_TYPES.BLOB)
  })

  test('detects TIFF', () => {
    expect(detectResponseType('image/tiff')).toBe(RESPONSE_TYPES.BLOB)
  })
})

describe('Document content types', () => {
  test('detects PDF', () => {
    expect(detectResponseType('application/pdf')).toBe(RESPONSE_TYPES.BLOB)
  })

  test('detects Word documents (doc)', () => {
    expect(detectResponseType('application/msword')).toBe(RESPONSE_TYPES.BLOB)
  })
})

describe('Archive content types', () => {
  test('detects ZIP', () => {
    expect(detectResponseType('application/zip')).toBe(RESPONSE_TYPES.BLOB)
  })

  test('detects GZIP', () => {
    expect(detectResponseType('application/gzip')).toBe(RESPONSE_TYPES.BLOB)
  })

  test('detects octet-stream', () => {
    const result = detectResponseType('application/octet-stream')
    expect(result).toBe(RESPONSE_TYPES.BLOB)
  })
})

describe('Audio content types', () => {
  test('detects MP3', () => {
    expect(detectResponseType('audio/mpeg')).toBe(RESPONSE_TYPES.BLOB)
  })

  test('detects WAV', () => {
    expect(detectResponseType('audio/wav')).toBe(RESPONSE_TYPES.BLOB)
  })

  test('detects OGG', () => {
    expect(detectResponseType('audio/ogg')).toBe(RESPONSE_TYPES.BLOB)
  })
})

describe('Video content types', () => {
  test('detects MP4', () => {
    expect(detectResponseType('video/mp4')).toBe(RESPONSE_TYPES.BLOB)
  })

  test('detects MPEG', () => {
    expect(detectResponseType('video/mpeg')).toBe(RESPONSE_TYPES.BLOB)
  })

  test('detects WebM', () => {
    expect(detectResponseType('video/webm')).toBe(RESPONSE_TYPES.BLOB)
  })
})

describe('Font content types', () => {
  test('detects WOFF', () => {
    expect(detectResponseType('font/woff')).toBe(RESPONSE_TYPES.BLOB)
  })

  test('detects WOFF2', () => {
    expect(detectResponseType('font/woff2')).toBe(RESPONSE_TYPES.BLOB)
  })

  test('detects TTF', () => {
    expect(detectResponseType('font/ttf')).toBe(RESPONSE_TYPES.BLOB)
  })

  test('detects OTF', () => {
    expect(detectResponseType('font/otf')).toBe(RESPONSE_TYPES.BLOB)
  })
})

describe('Edge cases', () => {
  test('handles missing content-type', () => {
    expect(detectResponseType('')).toBe(RESPONSE_TYPES.TEXT)
    expect(detectResponseType(null)).toBe(RESPONSE_TYPES.TEXT)
    expect(detectResponseType(undefined)).toBe(RESPONSE_TYPES.TEXT)
  })

  test('handles uppercase content-type', () => {
    expect(detectResponseType('APPLICATION/JSON')).toBe(RESPONSE_TYPES.JSON)
  })

  test('handles mixed case content-type', () => {
    expect(detectResponseType('Application/Json')).toBe(RESPONSE_TYPES.JSON)
  })

  test('strips parameters from content-type', () => {
    const result = detectResponseType('text/html; charset=utf-8')
    expect(result).toBe(RESPONSE_TYPES.TEXT)
  })

  test('handles whitespace', () => {
    expect(detectResponseType('  application/json  ')).toBe(RESPONSE_TYPES.JSON)
  })

  test('defaults unknown types to blob', () => {
    expect(detectResponseType('application/unknown')).toBe(RESPONSE_TYPES.BLOB)
  })
})
