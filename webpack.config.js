const path = require("path");
const nodeExternals = require("webpack-node-externals");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  mode: "production", // Production mode enables optimization
  entry: "./server.js", // Entry point of the application
  target: "node", // Target environment (Node.js)
  externals: [nodeExternals()], // Exclude node_modules from the bundle
  output: {
    path: path.resolve(__dirname, "dist"), // Output directory
    filename: "bundle.js", // Output file
  },
  optimization: {
    minimize: true, // Enable code minification
  },
  plugins: [
    new CleanWebpackPlugin(), // Clean /dist folder before each build
  ],
  module: {
    rules: [
      {
        test: /\.js$/, // Apply babel-loader to .js files
        exclude: /node_modules/, // Exclude node_modules folder
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"], // Use Babel preset for ES6+ support
          },
        },
      },
    ],
  },
  devtool: "source-map", // Enable source maps for debugging
};
