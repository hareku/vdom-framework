import typescript from 'rollup-plugin-typescript';

export default {
  input: './example/main.ts',
  output: {
    file: './example/bundle.js',
    format: 'esm'
  },
  plugins: [
    typescript({lib: ["es5", "es6", "dom"], target: "es5"})
  ]
}
