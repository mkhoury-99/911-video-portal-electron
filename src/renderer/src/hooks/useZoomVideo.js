import { useRef, useEffect, useState } from 'react'
import { storeVideoFlowData } from '../api/CustomerApi'

function getOrCreateSelfVideoCanvas() {
  const existing = document.querySelector('canvas[data-zoom-self-video="true"]')
  if (existing instanceof HTMLCanvasElement) return existing

  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 480
  canvas.dataset.zoomSelfVideo = 'true'
  canvas.style.position = 'fixed'
  canvas.style.left = '-10000px'
  canvas.style.top = '-10000px'
  canvas.style.pointerEvents = 'none'
  canvas.style.opacity = '0'
  document.body.appendChild(canvas)
  return canvas
}

export function useZoomVideo() {
  const videoClientRef = useRef(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadZoomVideoClient = async () => {
      if (window.VideoClient) return

      await new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-zoom-video-client="true"]')
        if (existing) {
          existing.addEventListener('load', resolve, { once: true })
          existing.addEventListener('error', reject, { once: true })
          return
        }

        const s = document.createElement('script')
        s.src = 'https://us01ccistatic.zoom.us/us01cci/web-sdk/video-client.js'
        s.async = true
        s.defer = true
        s.dataset.zoomVideoClient = 'true'
        s.onload = resolve
        s.onerror = reject
        document.head.appendChild(s)
      })
    }

    ;(async () => {
      try {
        await loadZoomVideoClient()
        if (cancelled) return

        if (!videoClientRef.current) {
          videoClientRef.current = new window.VideoClient({})
          setIsReady(true)
        }
      } catch (e) {
        console.error('Failed to load video-client.js', e)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const startVideoCall = async (entryId, language, name = 'Customer', callType = 'video') => {
    if (!videoClientRef.current || !isReady) {
      console.error('Video client not initialized')
      return
    }

    const videoClient = new window.VideoClient({})

    videoClient.on('engagement_started', async (payload) => {
      const engagementId = payload?.engagementId
      if (engagementId) {
        console.warn('Engagement ID captured early:', engagementId)
        try {
          await storeVideoFlowData({
            EngagementId: engagementId,
            Language: language,
            LanguageDB: language.replace('_Video', ''),
            CallType: callType
          })
        } catch (err) {
          console.error('API call failed:', err)
        }
      }
    })

    try {
      await videoClient.init({
        entryId,
        name: sessionStorage.getItem('customer_name') || name
      })
      const canvas = getOrCreateSelfVideoCanvas()

      try {
        await videoClient.startVideo({ canvas, hd: true })
      } catch (firstErr) {
        try {
          await videoClient.startVideo(canvas)
        } catch (secondErr) {
          console.warn('startVideo with canvas failed, retrying without canvas', secondErr)
          await videoClient.startVideo()
        }
        console.warn('startVideo object signature failed, fallback applied', firstErr)
      }
    } catch (err) {
      console.error('Failed to start video:', err)
    }
  }

  return {
    videoClient: videoClientRef.current,
    startVideoCall,
    isReady
  }
}
