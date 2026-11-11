import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src/hooks/useNotifications.ts'), 'utf8');

describe('notification realtime synchronization', () => {
  it('subscribes to the signed-in user notification rows', () => {
    expect(source).toMatch(/\.channel\(\`notifications-sync-\$\{userId\}\`\)/);
    expect(source).toMatch(/table: 'notifications'/);
    expect(source).toMatch(/filter: \`user_id=eq\.\$\{userId\}\`/);
  });
  it('refreshes both notification list and unread badge on row changes', () => {
    expect(source).toMatch(/invalidateQueries\(\{ queryKey: \['notifications', userId\] \}\)/);
    expect(source).toMatch(/invalidateQueries\(\{ queryKey: \['unread-notifications-count', userId\] \}\)/);
    expect(source).toMatch(/removeChannel\(channel\)/);
  });
});
