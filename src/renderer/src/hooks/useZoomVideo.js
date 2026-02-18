import { useRef, useEffect, useState } from "react";
import { storeVideoFlowData } from "../api/CustomerApi";

export function useZoomVideo() {
  const videoClientRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadZoomVideoClient = async () => {
      if (window.VideoClient) return;

      await new Promise((resolve, reject) => {
        const existing = document.querySelector(
          'script[data-zoom-video-client="true"]'
        );
        if (existing) {
          existing.addEventListener("load", resolve, { once: true });
          existing.addEventListener("error", reject, { once: true });
          return;
        }

        const s = document.createElement("script");
        s.src = "https://us01ccistatic.zoom.us/us01cci/web-sdk/video-client.js";
        s.async = true;
        s.defer = true;
        s.dataset.zoomVideoClient = "true";
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    };

    (async () => {
      try {
        await loadZoomVideoClient();
        if (cancelled) return;

        if (!videoClientRef.current) {
          videoClientRef.current = new window.VideoClient({});
          setIsReady(true);
        }
      } catch (e) {
        console.error("Failed to load video-client.js", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const startVideoCall = async (
    entryId,
    language,
    name = "Customer",
    callType = "video"
  ) => {
    if (!videoClientRef.current || !isReady) {
      console.error("Video client not initialized");
      return;
    }

    // Create a new video client instance for each call to avoid event listener conflicts
    const videoClient = new window.VideoClient({});

    // Listen for the engagement_started event specifically
    videoClient.on("engagement_started", async (payload) => {
      // Check if the payload contains the ID (usually in payload.engagementId)
      const engagementId = payload.engagementId;

      if (engagementId) {
        console.warn("Engagement ID captured early:", engagementId);

        try {
          await storeVideoFlowData({
            EngagementId: engagementId,
            Language: language,
            LanguageDB: language.replace("_Video", ""),
            CallType: callType,
          });
        } catch (err) {
          console.error("API call failed:", err);
        }
      }
    });

    try {
      await videoClient.init({
        entryId,
        name: sessionStorage.getItem("customer_name"),
      });
      // This starts the flow. We don't 'await' it for the API call
      // because our listener above handles the data as soon as it exists.
      videoClient.startVideo();
    } catch (err) {
      console.error("Failed to start video:", err);
    }
  };

  return {
    videoClient: videoClientRef.current,
    startVideoCall,
    isReady,
  };
}
