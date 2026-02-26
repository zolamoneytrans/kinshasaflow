import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://kinshasaflow.online'
  
  const routes = [
    '',
    '/reports',
    '/live-traffic',
    '/map',
    '/assistant',
    '/signaler-embouteillage',
    '/police-routiere',
    '/routes',
    '/annonces',
    '/logement',
    '/transport',
    '/location-voiture',
    '/evenements',
    '/videos',
    '/kinshasa',
    '/contact',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))
}
