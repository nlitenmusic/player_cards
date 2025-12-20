/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure Turbopack/Next uses the subfolder containing the app as the workspace root
  turbopack: {
    root: 'products/player-cards-next'
  }
};

module.exports = nextConfig;
