import * as path from "path";
import * as webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";

const config: webpack.Configuration = {
  mode: "development",
  devtool: "eval-source-map",
  optimization: {
    usedExports: true,
    innerGraph: true,
    sideEffects: true,
  },
  entry: { index: "./src/site/index.ts" },
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
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ["index"],
      filename: "index.html",
      template: "./src/site/index.html",
    }),
    // new CopyWebpackPlugin({
    //   patterns: [
    //     // Copy index.html, reset.html, more_info.html.
    //     {
    //       from: "./src/site/index.html",
    //       to: "./[base]",
    //     },
    //     {
    //       from: "./src/site/reset.html",
    //       to: "./[base]",
    //     },
    //     {
    //       from: "./src/site/more_info.html",
    //       to: "./[base]",
    //     },
    //   ],
    // }),
    new CleanWebpackPlugin(),
  ],
};

export default config;
