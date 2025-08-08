import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Sahadhyayi',
  description: 'Docs for architecture, AI, security, and contributing',
  themeConfig: {
    nav: [
      { text: 'Architecture', link: '/architecture' },
      { text: 'AI', link: '/ai' },
      { text: 'Security', link: '/security' },
      { text: 'Contributing', link: '/contributing' },
      { text: 'Runbooks', link: '/runbooks' },
    ],
    sidebar: [
      { text: 'Overview', link: '/' },
      { text: 'Architecture', link: '/architecture' },
      { text: 'AI Pipeline', link: '/ai' },
      { text: 'Security', link: '/security' },
      { text: 'Contributing', link: '/contributing' },
      { text: 'Runbooks', link: '/runbooks' },
      { text: 'ADR Index', link: '/adr' }
    ]
  }
});
