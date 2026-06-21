import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: './src/index.ts',
  },
  tsconfig: 'tsconfig.json',
  platform: 'node',
  target: 'esnext',
  format: ['esm', 'cjs'],

  outDir: 'dist/src',
  clean: true,

  hash: false,
  dts: true,
  minify: true,
  shims: false,
  sourcemap: false,
  treeshake: true,
});
