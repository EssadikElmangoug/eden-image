/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/comfyui/:path*',
        destination: 'http://comfyui.edenhub.io/:path*',
      },
    ]
  },
}

module.exports = nextConfig 