/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Strict Modeを無効化（開発時の二重レンダリング防止）
  reactStrictMode: false,
  
  // Fast Refreshを制限（開発時の過度な再レンダリング防止）
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules/**', '**/.next/**'],
        poll: false, // ポーリングを無効化
      }
    }
    return config
  },
  
  // 開発時のパフォーマンス最適化
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
        pathname: '/api/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
      }
    ],
    // 開発環境では画像最適化を無効化（アップロード画像対応のため）
    unoptimized: process.env.NODE_ENV === 'development',
    // アップロード画像のサイズ制限を緩和
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}

module.exports = nextConfig