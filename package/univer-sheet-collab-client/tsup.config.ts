import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts', 'src/facade/index.ts', 'src/locale/*'],
    clean: true,
    dts: true,
    outDir: 'dist',
    format: ['cjs', 'esm'],
    minify: false,
    sourcemap: true,
});
