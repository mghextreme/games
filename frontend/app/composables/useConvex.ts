import { ConvexClient } from 'convex/browser'
import type { FunctionReference, FunctionArgs, FunctionReturnType } from 'convex/server'

let convexClient: ConvexClient | null = null

export function useConvex() {
  const config = useRuntimeConfig()
  
  // Initialize client (singleton)
  if (!convexClient && import.meta.client) {
    const url = config.public.convexUrl
    if (!url) {
      console.error('NUXT_PUBLIC_CONVEX_URL is not set')
    } else {
      convexClient = new ConvexClient(url)
    }
  }

  const client = convexClient

  // Query wrapper with reactive state
  function useQuery<Query extends FunctionReference<'query'>>(
    query: Query,
    args: FunctionArgs<Query> | (() => FunctionArgs<Query>)
  ) {
    const data = ref<FunctionReturnType<Query> | undefined>(undefined)
    const isLoading = ref(true)
    const error = ref<Error | null>(null)

    let unsubscribe: (() => void) | null = null

    const subscribe = () => {
      if (!client) return

      // Get current args (support reactive args)
      const currentArgs = typeof args === 'function' ? args() : args

      unsubscribe = client.onUpdate(query, currentArgs, (result) => {
        data.value = result
        isLoading.value = false
        error.value = null
      })
    }

    const cleanup = () => {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
    }

    // Watch for args changes if reactive
    if (typeof args === 'function') {
      watch(args, () => {
        cleanup()
        isLoading.value = true
        subscribe()
      }, { immediate: true })
    } else {
      onMounted(subscribe)
    }

    onUnmounted(cleanup)

    // Initial subscribe for non-reactive args
    if (typeof args !== 'function' && import.meta.client) {
      subscribe()
    }

    return {
      data: readonly(data),
      isLoading: readonly(isLoading),
      error: readonly(error),
    }
  }

  // Mutation wrapper
  function useMutation<Mutation extends FunctionReference<'mutation'>>(
    mutation: Mutation
  ) {
    const isLoading = ref(false)
    const error = ref<Error | null>(null)

    const mutate = async (args: FunctionArgs<Mutation>): Promise<FunctionReturnType<Mutation>> => {
      if (!client) {
        throw new Error('Convex client not initialized')
      }

      isLoading.value = true
      error.value = null

      try {
        const result = await client.mutation(mutation, args)
        return result
      } catch (err) {
        error.value = err instanceof Error ? err : new Error(String(err))
        throw error.value
      } finally {
        isLoading.value = false
      }
    }

    return {
      mutate,
      isLoading: readonly(isLoading),
      error: readonly(error),
    }
  }

  // Direct query (one-time fetch)
  async function query<Query extends FunctionReference<'query'>>(
    queryFn: Query,
    args: FunctionArgs<Query>
  ): Promise<FunctionReturnType<Query>> {
    if (!client) {
      throw new Error('Convex client not initialized')
    }
    return client.query(queryFn, args)
  }

  return {
    client,
    useQuery,
    useMutation,
    query,
  }
}
