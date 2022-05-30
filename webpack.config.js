const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require('webpack');

// Simple stupid hash to reduce commit ID to something short
const getHash = function (str) {
    var hash = 42;
    if (str.length) { for (var i = 0; i < str.length; i++) { hash = Math.abs((hash << 5) - hash + str.charCodeAt(i)); } }
    return hash.toString(16);
};

var commitID = process.env.SCM_COMMIT_ID;
if (!commitID) commitID = "test";
const version = getHash(commitID);
console.log("commitID: " + commitID);
console.log("version: " + version);

var aikey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
if (typeof (aikey) === "undefined" || aikey === "") aikey = "unknown";
console.log("aikey: " + aikey);

const buildTime = new Date().toUTCString();
console.log("buildTime: " + buildTime);

const pages =
    [
        { "name": "unittests", "script": "unittests" },
        { "name": "mha", "script": "StandAlone" },
        { "name": "parentframe", "script": "uiToggle" },
        { "name": "newDesktopFrame", "script": "DesktopPane" },
        { "name": "classicDesktopFrame", "script": "Default" },
        { "name": "MobilePane", "script": "MobilePane" },
        { "name": "newMobilePaneIosFrame", "script": "MobilePane-ios" },
        { "name": "Privacy", "script": "privacy" },
        // Redirection/static pages
        { "name": "Default" },
        { "name": "DefaultPhone" },
        { "name": "DefaultTablet" },
        { "name": "DesktopPane" },
        { "name": "MobilePane-ios" },
        { "name": "Functions" },
    ];

function generateEntry() {
    return pages.reduce((config, page) => {
        if (typeof (page.script) === "undefined") return config;
        config[page.script] = `./src/Scripts/${page.script}.ts`;
        return config;
    }, {});
}

function generateHtmlWebpackPlugins() {
    return pages.map(function (page) {
        return new HtmlWebpackPlugin({
            inject: true,
            template: `./src/Pages/${page.name}.html`,
            filename: `${page.name}.html`,
            chunks: [page.script]
        })
    });
}

module.exports = {
    entry: generateEntry(),
    plugins: [
        new MiniCssExtractPlugin(),
        new webpack.DefinePlugin({
            __VERSION__: JSON.stringify(version),
            __AIKEY__: JSON.stringify(aikey),
            __BUILDTIME__: JSON.stringify(buildTime)
        }),
        new FileManagerPlugin({
            events: {
                onEnd: {
                    copy: [
                        { source: './src/Resources/*.gif', destination: './Resources/' },
                        { source: './src/Resources/*.jpg', destination: './Resources/' }
                    ]
                }
            }
        })
    ].concat(generateHtmlWebpackPlugins()),
    mode: 'development',
    devtool: 'source-map',
    module: {
        rules: [
            { test: /fabric(\.min)?\.js$/, use: 'exports-loader?exports=fabric' },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                test: /\.js$/,
                enforce: "pre",
                use: ["source-map-loader"],
            },
        ],
    },
    optimization: {
        splitChunks: {
            chunks: "all",
        },
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'Pages'),
        clean: true,
    },
};