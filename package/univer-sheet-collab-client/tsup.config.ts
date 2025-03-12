import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts', 'src/facade/index.ts', 'src/locale/*.ts'],
    clean: true,
    dts: true,
    outDir: 'dist',
    format: ['cjs', 'esm'],
    minify: false,
    sourcemap: true,
    bundle: true,
    external: ['@gongback/univer-sheet-collab']
});
