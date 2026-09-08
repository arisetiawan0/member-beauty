import type { NextConfig } from 'next';

const config: NextConfig = {
  /**
   * `next build` and `next dev` share .next by default, so building while the
   * dev server runs corrupts its routes (pages start 404-ing). `npm run
   * build:check` points the build at its own directory instead.
   */
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default config;
