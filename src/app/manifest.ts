import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Waraka Transcriptions',
        short_name: 'Waraka',
        description: 'Collaborative Arabic Manuscript Transcription Platform',
        start_url: '/',
        display: 'standalone',
        background_color: '#FAF7F2',
        theme_color: '#155E63',
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            }
        ],
    }
}
