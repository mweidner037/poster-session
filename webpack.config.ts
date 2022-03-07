import * as path from "path";
import * as webpack from "webpack";
import HtmlWebpackPlugin = require("html-webpack-plugin");
import CopyWebpackPlugin = require("copy-webpack-plugin");
import { CleanWebpackPlugin } from "clean-webpack-plugin";

const config: webpack.Configuration = {
  mode: "development",
  devtool: "eval-source-map",
  optimization: {
    usedExports: true,
    innerGraph: true,
    sideEffects: true,
  },
  entry: { main: "./src/site/main.ts" },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "build/site"),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: { crypto: false },
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ["main"],
      filename: "index.html",
      template: "./src/site/index.html",
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "./src/site/assets",
          to: "./assets",
        },
      ],
    }),
    new CleanWebpackPlugin(),
  ],
};

export default config;
