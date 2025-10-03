import { redactPII, detectPII, containsPII } from '@/lib/pii-redact'

/**
 * Unit Tests for PII Redaction
 *
 * Tests PII detection and masking:
 * - Phone number detection and masking
 * - Email detection and masking
 * - Room number patterns
 * - Reservation ID patterns
 * - Masking strategy: keep last 4 characters (***last4)
 */

describe('PII Redaction', () => {
  describe('redactPII', () => {
    describe('Phone number redaction', () => {
      it('should redact US phone numbers with dashes', () => {
        const text = 'Call me at 555-123-4567'
        const redacted = redactPII(text)
        expect(redacted).toBe('Call me at ***4567')
      })

      it('should redact international phone numbers', () => {
        const text = 'Contact +33 1 42 86 82 00'
        const redacted = redactPII(text)
        expect(redacted).toContain('***')
        expect(redacted).not.toContain('+33 1 42 86 82 00')
      })

      it('should redact phone numbers with dots', () => {
        const text = 'Phone: 555.123.4567'
        const redacted = redactPII(text)
        expect(redacted).toBe('Phone: ***4567')
      })

      it('should redact phone numbers with parentheses', () => {
        const text = 'My number is (555) 123-4567'
        const redacted = redactPII(text)
        expect(redacted).toContain('***')
        expect(redacted).not.toContain('(555) 123-4567')
      })

      it('should redact multiple phone numbers in text', () => {
        const text = 'Call 555-123-4567 or 555-987-6543'
        const redacted = redactPII(text)
        expect(redacted).toBe('Call ***4567 or ***6543')
      })

      it('should redact phone numbers with spaces', () => {
        const text = 'Contact: +1 555 123 4567'
        const redacted = redactPII(text)
        expect(redacted).toContain('***')
        expect(redacted).not.toContain('+1 555 123 4567')
      })
    })

    describe('Email redaction', () => {
      it('should redact simple email addresses', () => {
        const text = 'Email me at john.doe@example.com'
        const redacted = redactPII(text)
        expect(redacted).toBe('Email me at ***.com')
      })

      it('should redact email with plus sign', () => {
        const text = 'Send to user+tag@domain.co.uk'
        const redacted = redactPII(text)
        expect(redacted).toBe('Send to ***.com') // keeps last 4: .com (from .co.uk trimmed)
      })

      it('should redact multiple emails', () => {
        const text = 'Contact alice@example.com or bob@test.org'
        const redacted = redactPII(text)
        expect(redacted).toContain('***')
        expect(redacted).not.toContain('alice@example.com')
        expect(redacted).not.toContain('bob@test.org')
      })

      it('should redact emails with numbers and underscores', () => {
        const text = 'Reach out to user_123@company.net'
        const redacted = redactPII(text)
        expect(redacted).toBe('Reach out to ***.net')
      })

      it('should preserve text around emails', () => {
        const text = 'My email (test@example.com) is active'
        const redacted = redactPII(text)
        expect(redacted).toBe('My email (***.com) is active')
      })
    })

    describe('Room number redaction', () => {
      it('should redact room numbers with "room" keyword', () => {
        const text = 'I stayed in room 1234'
        const redacted = redactPII(text)
        expect(redacted).toBe('I stayed in ***1234')
      })

      it('should redact room numbers with "Room" capitalized', () => {
        const text = 'Room 5678 had issues'
        const redacted = redactPII(text)
        expect(redacted).toBe('***5678 had issues')
      })

      it('should redact room numbers with hash symbol', () => {
        const text = 'Problems in room #4321'
        const redacted = redactPII(text)
        expect(redacted).toBe('Problems in ***4321')
      })

      it('should redact French room numbers', () => {
        const text = 'Chambre 9876 était sale'
        const redacted = redactPII(text)
        expect(redacted).toBe('***9876 était sale')
      })

      it('should redact room numbers with "rm" abbreviation', () => {
        const text = 'Clean rm 777'
        const redacted = redactPII(text)
        expect(redacted).toBe('Clean ***777')
      })

      it('should handle 3-digit room numbers', () => {
        const text = 'Room 101 needs service'
        const redacted = redactPII(text)
        expect(redacted).toBe('***101 needs service')
      })
    })

    describe('Reservation ID redaction', () => {
      it('should redact reservation IDs with RES prefix', () => {
        const text = 'Booking RES ABC123XYZ'
        const redacted = redactPII(text)
        expect(redacted).toBe('Booking ***XYZ')
      })

      it('should redact reservation IDs with RESV prefix', () => {
        const text = 'RESV XYZ789ABC confirmed'
        const redacted = redactPII(text)
        expect(redacted).toBe('***ABC confirmed')
      })

      it('should redact reservation IDs with "reservation" keyword', () => {
        const text = 'Your reservation ABC123DEF456'
        const redacted = redactPII(text)
        expect(redacted).toBe('Your ***F456')
      })

      it('should redact French reservation IDs', () => {
        const text = 'Réservation XYZ123456'
        const redacted = redactPII(text)
        expect(redacted).toBe('***3456')
      })

      it('should redact reservation with hash', () => {
        const text = 'Reservation #ABC123XYZ789'
        const redacted = redactPII(text)
        expect(redacted).toBe('***Z789')
      })

      it('should handle mixed alphanumeric reservation IDs', () => {
        const text = 'RES A1B2C3D4E5F6'
        const redacted = redactPII(text)
        expect(redacted).toBe('***E5F6')
      })
    })

    describe('Mixed PII redaction', () => {
      it('should redact multiple types of PII in one text', () => {
        const text = 'Guest in room 1234 with reservation RES ABC123 called 555-123-4567 and emailed guest@hotel.com'
        const redacted = redactPII(text)
        expect(redacted).toContain('***1234') // room
        expect(redacted).toContain('***123') // reservation
        expect(redacted).toContain('***4567') // phone
        expect(redacted).toContain('***.com') // email
        expect(redacted).not.toContain('555-123-4567')
        expect(redacted).not.toContain('guest@hotel.com')
      })

      it('should preserve non-PII text', () => {
        const text = 'The checkout was smooth and staff was friendly'
        const redacted = redactPII(text)
        expect(redacted).toBe(text) // Should remain unchanged
      })
    })

    describe('Edge cases', () => {
      it('should handle empty string', () => {
        const redacted = redactPII('')
        expect(redacted).toBe('')
      })

      it('should handle null input gracefully', () => {
        const redacted = redactPII(null as any)
        expect(redacted).toBe(null)
      })

      it('should handle undefined input gracefully', () => {
        const redacted = redactPII(undefined as any)
        expect(redacted).toBe(undefined)
      })

      it('should handle non-string input gracefully', () => {
        const redacted = redactPII(123 as any)
        expect(redacted).toBe(123)
      })

      it('should handle very short PII (shorter than 4 chars)', () => {
        const text = 'rm 12' // Only 2 digits
        const redacted = redactPII(text)
        expect(redacted).toContain('***')
      })

      it('should handle text with only PII', () => {
        const text = 'user@example.com'
        const redacted = redactPII(text)
        expect(redacted).toBe('***.com')
      })

      it('should handle consecutive PII', () => {
        const text = 'test@example.com555-123-4567'
        const redacted = redactPII(text)
        expect(redacted).not.toContain('test@example.com')
        expect(redacted).not.toContain('555-123-4567')
      })
    })

    describe('Masking strategy', () => {
      it('should keep last 4 characters for email', () => {
        const text = 'longusername@example.com'
        const redacted = redactPII(text)
        expect(redacted).toBe('***.com')
      })

      it('should keep last 4 characters for phone', () => {
        const text = '555-123-4567'
        const redacted = redactPII(text)
        expect(redacted).toBe('***4567')
      })

      it('should show *** for very short values', () => {
        // When the matched value is <= 4 characters
        const text = 'rm 1' // Very short room number
        const redacted = redactPII(text)
        expect(redacted).toContain('***')
      })
    })
  })

  describe('detectPII', () => {
    it('should detect phone numbers', () => {
      const text = 'Call 555-123-4567'
      const detected = detectPII(text)
      expect(detected).toContain('phone')
    })

    it('should detect emails', () => {
      const text = 'Email: user@example.com'
      const detected = detectPII(text)
      expect(detected).toContain('email')
    })

    it('should detect room numbers', () => {
      const text = 'Room 1234'
      const detected = detectPII(text)
      expect(detected).toContain('room')
    })

    it('should detect reservation IDs', () => {
      const text = 'RES ABC123XYZ'
      const detected = detectPII(text)
      expect(detected).toContain('reservation')
    })

    it('should detect multiple PII types', () => {
      const text = 'Room 1234, RES ABC123, call 555-123-4567 or email user@example.com'
      const detected = detectPII(text)
      expect(detected).toContain('room')
      expect(detected).toContain('reservation')
      expect(detected).toContain('phone')
      expect(detected).toContain('email')
      expect(detected.length).toBe(4)
    })

    it('should return empty array for text without PII', () => {
      const text = 'The service was excellent'
      const detected = detectPII(text)
      expect(detected).toEqual([])
    })

    it('should handle empty string', () => {
      const detected = detectPII('')
      expect(detected).toEqual([])
    })

    it('should handle null input', () => {
      const detected = detectPII(null as any)
      expect(detected).toEqual([])
    })

    it('should handle undefined input', () => {
      const detected = detectPII(undefined as any)
      expect(detected).toEqual([])
    })

    it('should not return duplicates for same PII type', () => {
      const text = 'Call 555-123-4567 or 555-987-6543'
      const detected = detectPII(text)
      expect(detected).toEqual(['phone'])
    })
  })

  describe('containsPII', () => {
    it('should return true when PII is present', () => {
      const text = 'Email: user@example.com'
      expect(containsPII(text)).toBe(true)
    })

    it('should return false when no PII is present', () => {
      const text = 'Great service!'
      expect(containsPII(text)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(containsPII('')).toBe(false)
    })

    it('should return true for multiple PII types', () => {
      const text = 'Room 123, call 555-1234'
      expect(containsPII(text)).toBe(true)
    })

    it('should handle edge cases gracefully', () => {
      expect(containsPII(null as any)).toBe(false)
      expect(containsPII(undefined as any)).toBe(false)
    })
  })
})
