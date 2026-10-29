import { describe, expect, it } from 'vitest';
import { createFriendInfoContent } from '@/components/social/FriendsLocationMap';

describe('createFriendInfoContent', () => {
  it('renders a full name and initial as text rather than interpreting profile HTML', () => {
    const content = createFriendInfoContent({
      full_name: '<img src=x onerror=alert(1)>',
      username: 'reader',
      bio: '<script>alert("xss")</script>',
    });

    expect(content.querySelector('img')).toBeNull();
    expect(content.querySelector('script')).toBeNull();
    expect(content.querySelector('h3')?.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(content.textContent).toContain('<script>alert("xss")</script>');
    expect(content.querySelector('div div')?.textContent?.trim().charAt(0)).toBe('<');
  });

  it('falls back to username and omits blank biographies', () => {
    const content = createFriendInfoContent({ username: '  bookfriend  ', bio: '   ' });

    expect(content.querySelector('h3')?.textContent).toBe('  bookfriend  ');
    expect(content.textContent).toContain('Friend');
    expect(content.querySelectorAll('p')).toHaveLength(1);
  });

  it('uses safe defaults when profile fields are missing', () => {
    const content = createFriendInfoContent({});

    expect(content.querySelector('h3')?.textContent).toBe('Friend');
    expect(content.textContent).toContain('Friend');
    expect(content.querySelector('div div')?.textContent?.trim().charAt(0)).toBe('F');
    expect(content.querySelectorAll('p')).toHaveLength(1);
  });

  it('trims a non-empty biography before displaying it', () => {
    const content = createFriendInfoContent({ full_name: 'Reader', bio: '  Loves classic books  ' });

    expect(content.querySelectorAll('p')[1]?.textContent).toBe('Loves classic books');
  });
});
