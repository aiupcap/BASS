import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { watchRebuildPlugin } from '@bass/hmr';
import react from '@vitejs/plugin-react-swc';
import deepmerge from 'deepmerge';
import env, { IS_DEV, IS_PROD } from '@bass/env';

export const watchOption = IS_DEV
  ? {
      exclude: [/\/pages\/content-ui\/dist\/.*\.(css)$/],
      chokidar: {
        awaitWriteFinish: true,
        ignored: [/\/packages\/.*\.(ts|tsx|map)$/, /\/pages\/content-ui\/dist\/.*/],
      },
    }
  : undefined;

export const withPageConfig = (config: UserConfig) =>
  defineConfig(
    deepmerge(
      {
        define: {
          'process.env': env,
        },
        base: '',
        plugins: [react(), tailwindcss(), IS_DEV && watchRebuildPlugin({ refresh: true })],
        build: {
          sourcemap: IS_DEV,
          minify: IS_PROD,
          reportCompressedSize: IS_PROD,
          emptyOutDir: IS_PROD,
          watch: watchOption,
          rollupOptions: {
            external: ['chrome'],
          },
        },
      },
      config,
    ),
  );
