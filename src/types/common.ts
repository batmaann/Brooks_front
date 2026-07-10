export type ApiListResponse<T> = T[] | { results: T[] }

export type SortDirection = 'asc' | 'desc' | null
