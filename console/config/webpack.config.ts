/* eslint-env node */

import path from "node:path";
import process from "node:process";
import { type Configuration as WebpackConfiguration } from "webpack";
import { type Configuration as WebpackDevServerConfiguration } from "webpack-dev-server";
import { ConsoleRemotePlugin } from "@openshift-console/dynamic-plugin-sdk-webpack";
import CopyWebpackPlugin from "copy-webpack-plugin";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import { extensions, pluginMetadata } from "./dynamic-plugin.config.ts";

interface Configuration extends WebpackConfiguration {
  devServer?: WebpackDevServerConfiguration;
}

const pwd = process.cwd();
const paths = {
  src: path.join(pwd, "src"),
  dist: path.join(pwd, "dist"),
  locales: path.join(pwd, "locales"),
  nodeModules: path.join(pwd, "node_modules"),
  tsconfig: path.join(pwd, "tsconfig.json"),
};

const isProd = process.env.NODE_ENV === "production";

const config: Configuration = {
  mode: isProd ? "production" : "development",
  // No regular entry points needed. All plugin related scripts are generated via ConsoleRemotePlugin.
  entry: {},
  context: paths.src,
  output: {
    path: paths.dist,
    filename: isProd ? "[name]-bundle-[hash].min.js" : "[name]-bundle.js",
    chunkFilename: isProd
      ? "[name]-chunk-[chunkhash].min.js"
      : "[name]-chunk.js",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    modules: [paths.nodeModules],
    plugins: [new TsconfigPathsPlugin()],
  },
  module: {
    rules: [
      {
        test: /\.(jsx?|tsx?)$/,
        exclude: /\/node_modules\//,
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: paths.tsconfig,
            },
          },
        ],
      },
      {
        test: /\.(css)$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff2?|ttf|eot|otf)(\?.*$|$)/,
        type: "asset/resource",
        generator: {
          filename: isProd ? "assets/[contenthash][ext]" : "assets/[name][ext]",
        },
      },
      {
        test: /\.(m?js)$/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  devServer: {
    static: paths.dist,
    port: 9001,
    // Allow Bridge running in a container to connect to the plugin dev server.
    allowedHosts: "all",
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers":
        "X-Requested-With, Content-Type, Authorization",
    },
    devMiddleware: {
      writeToDisk: true,
    }
  },
  plugins: [
    new ConsoleRemotePlugin({
      extensions,
      pluginMetadata,
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: paths.locales, to: "locales" }],
    }),
  ],
  devtool: isProd ? false : "source-map",
  optimization: {
    chunkIds: isProd ? "deterministic" : "named",
    minimize: isProd,
  },
};

export default config;
