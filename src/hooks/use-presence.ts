'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type PresenceStatus = 'online' | 'offline' | 'away';

interface UsePresenceOptions {
  userId: string;
  conversationId?: string;
  enabled?: boolean;
}

// Throttle duration for HTTP updates (30 seconds)
const HTTP_THROTTLE_MS = 30 * 1000;
// Heartbeat interval (60 seconds)
const HEARTBEAT_MS = 60 * 1000;
// Away timeout (5 minutes)
const AWAY_TIMEOUT_MS = 5 * 60 * 1000;

export function usePresence({
  userId,
  conversationId,
  enabled = true,
}: UsePresenceOptions) {
  const supabaseRef = useRef(createClient());
  const presenceChannelRef = useRef<ReturnType<typeof supabaseRef.current.channel> | null>(null);
  const awayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHttpUpdateRef = useRef<number>(0);
  const currentStatusRef = useRef<PresenceStatus>('online');

  // Throttled HTTP update - only sends if throttle period has passed
  const sendHttpUpdate = useCallback(async (status: PresenceStatus) => {
    if (!enabled || !userId) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastHttpUpdateRef.current;

    // Always allow offline status (for sendBeacon) or if throttle period passed
    if (status !== 'offline' && timeSinceLastUpdate < HTTP_THROTTLE_MS) {
      return;
    }

    lastHttpUpdateRef.current = now;
    currentStatusRef.current = status;

    try {
      await fetch('/api/users/presence', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          last_seen: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }, [userId, enabled]);

  // Broadcast presence via Realtime (instant, no HTTP)
  const broadcastPresence = useCallback((status: PresenceStatus) => {
    if (!enabled || !presenceChannelRef.current) return;

    presenceChannelRef.current.track({
      user_id: userId,
      status,
      online_at: new Date().toISOString(),
    });
  }, [userId, enabled]);

  // Combined update: broadcast instantly + throttled HTTP
  const updatePresence = useCallback((status: PresenceStatus) => {
    // Always broadcast instantly via Realtime
    broadcastPresence(status);
    
    // Throttled HTTP update
    sendHttpUpdate(status);
  }, [broadcastPresence, sendHttpUpdate]);

  // Set up away timeout (user inactive for 5 minutes)
  const resetAwayTimer = useCallback(() => {
    if (awayTimeoutRef.current) {
      clearTimeout(awayTimeoutRef.current);
    }

    awayTimeoutRef.current = setTimeout(() => {
      updatePresence('away');
    }, AWAY_TIMEOUT_MS);
  }, [updatePresence]);

  // Heartbeat to maintain online status in database
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      // Only send heartbeat if we're still online
      if (currentStatusRef.current === 'online') {
        sendHttpUpdate('online');
      }
    }, HEARTBEAT_MS);
  }, [sendHttpUpdate]);

  // Handle visibility change
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away');
        if (awayTimeoutRef.current) {
          clearTimeout(awayTimeoutRef.current);
        }
      } else {
        updatePresence('online');
        resetAwayTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, updatePresence, resetAwayTimer]);

  // Handle user activity (throttled)
  useEffect(() => {
    if (!enabled) return;

    const handleActivity = () => {
      // Only update if currently away or offline
      if (currentStatusRef.current !== 'online') {
        updatePresence('online');
      }
      resetAwayTimer();
    };

    // Listen for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Set initial online status
    updatePresence('online');
    resetAwayTimer();
    startHeartbeat();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);

      if (awayTimeoutRef.current) {
        clearTimeout(awayTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [enabled, updatePresence, resetAwayTimer, startHeartbeat]);

  // Handle beforeunload (set offline when leaving)
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable delivery on page unload
      const data = JSON.stringify({
        status: 'offline',
        last_seen: new Date().toISOString(),
      });

      navigator.sendBeacon('/api/users/presence', data);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled]);

  // Set up Realtime Presence channel
  useEffect(() => {
    if (!enabled) return;

    const channelKey = conversationId ? `presence:${conversationId}` : 'presence:global';
    
    const channel = supabaseRef.current.channel(channelKey, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('Presence sync:', state);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            status: currentStatusRef.current,
            online_at: new Date().toISOString(),
          });
        }
      });

    presenceChannelRef.current = channel;

    return () => {
      supabaseRef.current.removeChannel(channel);
    };
  }, [enabled, conversationId, userId]);

  return {
    updatePresence,
  };
}

// Hook to subscribe to other users' presence via Realtime
export function usePresenceSubscription(
  userIds: string[],
  onPresenceChange?: (userId: string, status: PresenceStatus, lastSeen: string) => void
) {
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    if (userIds.length === 0) return;

    const channel = supabaseRef.current.channel('presence-updates');

    channel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=in.(${userIds.join(',')})`,
        },
        (payload) => {
          const { id, status, last_seen } = payload.new as {
            id: string;
            status: PresenceStatus;
            last_seen: string;
          };
          
          if (onPresenceChange) {
            onPresenceChange(id, status, last_seen);
          }
        }
      )
      .subscribe();

    return () => {
      supabaseRef.current.removeChannel(channel);
    };
  }, [userIds.join(','), onPresenceChange]);
}
