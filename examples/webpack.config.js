import path from 'path';
import webpack from 'webpack';

export default {
  devtool: 'cheap-module-source-map',
  entry: {
    article: './examples/article/index.js',
    flatland: './examples/flatland/index.js'
  },
  output: {
    path: __dirname,
    filename: '[name]/bundle.js'
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'commons',
      filename: 'commons.js'
    })
  ],
  externals: {
    "jquery": "jQuery"
  }
};
