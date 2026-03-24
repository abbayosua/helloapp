'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type PresenceStatus = 'online' | 'offline' | 'away';

interface UsePresenceOptions {
  userId: string;
  conversationId?: string;
  enabled?: boolean;
}

export function usePresence({
  userId,
  conversationId,
  enabled = true,
}: UsePresenceOptions) {
  const supabaseRef = useRef(createClient());
  const presenceChannelRef = useRef<ReturnType<typeof supabaseRef.current.channel> | null>(null);
  const awayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update presence status
  const updatePresence = useCallback(async (status: PresenceStatus) => {
    if (!enabled || !userId) return;

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

  // Set up away timeout (user inactive for 5 minutes)
  const resetAwayTimer = useCallback(() => {
    if (awayTimeoutRef.current) {
      clearTimeout(awayTimeoutRef.current);
    }

    awayTimeoutRef.current = setTimeout(() => {
      updatePresence('away');
    }, 5 * 60 * 1000); // 5 minutes
  }, [updatePresence]);

  // Handle visibility change
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away');
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

  // Handle user activity
  useEffect(() => {
    if (!enabled) return;

    const handleActivity = () => {
      updatePresence('online');
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

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);

      if (awayTimeoutRef.current) {
        clearTimeout(awayTimeoutRef.current);
      }
    };
  }, [enabled, updatePresence, resetAwayTimer]);

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

  // Track presence in conversation channel (for realtime)
  useEffect(() => {
    if (!enabled || !conversationId) return;

    const channel = supabaseRef.current.channel(`presence:${conversationId}`, {
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

// Hook to subscribe to other users' presence
export function usePresenceSubscription(userIds: string[]) {
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
          console.log('Presence update:', payload);
        }
      )
      .subscribe();

    return () => {
      supabaseRef.current.removeChannel(channel);
    };
  }, [userIds.join(',')]);
}
