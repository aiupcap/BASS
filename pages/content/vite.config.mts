import { resolve } from 'node:path';
import { makeEntryPointPlugin } from '@bass/hmr';
import { withPageConfig } from '@bass/vite-config';
import { IS_DEV } from '@bass/env';

const rootDir = resolve(import.meta.dirname);
const srcDir = resolve(rootDir, 'src');

export default withPageConfig({
  resolve: {
    alias: {
      '@src': srcDir,
    },
  },
  publicDir: resolve(rootDir, 'public'),
  plugins: [IS_DEV && makeEntryPointPlugin()],
  build: {
    lib: {
      name: 'ContentScript',
      fileName: 'index',
      formats: ['iife'],
      entry: resolve(srcDir, 'index.ts'),
    },
    outDir: resolve(rootDir, '..', '..', 'dist', 'content'),
  },
});
