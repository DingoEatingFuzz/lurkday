import dts from 'bun-plugin-dts'

await Bun.build({
  entrypoints: ['./index.ts'],
  outdir: './dist',
  minify: false,
  plugins: [dts()],
  target: 'node',
})
