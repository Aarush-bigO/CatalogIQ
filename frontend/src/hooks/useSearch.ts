import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { SearchResult } from '../types'

export function useSearch(query: string, searchType: string = 'hybrid') {
  return useQuery({
    queryKey: ['search', query, searchType],
    queryFn: async () => {
      if (!query.trim()) return { results: [], total_results: 0, execution_time_ms: 0 }
      const { data } = await api.post<{
        results: SearchResult[]
        total_results: number
        execution_time_ms: number
      }>('/search/', {
        query,
        search_type: searchType,
      })
      return data
    },
    enabled: query.length > 1,
  })
}

export function useAutocomplete(query: string) {
  return useQuery({
    queryKey: ['autocomplete', query],
    queryFn: async () => {
      if (!query.trim()) return []
      const { data } = await api.get<{ query: string; suggestions: string[] }>(
        '/search/autocomplete',
        { params: { q: query, limit: 8 } }
      )
      return data.suggestions || []
    },
    enabled: query.length > 1,
  })
}
