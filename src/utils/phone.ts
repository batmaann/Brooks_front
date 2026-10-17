/** Accept Russian domestic numbers and the +7 / 8 prefixes. */
export function phoneDigits(value: string): string {
  let digits = value.replace(/\D/g, '')
  if (value.trim().startsWith('+7') || ((digits.startsWith('7') || digits.startsWith('8')) && digits.length !== 10)) {
    digits = digits.slice(1)
  }
  return digits.slice(0, 10)
}

export function formatPhone(digits: string): string {
  if (!digits) return ''
  let value = `+7 (${digits.slice(0, 3)}`
  if (digits.length >= 3) value += ') '
  if (digits.length > 3) value += digits.slice(3, 6)
  if (digits.length > 6) value += `-${digits.slice(6, 8)}`
  if (digits.length > 8) value += `-${digits.slice(8, 10)}`
  return value
}

/** Place the cursor after a national digit, skipping mask punctuation. */
export function phoneCaret(value: string, count: number): number {
  if (!count) return Math.min(4, value.length)
  let seen = 0
  for (let index = 4; index < value.length; index++) {
    if (/\d/.test(value[index]!) && ++seen === count) {
      let position = index + 1
      while (position < value.length && /\D/.test(value[position]!)) position++
      return position
    }
  }
  return value.length
}
