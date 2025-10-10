// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfills for Next.js API routes in tests
import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream } from 'stream/web'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ReadableStream = ReadableStream

// Polyfill for Request, Response, Headers (needed for Next.js API routes)
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url
      this.method = init.method || 'GET'
      this.headers = init.headers || {}
      this.body = init.body || null
      this._bodyInit = init.body
    }

    async json() {
      if (typeof this._bodyInit === 'string') {
        return JSON.parse(this._bodyInit)
      }
      return this._bodyInit
    }

    async text() {
      return this._bodyInit ? String(this._bodyInit) : ''
    }

    async formData() {
      // Return the body directly if it's already FormData
      if (this._bodyInit instanceof FormData) {
        return this._bodyInit
      }
      throw new Error('Body is not FormData')
    }

    get nextUrl() {
      return new URL(this.url)
    }
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.statusText = init.statusText || ''
      this.headers = init.headers || {}
      this._bodyInit = body
    }

    async json() {
      if (typeof this._bodyInit === 'string') {
        return JSON.parse(this._bodyInit)
      }
      return this._bodyInit
    }

    async text() {
      return this._bodyInit ? String(this._bodyInit) : ''
    }
  }
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this._headers = init
    }

    set(name, value) {
      this._headers[name] = value
    }

    get(name) {
      return this._headers[name]
    }

    has(name) {
      return name in this._headers
    }

    delete(name) {
      delete this._headers[name]
    }

    forEach(callback) {
      Object.keys(this._headers).forEach(key => {
        callback(this._headers[key], key, this)
      })
    }
  }
}

if (typeof global.FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {
      this._data = new Map()
    }

    append(name, value) {
      if (!this._data.has(name)) {
        this._data.set(name, [])
      }
      this._data.get(name).push(value)
    }

    get(name) {
      const values = this._data.get(name)
      return values ? values[0] : null
    }

    getAll(name) {
      return this._data.get(name) || []
    }

    has(name) {
      return this._data.has(name)
    }

    delete(name) {
      this._data.delete(name)
    }
  }
}

if (typeof global.File === 'undefined') {
  global.File = class File extends Blob {
    constructor(bits, name, options = {}) {
      super(bits, options)
      this.name = name
      this.lastModified = options.lastModified || Date.now()
    }
  }
}

if (typeof global.Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(parts = [], options = {}) {
      this.type = options.type || ''
      this.size = parts.reduce((acc, part) => {
        if (typeof part === 'string') {
          return acc + part.length
        }
        return acc + (part.length || 0)
      }, 0)
      this._parts = parts
    }

    async arrayBuffer() {
      const buffer = Buffer.concat(
        this._parts.map(part => {
          if (typeof part === 'string') {
            return Buffer.from(part)
          }
          return Buffer.from(part)
        })
      )
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    }

    async text() {
      return this._parts.join('')
    }
  }
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Polyfill for pointer capture (needed for Radix UI)
if (typeof Element.prototype.hasPointerCapture === 'undefined') {
  Element.prototype.hasPointerCapture = function() {
    return false
  }
}

if (typeof Element.prototype.setPointerCapture === 'undefined') {
  Element.prototype.setPointerCapture = function() {}
}

if (typeof Element.prototype.releasePointerCapture === 'undefined') {
  Element.prototype.releasePointerCapture = function() {}
}

// Polyfill for scrollIntoView (needed for Radix UI Select)
if (typeof Element.prototype.scrollIntoView === 'undefined') {
  Element.prototype.scrollIntoView = function() {}
}

// Polyfill for ResizeObserver (needed for Radix UI)
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
      this.callback = callback
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// Global test utilities
global.testUtils = {
  mockSession: (session) => {
    const { useSession } = require('next-auth/react')
    useSession.mockReturnValue({
      data: session,
      status: session ? 'authenticated' : 'unauthenticated',
    })
  },
}
