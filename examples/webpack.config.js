import path from 'path';
import webpack from 'webpack';

export default {
  devtool: 'cheap-module-source-map',
  entry: {
    article: './examples/article/index.js',
    flatland: './examples/flatland/index.js'
  },
  resolve: {
    alias: {
      typeset: path.join(__dirname, '..', 'src')
    }
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/
      }
    ]
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
    // "jquery": "jQuery"
  }
};
