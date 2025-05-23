import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    clean: true,
    dts: true,
    outDir: 'dist',
    format: ['cjs', 'esm'],
    minify: false,
    sourcemap: true,
    external: [
        '@gongback/univer-sheet-collab',
    ]
});
