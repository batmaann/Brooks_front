export function useFormatters() {
  function currency(value: number | string | null | undefined, code = 'RUB') {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: code || 'RUB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0))
  }

  function number(value: number | string | null | undefined, digits = 0) {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(Number(value || 0))
  }

  function optionalNumber(value: number | string | null | undefined, suffix = '', digits = 0) {
    if (value === null || value === undefined || value === '') return '—'
    return `${number(value, digits)}${suffix}`
  }

  function optionalCurrency(value: number | string | null | undefined, code = 'RUB') {
    if (value === null || value === undefined || value === '') return '—'
    return currency(value, code)
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${value}T00:00:00`))
  }

  return {
    currency,
    formatDate,
    number,
    optionalCurrency,
    optionalNumber,
  }
}
