## 入口开始，解读Vue源码（四）—— 实现一个基础的 Vue 双向绑定

如果您有兴趣看到这里了，那么是不是看的手痒了？没关系，我们这就来动手实现一个基础```Vue```，我们称之为```Wue```：
1. 实现```$options```参数处理
2. 实现```observer```数据劫持
3. 实现```Dep```订阅器
4. 实现```Watcher```观察者
5. 实现基础的```compile```编译

####  实现```$options```参数处理
首先，明确的是我们需要实现一个对象，该对象接受一个```object```类型的参数来提供初始化，按照```Vue```的思想，首先需要构建实例上的```$options```参数，这里我们简化一下：
```js
class Wue {
  constructor (options) {
    const vm = this
    vm.$options = options
    ...
  }
}
```

#### 实现```observer```数据劫持
数据劫持，前面已经说过了，我们需要为我们的定义的```data```参数进行```observer```:

```js
class Wue {
  constructor (options) {
    const vm = this
    vm.$options = options
    let data = vm._data = vm.$options.data
    observer(vm._data)
    ...
  }
}
```
```observer```的主要功能是对传入的数据进行过滤，判断是否需要进行数据劫持：
```js
function observer(value) {
  // 如果不是对象的话就直接return掉
  if (!value || typeof value !== 'object') {
    return
  }
  return new Observer(value)
}
```
那么接下来就是去实现```Observer```类了，这里，为了更加简洁，我们暂时只考虑传入的```value```是一个普通的对象：
```js
class Observer {
  constructor (value) {
    this.walk(value)
  }

  walk (obj) {
    Object.keys(obj).forEach((key) => {
      // 如果是对象，则递归调用walk，保证每个属性都可以被defineReactive
      if (typeof obj[key] === 'object') {
        this.walk(obj[key])
      }
      defineReactive(obj, key, obj[key])
    })
  }
}

let defineReactive = (obj, key, value) => {
  ...
  Object.defineProperty(obj, key, {
    set (newVal) {
      if (newVal === value) {
        return
      }
      value = newVal
      // 当设置的属性是个对象，也需要继续进行observe
      observe(newVal)
      ...
    },
    get () {
      ...
      return value
    }
  })
}

```

到这里，我们的数据劫持，基本上完成了，可以来调试一下：
```
let app = new Wue({
  el: '#app',
  data: {
    msg: 'hello wue',
    deep: {
      a: 1,
      b: 2
    }
  }
})
```

![控制台查看app实例](http://img.souche.com/f2e/a36169553befdc384af4d80f4906913c.png)

到这里，我们访问属性是通过```this._data.xxx``` 这样不是很优雅，所以，我们需要设置一层代理，也就是重新进行一次数据访问拦截。当我们访问```this.xxx```就可以了：
```js
proxy (target, sourceKey, key) {
  Object.defineProperty(target, key, {
    configurable: true,
    get: function proxyGetter () {
      return target[sourceKey][key]
    },
    set: function proxySetter (newVal) {
      target[sourceKey][key] = newVal
    }
  })
}

export default class Wue {
  constructor (options) {
    let vm = this
    ...
    for (let key in vm._data) {
      proxy(vm, '_data', key)
    }
    ...
  }
}
```


#### 实现```Dep```订阅器 和 ```Watcher``` 订阅者

订阅-发布模式，就像买房的中介一样。我们（```watcher```）去买房，不可能天天去房地产开发商那边去问有没有房源，我们更多的是找一个中介（```dep```），然后把我们的需求和联系方式告诉中介（```dep.depend()```），中介一旦有满足需求的房源，便会打电话来通知我们```dep.notify()```
根据上面的描述，我们大概清楚了，我们需要一个订阅器```Dep```，同时，```Dep```需要有收集需求和联系方式的功能，也需要有打电话通知的功能：
```js
export default class Dep {
  constructor () {
    // 消息盒子，联系人
    this.sub = []
  }
  addDepend () {
    Dep.target.addDep(this)
  }
  addSub (sub) {
    this.sub.push(sub)
  }
  // 通知
  notify () {
    for (let sub of this.sub) {
      sub.update()
    }
  }
}
```
紧接着，我们也需要一个```Watcher```，其中包含接受通知的功能，以及建立与中介```dep```的关联:
```js
export default class Watcher {
  constructor (vm, expression, cb) {
    this.vm = vm
    this.cb = cb
    this.expression = expression
    this.value = this.getVal()
  }
  getVal () {
    pushTarget(this) // 建立关联

    // 这里取值，会触发value的get方法，所以接下来我们需要在get方法里面将联系人的联系方式给中介
    let val = this.vm
    this.expression.split('.').forEach((key) => {
      val = val[key]
    })

    popTarget() // 释放关联
    return val
  }

  // 联系人把自己的联系方式给中介
  addDep (dep) {
    dep.addSub(this)
  }

  // 接收到消息后，开始准备活动。。。
  update () {
    let val = this.vm
    this.expression.split('.').forEach((key) => {
      val = val[key]
    })
    this.cb.call(this.vm, val, this.value)
  }
}
```
说到这里，我们知道了，还有2步没有去做：
1. 收集联系方式
2. 通知
那我们什么时候去收集联系方式呢，答案很简单：那就是我们主动询问中介的时候，中介会向我们要我们的联系方式：
```js
...
get () {
  // 如果建立了关联，那么开始添加联系方式
  if (Dep.target) {
    dep.addDepend()
  }
  return value
}
...
```
那什么时候通知顾客呢？很简单：当有房产更新的时候：
```js
set () {
  dep.notify()
}
```
到这里，我们以一个例子，简单的描述了这之间的过程。现在我们已经实现了一个简单的发布-订阅方式了。

#### 实现基础的```compile```编译
```options```中的```el``` 参数，为我们指定了我们需要编译哪些内容，而我们要做的仅仅是解析出通过```v-model```、```v-text```、```{{}}```等等标识和指令。然后获取绑定数据的值，替换掉标识的内容，并进行数据的变化监听```watcher```。
当再有值发生变化时，可以及时通知其修改对应dom元素。说到这里，我们开干：
```js
export default class compiler {
  constructor (el, vm) {
    vm.$el = document.querySelector(el)
    this.replace(vm.$el, vm)
  }
  replace (frag, vm) {
    Array.from(frag.childNodes).forEach(node => {
      let txt = node.textContent;
      // 正则匹配{{}}
      let reg = /\{\{(.*?)\}\}/g;
      // 如果是文本节点，且包含{{}}
      if (node.nodeType === 3 && reg.test(txt)) {
        let arr = RegExp.$1.split('.');
        let val = vm;
        arr.forEach(key => {
          val = val[key];
        });
        node.textContent = txt.replace(reg, val).trim();
        vm.$watch(RegExp.$1, function (newVal) {
          node.textContent = txt.replace(reg, newVal).trim();
        })
      }
      // 如果是元素节点
      if (node.nodeType === 1) {
        let nodeAttr = node.attributes;
        Array.from(nodeAttr).forEach(attr => {
          let name = attr.name;
          let exp = attr.value;
          // 如果是通过 v- 指令绑定的元素，则设置节点的value为绑定的相应的值
          if (name.includes('v-')){
            node.value = vm[exp];
          }
          // 监听变化
          vm.$watch(exp, function(newVal) {
            node.value = newVal;
          });

          node.addEventListener('input', e => {
            let newVal = e.target.value;
            let arr = exp.split('.')
            let val = vm;
            // 考虑到 v-model="deep.a" 这种情况
            arr.forEach((key, i)=> {
              if (i === arr.length - 1) {
                val[key] = newVal
                return
              }
              val = val[key];
            });
          });
        });
      }

      // 如果还有子节点，继续递归replace
      if (node.childNodes && node.childNodes.length) {
        this.replace(node, vm);
      }
    })
  }
}
```
到这里，我们便实现了一个简单的双向数据绑定：
###### 数据 ————> Dom
1. 通过```compile```解析指令和数据，为其添加```watcher```
2. ```watcher``` 触发对于的```get```方法，使其进行依赖收集，把对应的```watcher```进行收集
3. 当数据发送变化的时候，触发```set```方法，使其通知```watcher``` 进行视图更新

###### Dom ————> 数据
1. 通过```compile```解析指令和数据
2. 监听Dom```input```等更新动作，当触发dom更新时，在对应回调函数中更新实例```vm```中的数据值

#### 后续
顺便，我们实现以下钩子函数功能：
```js
export function callHook (vm, hook) {
  const handlers = vm.$options[hook]
  if (handlers) {
    handlers.call(vm)
  }
}
```

部分段落参考：[不好意思！耽误你的十分钟，让MVVM原理还给你](https://juejin.im/post/5abdd6f6f265da23793c4458)

github 源码：[wue](https://github.com/monkeyWangs/wue)

更多Vue源码文章：[入口开始，解读Vue源码](https://github.com/monkeyWangs/blogs)
