module.exports = {
  publicPath: '/',
  outputDir: 'dist',
  devServer: {
    proxy: 'http://localhost:5000',
  },
};
