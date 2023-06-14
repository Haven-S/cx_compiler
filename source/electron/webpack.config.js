const path = require('path');

module.exports = {
  entry: './index.jsx',
  resolve: {
    extensions: ['.js', '.jsx',],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    sourceMapFilename: 'bundle.js.map'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },    
    ],
  },
  devServer: {
    contentBase: path.join(__dirname, '.'),
    port: 9000,
  },
  target: 'electron-renderer',
  devtool: 'source-map'
};