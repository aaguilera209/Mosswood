import { useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';

interface VideoTrackingOptions {
  videoId: number;
  videoDuration?: number;
}

export function useVideoTracking({ videoId, videoDuration }: VideoTrackingOptions) {
  const { user } = useAuth();
  const sessionIdRef = useRef<string>(generateSessionId());
  const trackingDataRef = useRef({
    watchDuration: 0,
    lastTrackedTime: 0,
    hasTrackedInitialView: false,
    hasTracked30Seconds: false,
    hasTrackedCompletion: false
  });

  useEffect(() => {
    // Generate unique session ID for this viewing session
    sessionIdRef.current = generateSessionId();
    trackingDataRef.current = {
      watchDuration: 0,
      lastTrackedTime: 0,
      hasTrackedInitialView: false,
      hasTracked30Seconds: false,
      hasTrackedCompletion: false
    };
  }, [videoId]);

  const trackView = async (currentTime: number) => {
    try {
      const tracking = trackingDataRef.current;
      
      // Only track the initial view once when video starts playing
      if (!tracking.hasTrackedInitialView && currentTime >= 0) {
        tracking.hasTrackedInitialView = true;
        
        await apiRequest('POST', '/api/track-view', {
          video_id: videoId,
          session_id: sessionIdRef.current,
          watch_duration: 0,
          device_type: getDeviceType(),
          browser: getBrowser(),
          viewer_id: user?.id || null
        });
      }
    } catch (error) {
      console.error('Failed to track video view:', error);
    }
  };

  const trackTimeUpdate = async (currentTime: number) => {
    const tracking = trackingDataRef.current;
    
    // Update watch duration for continuous tracking (only count forward progress)
    if (currentTime > tracking.lastTrackedTime) {
      tracking.watchDuration += (currentTime - tracking.lastTrackedTime);
      tracking.lastTrackedTime = currentTime;
    }

    // Track milestones only once per session
    const shouldTrack30Seconds = !tracking.hasTracked30Seconds && tracking.watchDuration >= 30;
    const shouldTrackCompletion = !tracking.hasTrackedCompletion && videoDuration && (tracking.watchDuration / videoDuration) >= 0.9;

    if (shouldTrack30Seconds) {
      tracking.hasTracked30Seconds = true;
      try {
        await apiRequest('POST', '/api/track-view-milestone', {
          video_id: videoId,
          session_id: sessionIdRef.current,
          milestone: '30_seconds',
          watch_duration: Math.floor(tracking.watchDuration)
        });
      } catch (error) {
        console.error('Failed to track 30-second milestone:', error);
      }
    }

    if (shouldTrackCompletion) {
      tracking.hasTrackedCompletion = true;
      try {
        await apiRequest('POST', '/api/track-view-milestone', {
          video_id: videoId,
          session_id: sessionIdRef.current,
          milestone: 'completion',
          watch_duration: Math.floor(tracking.watchDuration)
        });
      } catch (error) {
        console.error('Failed to track completion milestone:', error);
      }
    }
  };

  return {
    sessionId: sessionIdRef.current,
    trackView,
    trackTimeUpdate,
    getWatchDuration: () => trackingDataRef.current.watchDuration
  };
}

function generateSessionId(): string {
  return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/tablet|ipad|playbook|silk/.test(userAgent)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)) {
    return 'mobile';
  }
  
  return 'desktop';
}

function getBrowser(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Unknown';
}