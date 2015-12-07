import path from 'path';
import webpack from 'webpack';

export default {
  devtool: 'cheap-module-source-map',
  entry: {
    article: './examples/article/index.js',
    flatland: './examples/flatland/index.js',
    react: [
      'webpack-hot-middleware/client',
      './examples/react/index.js'
    ]
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
        loaders: ['react-hot', 'babel'],
        exclude: /node_modules/
      }
    ],
    postLoaders: [
      {
        loader: "transform?brfs"
      }
    ]
  },
  output: {
    path: __dirname,
    filename: '[name]/bundle.js'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
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
