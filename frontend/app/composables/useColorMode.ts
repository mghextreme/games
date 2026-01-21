import { useDark, useToggle } from '@vueuse/core'

const COLOR_MODE_KEY = 'game_rooms_color_mode'

export function useColorMode() {
  // useDark automatically handles:
  // - Adding/removing 'dark' class on <html>
  // - Persisting preference to localStorage
  // - SSR-safe initialization
  const isDark = useDark({
    storageKey: COLOR_MODE_KEY,
    initialValue: 'dark', // Default to dark mode
  })

  const toggleColorMode = useToggle(isDark)

  return {
    isDark: readonly(isDark),
    toggleColorMode,
  }
}
