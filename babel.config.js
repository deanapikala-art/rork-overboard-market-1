module.exports = {
  presets: ['@babel/preset-env'],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '@': './app',
        },
        extensions: ['.js', '.ts', '.tsx'],
      },
    ],
  ],
};
