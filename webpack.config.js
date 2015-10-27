import path from 'path';
import webpack from 'webpack';

export default {
  devtool: 'cheap-module-source-map',
  entry: {
    article: './examples/article/index.js',
    flatland: './examples/flatland/index.js'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: '/static/'
  },
  plugins: [
    new webpack.NoErrorsPlugin()
  ],
  externals: {
    "jquery": "jQuery"
  }
};
