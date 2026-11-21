import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { isAutomatedCrawler } from './botDetection.ts';

Deno.test('identifies common search and SEO crawlers', () => {
  const crawlers = [
    'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'SemrushBot/7~bl',
    'DuckDuckBot/1.1',
    'GPTBot/1.0',
  ];
  for (const userAgent of crawlers) assertEquals(isAutomatedCrawler(userAgent), true);
});

Deno.test('does not classify ordinary browsers as crawlers', () => {
  const browsers = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  ];
  for (const userAgent of browsers) assertEquals(isAutomatedCrawler(userAgent), false);
});

Deno.test('handles missing user-agent values safely', () => {
  assertEquals(isAutomatedCrawler(null), false);
  assertEquals(isAutomatedCrawler(undefined), false);
  assertEquals(isAutomatedCrawler(''), false);
});
