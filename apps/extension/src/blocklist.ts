// Lista canónica de sitios distractores comunes.
// IMPORTANTE: para que el content script se inyecte en un sitio NUEVO,
// también tenés que agregarlo en las "matches" del manifest.json
export const DEFAULT_BLOCKLIST: string[] = [
  // Redes sociales
  'instagram.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'snapchat.com',
  'pinterest.com',
  'tumblr.com',
  'threads.net',
  'linkedin.com',
  'bereal.com',

  // Video / Streaming
  'youtube.com',
  'twitch.tv',
  'netflix.com',
  'primevideo.com',
  'disneyplus.com',

  // Comunidades / Entretenimiento
  'reddit.com',
  '9gag.com',
  'buzzfeed.com',
  'imgur.com',
  'ifunny.co',
]
