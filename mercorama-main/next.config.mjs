/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  async redirects() {
    return [
      {
        source: '/contract',
        destination: '/deal-summary',
        permanent: true,
      },
      {
        source: '/pricing',
        destination: '/beta',
        permanent: true,
      },
      // App-level redirects only (static HTML pages handled by Nginx directly)
      { source: '/about', destination: '/about.html', permanent: false },
      { source: '/contact', destination: '/contact.html', permanent: false },
      { source: '/data-sources', destination: '/data-sources.html', permanent: false },
      { source: '/data-retention', destination: '/data-retention.html', permanent: false },
      { source: '/privacy', destination: '/privacy.html', permanent: false },
      { source: '/terms', destination: '/terms.html', permanent: false },
    ];
  },
}

export default nextConfig
