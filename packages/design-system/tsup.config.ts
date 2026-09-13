import { copyFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

// Build ESM + d.ts. React queda externo (cada app usa su propia versión).
// La CSS de tokens se copia tal cual a dist/.
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'icons/index': 'src/icons/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  onSuccess: async () => {
    copyFileSync('src/tokens.css', 'dist/tokens.css');
  },
});
