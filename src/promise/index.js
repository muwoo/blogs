/**
 * @author monkeywang
 * Date: 2018/3/5
 */
function Promise (fn) {
  var listener = []

  this.then = function (onFulfilled) {
    listener.push(onFulfilled)
  }
  function resolve (data) {
    listener.forEach(function (cb) {
      cb(data);
    });
  }
  fn(resolve)
}
