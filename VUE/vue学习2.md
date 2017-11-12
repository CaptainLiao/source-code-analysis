## 第二章 修炼`Vue`大法
说罢，万丈金光从`Vue`身上迸发而出，场面一度失控。待金光散去，`Vue`却不见了，只留下一本《Vue 修炼秘决》...

开篇道：
> 天下武功，唯坚不破唯快不破
  待参透：var vm = new Vue(data:{a:1}})之时，即武功大成之日。

如你所见，`/core`文件夹下便是`Vue`的核心了，`/core/index.js`是整个内核的开篇，你先熟悉下：
````
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
````
### 起手式
`new Vue(options)`是使用`Vue`的起手式，`this._init(options)`是蓄势过程。此时你可能会疑惑，`this._init()`你之前并没有见过，它从哪里来，它能干什么？不着急，我们一步一步往下看。

完整的 `Vue` 对象（来自core/instance/index.js）
````
class Vue {
  constructor(options) {
    this.init(options)
  }

  /** 
   * core/index.js
   * initGlobalAPI(Vue) 定义静态方法和属性
   */
  static set() {} 
  static delete() {} 
  static nextTick() {}
  static use() {}
  static mixin() {}

  // initMixin(Vue)中定义
  _init() {}

  // stateMixin(Vue)中定义
  $data() {}
  $props() {}
  $set() {}
  $delete() {}
  $watch() {}

  // eventsMixin(Vue)中定义
  $on() {}
  $once() {}
  $off() {}
  $emit() {}

  // lifecycleMixin(Vue)中定义
  _update() {}
  $forceUpdate() {}
  $destroy() {}

  // renderMixin(Vue)中定义
  $nextTick() {}
  _render() {}
}

Vue.config
Vue.options
````

### 核心，`Vue`响应式系统

这次我们换个思路，带着问题找答案。有如下代码：
````
var vm = new Vue({
  data:{
  a:1
  }
})
// `vm.a` 是响应的
vm.b = 2
// `vm.b` 是非响应的
````
问题来了，为什么`vm.a`是响应的而`vm.b`是非响应的呢？我们把问题概括为：**`Vue`的数据是如何响应的？**一定要牢记这一点。

我们已经知道，当实例化一个`Vue`对象的时候，会执行`_init()`，这期间`Vue`做了什么呢？让我们打开`src/core/instance/init.js`一窥究竟：
````
  Vue.prototype._init = function (options?: Object) {

    const vm = this

    vm.$options = mergeOptions(
      resolveConstructorOptions(vm.constructor),
      options || {},
      vm
    )

    initLifecycle(vm)
    initEvents(vm)
    initRender(vm)
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

  }
````
oh yeah,so easy! `_init`无非就是合并了`options`，再进行一系列初始化操作。又由于我们关注的是数据的响应，所以我们把重点放在`initState(vm)上。
````
export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
}

function initData (vm: Component) {
  let data = vm.$options.data
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}

  // observe data
  observe(data, true /* asRootData */)
}
````
看来，初始化数据的关键之一就是执行`observe(data, true)`了。那么，`observe`是什么？它是如何**观察**`data`的呢？

#### observer

