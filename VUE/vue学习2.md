## 第二章 修炼`Vue`大法
“我原本只是一个构造函数，是尤大发现了我，并赋予我非凡的能力。尤大将我开源原本是造福众屌丝，不曾想在江湖中掀起腥风血雨，罪过罪过。既然你有缘来到这里，我便将`Vue`大法传给你，谨记：尽信书不如无书。”

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

### initMixin
`initMixin(Vue)`在`core/instance/init.js`中，简化后代码如下：
````
export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    // todo
  }
}
````
再看`Vue.prototype._init`做了什么：
````
  Vue.prototype._init = function (options?: Object) {
    // todo
    const vm: Component = this
    vm.$options = {
      components,
      directives,
      filters,
      options,
      vm
    }
    initProxy(vm)
    vm._self = vm
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm)
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
```

