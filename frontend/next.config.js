/** @type {import('next').NextConfig} */
const nextConfig = {
  // API代理配置
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/api/:path*', // Docker内部通信
      },
    ]
  },

  // 图片优化配置
  images: {
    domains: ['localhost', '127.0.0.1', 'backend'],
  },

  // 编译优化
  compiler: {
    // 移除console.log (生产环境)
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig