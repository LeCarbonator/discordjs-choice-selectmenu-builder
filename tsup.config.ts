import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/ChoiceSelectMenuBuilder.ts'
    },
    external: [],
    noExternal: [],
    platform: 'node',
    format: ['cjs', 'esm'],
    target: 'esnext',
    skipNodeModulesBundle: true,
    clean: true,
    minify: false,
    terserOptions: {
        mangle: false,
        keep_classnames: true,
        keep_fnames: true
    },
    splitting: false,
    keepNames: true,
    dts: true,
    sourcemap: true,
    treeshake: false,
    outDir: 'dist'
});
