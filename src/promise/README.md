## Promise 原理及实现

#### 是什么
Promise 是一种对异步操作的封装，可以通过独立的接口添加在异步操作执行成功、失败时执行的方法。主流的规范是 Promises/A+。

Promise 较通常的回调、事件/消息，在处理异步操作时具有显著的优势。其中最为重要的一点是：Promise 在语义上代表了异步操作的主体。这种准确、清晰的定位极大推动了它在编程中的普及，因为具有单一职责，而且将份内事做到极致的事物总是具有病毒式的传染力。分离输入输出参数、错误冒泡、串行/并行控制流等特性都成为 Promise 横扫异步操作编程领域的重要砝码，以至于 ES6 都将其收录，并已在 Chrome、Firefox 等现代浏览器中实现。

#### 1.基础实现
我们首先需要实现下面一个简单的例子，获取用户信息：
```js
function getUserId() {
    return new Promise(function (resolve) {
        // 异步请求
        axios.get('/userInfo', function (res) {
            resolve(res)
        })
    });
}

getUserId().then(function (id) {
    // do sth with id
});
```

满足这样一种使用场景的 ```Promise``` 是如何构建的呢？其实并不复杂，可以看出我们的```Promise```其实是一个```Class```，实例化的时候需要传入一个```Function```，```.then``` 是一个基于Promise实例的订阅器方法，下面给出最基础的实现：
```js
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
```