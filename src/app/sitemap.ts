import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://kinshasaflow.online'
  
  const routes = [
    { url: '', priority: 1, changeFrequency: 'always' as const },
    { url: '/live-traffic', priority: 0.9, changeFrequency: 'always' as const },
    { url: '/reports', priority: 0.9, changeFrequency: 'always' as const },
    { url: '/k-flow-nav', priority: 0.9, changeFrequency: 'always' as const },
    { url: '/map', priority: 0.8, changeFrequency: 'daily' as const },
    { url: '/assistant', priority: 0.8, changeFrequency: 'daily' as const },
    { url: '/tourisme', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/logement', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/location-voiture', priority: 0.7, changeFrequency: 'weekly' as const },
    { url: '/transport', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/police-routiere', priority: 0.6, changeFrequency: 'weekly' as const },
    { url: '/annonces', priority: 0.6, changeFrequency: 'daily' as const },
    { url: '/restaurants', priority: 0.7, changeFrequency: 'weekly' as const },
    { url: '/evenements', priority: 0.6, changeFrequency: 'daily' as const },
    { url: '/videos', priority: 0.6, changeFrequency: 'always' as const },
    { url: '/kinshasa', priority: 0.5, changeFrequency: 'monthly' as const },
    { url: '/contact', priority: 0.4, changeFrequency: 'monthly' as const },
    { url: '/privacy', priority: 0.3, changeFrequency: 'monthly' as const },
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
