## Promise 状态机方式简单实现

#### 是什么
Promise 是一种对异步操作的封装，可以通过独立的接口添加在异步操作执行成功、失败时执行的方法。主流的规范是 Promises/A+。Promises/A+规范中的2.1Promise States中明确规定了，pending可以转化为fulfilled或rejected并且只能转化一次，也就是说如果pending转化到fulfilled状态，那么就不能再转化到rejected。并且fulfilled和rejected状态只能由pending转化而来，两者之间不能互相转换。一图胜千言：

![](https://mengera88.github.io/images/promiseState.png)

#### 简单实现
通过上面的描述，其实我们可以通过 js 状态机来描述 ```Promise```的状态状态变化：
```js
var PENDING = 0;
var FULFILLED = 1;
var REJECTED = 2;

function Promise() {

  // 存储状态值，可能是 PENDING, FULFILLED 或者 REJECTED
  var state = PENDING;

  // 一旦状态被改变，记录结果值value
  var value = null;

  // 存储成功或者失败处理函数，对应 then 方法中的 success 和 error 函数
  var handlers = [];

  // 改变状态机的状态为 FULFILLED 并记录下对应的值
  function fulfill(result) {
      state = FULFILLED;
      value = result;
    }

  // 改变状态机的状态为 REJECTED 并记录下对应的值
  function reject(error) {
    state = REJECTED;
    value = error;
  }

}
```

这样我们便实现了一个简单的状态变化功能，接着，我们需要定义```then```函数，来接受状态改变后的回调方法：onFulfilled 和 onRejected。也就是监听 Promise 状态的改变的回调：
```js
this.then = function (onFulfilled, onRejected) {
  var self = this;
  return new Promise(function (resolve, reject) {
    return self.done(function (result) {
      if (typeof onFulfilled === 'function') {
        try {
          return resolve(onFulfilled(result));
        } catch (ex) {
          return reject(ex);
        }
      } else {
        return resolve(result);
      }
    }, function (error) {
      if (typeof onRejected === 'function') {
        try {
          return resolve(onRejected(error));
        } catch (ex) {
          return reject(ex);
        }
      } else {
        return reject(error);
      }
    });
  });
}

function handle(handler) {
  if (state === PENDING) {
    handlers.push(handler);
  } else {
    if (state === FULFILLED &&
      typeof handler.onFulfilled === 'function') {
      handler.onFulfilled(value);
    }
    if (state === REJECTED &&
      typeof handler.onRejected === 'function') {
      handler.onRejected(value);
    }
  }
}

this.done = function (onFulfilled, onRejected) {
  // ensure we are always asynchronous
  handle({
    onFulfilled: onFulfilled,
    onRejected: onRejected
  });
}

```
这里```then```函数主要是进行监听函数的收集，类似于订阅-发布模式。把监听成功后的处理函数和监听失败的处理函数一起收集起来。等到状态变化时再去触发对应的函数。

细心的同学应该发现，上述代码可能还存在一个问题：如果在then方法注册回调之前，resolve函数就执行了，怎么办？比如promise内部的函数是同步函数：
```js

function getUserId() {
    return new Promise(function (resolve) {
        resolve(9876);
    });
}
getUserId().then(function (id) {
    // 一些处理
});
```

所以我们需要加一下延时机制，如果当前状态已经变成了 ```FULFILLED```那我们就不用收集依赖了，直接指向便好，我们来改写一下done：
```js
this.done = function (onFulfilled, onRejected) {
  // ensure we are always asynchronous
  setTimeout(function () {
    handle({
      onFulfilled: onFulfilled,
      onRejected: onRejected
    });
  }, 0);
}
```

接下来还有另一个问题，我们什么时候通知需要执行监听函数呢？Promise 规定，需要通过```resolve```功能函数来改变 ```PENDING``` -> ```FULFILLED```:
```js
function resolve(result) {
  try {
    fulfill(result);
  } catch (e) {
    reject(e);
  }
}
```
这样写正常情况下并没有什么问题，但是仔细想想看，Promise 函数如果 then 方法里返回的也是个 Promise 需要我们等到这个 Promise 执行完成之后，将其结果返回给下一个 then 这样写就会导致不会等待 return 里面的 Promise 执行。所以我们来改写一下：

```js
function resolve(result) {
  try {
    var then = getThen(result);
    if (then) {
      doResolve(then.bind(result), resolve, reject)
      return
    }
    fulfill(result);
  } catch (e) {
    reject(e);
  }
}
/**
 * Check if a value is a Promise and, if it is,
 * return the `then` method of that promise.
 *
 * @param {Promise|Any} value
 * @return {Function|Null}
 */
function getThen(value) {
  var t = typeof value;
  if (value && (t === 'object' || t === 'function')) {
    var then = value.then;
    if (typeof then === 'function') {
      return then;
    }
  }
  return null;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 *
 * @param {Function} fn A resolver function that may not be trusted
 * @param {Function} onFulfilled
 * @param {Function} onRejected
 */
function doResolve(fn, onFulfilled, onRejected) {
  var done = false;
  try {
    fn(function (value) {
      if (done) return
      done = true
      onFulfilled(value)
    }, function (reason) {
      if (done) return
      done = true
      onRejected(reason)
    })
  } catch (ex) {
    if (done) return
    done = true
    onRejected(ex)
  }
}
```

这样也就是说，如果返回的对象是一个 promise 那么，为其创建了一个 then 方法，等到 promise 执行完成， 在进行```resolve ```。如果执行完成返回的是一个正常的数据类型，便返回给下一个 then 使用。

#### 扩展一些功能

有了上面的这些实现，我们便可以很轻松的是写一些其他的功能，比如 ```catch```方法，就是为 ```Promise``` 的 then 做一次语法糖：

```js
Promise.prototype.catch = function(onRejected){
    return this.then(null, onRejected)
}
```

或者是 Promise.resolve :
```js
Promise.resolve = function(value){
    //if(value instanceof this) return value
    //if(value instanceof Promise) return value
    if(value.constructor !== Promise) return value
    return new Promise( (resolve,reject) => {
        if(value && typeof value === 'object' && typeof value.then === 'function'){
            resolve( value.then( v => v))
        }else{
            resolve(value)
        }
    })
}
```

#### 结束
部分源码参见： [源码](https://github.com/monkeyWangs/blogs/blob/master/src/promise/index.js)

参考文献：[Basic Javascript promise implementation attempt
](https://stackoverflow.com/questions/23772801/basic-javascript-promise-implementation-attempt/23785244#23785244)
