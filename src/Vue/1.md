## 入口开始，解读Vue源码（一）—— 造物创世

世间万物的起源来自于盘古的开天辟地，Vue 项目的起源，源于一次Vue的实例化：
```js
new Vue({
  el: ...,
  data: ...,
  ....
})
```

那么在这次实例化的过程中，究竟发生了哪些行为？让我们来一探究竟。打开Vue的源码文件，其核心代码在```src/core```目录下。下面我们从入口文件```index.js```开始进入：（刚开始看的时候，我们可能不太清楚每个引用方法的具体实现，不过没关系，我们可以自己根据他的命名来YY一下。）
```js
// src/core/index.js

// 这里应该是我们 Vue 核心方法
import Vue from './instance/index'
// 根据命名，应该可以猜出这里是初始化一些全局API
import { initGlobalAPI } from './global-api/index'
// 根据命名，这里应该是获取一个Boolean类型的变量，来判断是不是ssr
import { isServerRendering } from 'core/util/env'
// 这里开始执行初始化全局变量
initGlobalAPI(Vue)
// 为Vue原型定义属性$isServer
Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})
// 为Vue原型定义属性$ssrContext
Object.defineProperty(Vue.prototype, '$ssrContext', {
  get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
})

Vue.version = '__VERSION__'

export default Vue
```

下面我们来一步步验证我们的猜测，首先找到```core/instance/index```文件，可以清晰的看到：
```js
import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
```

这里简单粗暴的定义了一个 Vue Class，然后又调用了一系列```init、mixin```这样的方法来初始化一些功能，具体的我们后面在分析，不过通过代码我们可以确认的是：没错！这里确实是导出了一个 Vue 功能类。

接下来，我们接着看```initGlobalAPI```这个东西，其实在[Vue官网](https://cn.vuejs.org/v2/api/#%E5%85%A8%E5%B1%80-API)上，就已经为我们说明了Vue的全局属性：

![关于全局API](http://img.souche.com/f2e/40097b8962a70f85e84545a6838333bd.png)

那我们来看看，是不是这么回事(内容太多，只贴一下主要的代码)：
```js
// core/global-api/index

...
export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  // 这些工具方法不视作全局API的一部分，除非你已经意识到某些风险，否则不要去依赖他们
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }
  // 这里定义全局属性
  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })
  Vue.options._base = Vue
  extend(Vue.options.components, builtInComponents)

  // 定义全局方法
  initUse(Vue)
  initMixin(Vue)
  initExtend(Vue)
  initAssetRegisters(Vue)
}

```
* 【Vue.config】 各种全局配置项

* 【Vue.util】 各种工具函数，还有一些兼容性的标志位（哇，不用自己判断浏览器了，Vue已经判断好了）

* 【Vue.set/delete】 这个你文档应该见过

* 【Vue.nextTick】

* 【Vue.options】 这个options和我们上面用来构造实例的options不一样。这个是Vue默认提供的资源（组件指令过滤器）。

* 【Vue.use】 通过initUse方法定义

* 【Vue.mixin】 通过initMixin方法定义

* 【Vue.extend】通过initExtend方法定义


接下来便是提供给ssr使用的全局变量```$isServer``` 和 ```$ssrContext```。 关于他们的使用，其实ssr文档也有说明：[Head 管理](https://ssr.vuejs.org/zh/head.html)

到这里，我们的入口文件差不多就了解清楚了，接下来，我们开始去了解一下 Vue class 的具体实现，其中我们会了解到Vue的相关生命周期的知识。
