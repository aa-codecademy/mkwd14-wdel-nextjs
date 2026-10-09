// Next.js configuration. Changes here need a restart of `npm run dev`.
// All options: https://nextjs.org/docs/app/api-reference/config/next-config-js
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // next/image only optimises images from hosts you allow. This is a security
  // measure: otherwise anyone could use your server to resize any image on
  // the internet. Our mock event covers come from Unsplash, so we allow that
  // host (HTTPS only).
  // https://nextjs.org/docs/app/api-reference/components/image#remotepatterns
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'loremflickr.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
};

export default nextConfig;
