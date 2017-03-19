
const config = {
    entry: './c/compil.js',
    output: {
        path: __dirname,
        filename: 'bundle.js'
    },
    module:{
        loaders: [
            {
                test: /\.js$/,
                loader: require.resolve('./jsx-loader')
            }
        ]
    }

};

module.exports = config;