import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Khatt-GPT Transcriptions',
        short_name: 'Khatt-GPT',
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
