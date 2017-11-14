## 第二章 《Vue 编程房内考》

待参透以下代码之时，即Vue心法大成之日。
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
*旁白：主线2——数据响应系统*

### 第一回 再识`Vue`
`new Vue({})`对你而言再简单不过了，那么，在实例化的过程中，`Vue`进行了哪些变化呢？你细细思索，明白关键在还在**构造函数Vue**上。

/core/index.js
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

`new Vue(options)`时，会执行`this._init(options)`。此时你有点小疑惑，`this._init()`之前并没有见过，它从哪里来，它能干什么？顺着`core/index.js`的执行过程——初始混合(initMixin) -> 状态混合(stateMixin) -> ... -> 渲染混合(renderMixin)，你终于窥到了`Vue`的全貌：

完整的 `Vue` 对象（来自core/instance/index.js）
````
class Vue {
  _data: any

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
此时，`this._init(options)`自然而然的浮现在你的面前：
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

### 第二回 初探`Vue`响应式系统
oh yeah, so easy! `_init`无非就是合并了`options`，再进行一系列初始化操作。又由于我们的任务是关注数据(data)的变化，所以我们把重点放在`initState(vm)上。

core/instance/state.js
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
  observe(data, true /* asRootData */)
}
````
看来，初始化数据的关键就是执行`observe(data, true)`了。那么，`observe`是什么？它是如何**观察**`data`的呢？

#### 源码及注释：https://github.com/CaptainLiao/source-code-analysis/tree/master/VUE