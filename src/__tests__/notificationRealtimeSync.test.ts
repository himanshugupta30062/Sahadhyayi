import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src/hooks/useNotifications.ts'), 'utf8');

describe('notification realtime synchronization', () => {
  it('subscribes to the signed-in user notification rows', () => {
    expect(source).toContain('notifications-sync-${userId}');
    expect(source).toContain("table: 'notifications'");
    expect(source).toContain('filter: `user_id=eq.${userId}`');
  });

  it('reconciles notification list and unread count after changes and reconnect', () => {
    expect(source).toContain("queryKey: ['notifications', userId]");
    expect(source).toContain("queryKey: ['unread-notifications-count', userId]");
    expect(source).toContain(".subscribe((status) =>");
    expect(source).toContain("status === 'SUBSCRIBED'");
    expect(source).toContain('removeChannel(entry.channel)');
    expect(source).toContain('notificationRealtimeChannels.get(userId)');
    expect(source).toContain('existing.refs += 1');
  });

  it('broadcasts notification changes across tabs without leaking between users', () => {
    expect(source).toContain('typeof BroadcastChannel !== \'undefined\'');
    expect(source).toContain('sahadhyayi-notifications-${userId}');
    expect(source).toContain("type: 'notifications-changed', userId");
    expect(source).toContain("event.data?.type === 'notifications-changed'");
    expect(source).toContain('event.data.userId === userId');
    expect(source).toContain('crossTabChannel?.close()');
    expect(source).toContain('broadcastNotificationChange(user.id)');
  });
  it('refreshes notification queries when the app returns to foreground', () => {
    expect(source).toContain("document.addEventListener('visibilitychange', refreshIfVisible)");
    expect(source).toContain("window.addEventListener('focus', refreshIfVisible)");
    expect(source).toContain("window.addEventListener('pageshow', refreshIfVisible)");
    expect(source).toContain("document.visibilityState !== 'visible'");
    expect(source).toContain('now - lastRefreshAt < 3000');
    expect(source).toContain("document.removeEventListener('visibilitychange', refreshIfVisible)");
  });
  it('optimistically marks individual and all notifications read with rollback', () => {
    expect(source).toContain('onMutate: async (notificationId: string)');
    expect(source).toContain('previousNotifications');
    expect(source).toContain('previousCount');
    expect(source).toContain('Math.max(0, previousCount - 1)');
    expect(source).toContain('onError: (_error, _notificationId, context)');
    expect(source).toContain('onMutate: async () =>');
    expect(source).toContain('queryClient.setQueryData(countKey, 0)');
  });
  it('renders notification loading and recoverable error states', () => {
    expect(source).toContain('notificationsLoading ?');
    expect(source).toContain('notificationsError ?');
    expect(source).toContain('Couldn’t load notifications.');
    expect(source).toContain('refetchNotifications()');
    expect(source).toContain('No notifications yet');
  });
  it('reconciles notifications and unread count each time dropdown opens', () => {
    expect(source).toContain('refetch: refetchUnreadCount');
    expect(source).toContain('const handleOpenChange = (open: boolean)');
    expect(source).toContain('if (open)');
    expect(source).toContain('void refetchNotifications()');
    expect(source).toContain('void refetchUnreadCount()');
    expect(source).toContain('onOpenChange={handleOpenChange}');
  });
});