const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const TerserPlugin = require('terser-webpack-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

const entryPath = path.join(__dirname, 'src/static/index.js');

module.exports = merge(common, {
    mode: 'production',
    entry: entryPath,
    module: {
        rules: [{
            test: /\.elm$/,
            exclude: [/elm-stuff/, /node_modules/],
            use: ['elm-webpack-loader']
        }, {
            test: /\.sc?ss$/,
            use:
                ['style-loader'
                , { loader: 'css-loader'
                  , options: { importLoaders: 1 }
                  }
                , 'postcss-loader'
                , 'sass-loader'
                ]
        }]
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    ecma: 6,
                },
            }),
            new OptimizeCSSAssetsPlugin({})
        ]
    },
    plugins: [
        new CopyWebpackPlugin({
          patterns: [
            {
              from: 'src/static/img/',
              to: 'static/img/',
            },
            {
              from: 'src/favicon.ico',
            },
          ],
        }),
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css"
        })
    ]
});
