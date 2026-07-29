/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // HTML5-QRCode scanner requires non-strict mode for double mount cleanup in dev
};

module.exports = nextConfig;
