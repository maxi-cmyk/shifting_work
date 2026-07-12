/// <reference types="vite/client" />

interface Window {
  shiftworkDesktop?: {
    platform: string
    setFullscreen: (enabled: boolean) => Promise<void>
  }
}
