import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    'cli/index': 'src-cli/index.ts',
  },
  tsconfig: 'tsconfig.json',
  platform: 'node',
  target: 'esnext',
  format: ['esm'],

  outDir: 'dist',
  clean: true,

  hash: false,
  dts: false,
  minify: true,
  shims: false,
  sourcemap: false,
  treeshake: true,
});
