import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'utils/index': 'src/utils/index.ts',
    'validators/index': 'src/validators/index.ts',
    'constants/index': 'src/constants/index.ts',
    'types/index': 'src/types/index.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  external: [
    'zod',
    'date-fns',
    'clsx'
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";'
    };
  }
});