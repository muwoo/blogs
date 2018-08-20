/**
 * @user monkeywang
 * @author muwoo
 * Date: 2018/5/29
 */
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  }
};
