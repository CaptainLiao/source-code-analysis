对于`computed`和`watch`的直观区别，官方文档的解释为：

computed 计算属性，基于依赖进行【缓存】，有且只有相关依赖发生改变时才会重新求值。由于缓存的存在，computed 适合较为复杂的逻辑。

watch 侦听属性，响应被监听数据的变化。当需要在数据变化时执行异步或开销较大的操作时，这个方式是最有用的。

显然，我们并不满足于这样浅显的解释，我们还想知道在 VUE 内部，它们是如何实现、如何工作的。

要搞懂事物之间的联系和区别，我们得知道它从哪儿来，到哪儿去，干什么。所以，我们先看看 computed&watch 是从哪儿来的。

注意：*删除了代码警告，使用 web 运行环境*

**什么是响应式对象**
通过 Object.defineProperty 重新定义某对象的 getter 和 setter，以实现：
* 访问其属性触发 getter，收集依赖：get -> dep.depend() -> watcher.addDep()，
* 修改其属性执行 setter，通知更新：set -> dep.notify() -> watcher.update()。

我们称之为响应式对象，详见 defineReactive 函数。

### computed 初始化

计算属性的初始化发生在`src/core/instance/state`中的`initComputed(vm, opts.computed)`方法内：
````js
const computedWatcherOptions = { lazy: true }
function initComputed (vm: Component, computed: Object) {
  vm._computedWatchers = Object.create(null)

  for (const key in computed) {
    const userDef = computed[key]
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    // create internal watcher for the computed property.
    vm._computedWatchers[key] = new Watcher(
      vm,
      getter || noop,
      noop,
      computedWatcherOptions
    )

    if (!(key in vm)) {
      defineComputed(vm, key, userDef)
    }
  }
}
````
initComputed 函数逻辑如下：
将 vm._computedWatcher 设置为一个空对象，
遍历 computed，
* 拿到计算属性中 key 对应的值 userDef，
* 获取 userDef 的 getter，
* 为每个 computed 属性创建内部 watcher，我称它为 `lazy watcher`*new Watcher 中有个 { lazy: true } 的参数*
* 如果 key 不是 vm 的属性，则调用 defineComputed(vm, key, userDef)

接着我们看看 defineComputed 的实现：
````js
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

export function defineComputed (
  target,
  key,
  userDef: Object | Function
) {
  const shouldCache = !isServerRendering()
  
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = createComputedGetter(key)
    sharedPropertyDefinition.set = noop
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? userDef.cache === true
        ? createComputedGetter(key)
        : userDef.get
      : noop
    sharedPropertyDefinition.set = userDef.set || noop
  }

  Object.defineProperty(target, key, sharedPropertyDefinition)
}
````
利用 Object.defineProperty 给计算属性的 key 增加 getter 和 setter。setter 很简单，它是一个空函数或者一个对象，开发中我们很少使用。重点是 getter，它对应的是 createComputedGetter(key) 的返回值，来看一下它的定义：

````js
function createComputedGetter (key) {
  return function computedGetter () {
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate()
      }
      if (Dep.target) {
        watcher.depend()
      }
      return watcher.value 
    }
  }
}
````
createComputedGetter 返回函数 computedGetter，它就是计算属性对应的 getter。

到此，计算属性的初始化就完成了。

### watch 初始化
监听/侦听属性的初始化发生在`src/core/instance/state`中的`initWatch (vm, watch)`方法内：
````js
function initWatch (vm: Component, watch: Object) {
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}
````
类似的，遍历 watch 对象，拿到 key 对应的 handler。由于同一个 key 可以对应多个 handler，所以需要判断 handler 是否为数组，如果是，遍历数组执行createWatcher，否则直接执行 createWatcher：

````js
function createWatcher (
  vm: Component,
  keyOrFn: string | Function,
  handler: any,
  options?: Object
) {
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  return vm.$watch(keyOrFn, handler, options)
}

````
想想平时我们是如何 watch 一个属性的，它可以是一个函数、对象、字符串。

所以，createWatcher 会对 handler 做一系列判断，拿到最终的回调函数后，调用 vm.$watch()。

$watch 和 initWatch 定义在同一个文件中：
````js
  Vue.prototype.$watch = function (
    expOrFn,
    cb
    options
  ) {
    const vm: Component = this
    if (isPlainObject(cb)) return createWatcher(vm, expOrFn, cb, options)

    options = options || {}
    options.user = true
    const watcher = new Watcher(vm, expOrFn, cb, options)

    if (options.immediate) {
      cb.call(vm, watcher.value)
    }

    return function unwatchFn () {
      watcher.teardown()
    }
  }
````
如果 cb 是一个对象，那么 return createWatcher()。这是因为定义在 VUE 原型上的 $watch 方法可以被用户直接调用，传入的回调 cb 可以是任意类型(函数、对象、字符串)。

否则，设置 options.user = true，并实例化一个 watcher，可以称它为`user watcher`。这样，一旦 watch 的值发生变化，就会执行 cb，如果参数中 immediate 为真，还会先执行一次 cb。

最后，返回 unwatchFn 函数，它调用 watcher 的 teardown 方法来移除这个 wacher。

现在，我们知道了 lazy watcher 和 user watcher。它们之间有什么联系/区别呢？VUE 中是否还存在其他类型的 watcher？

带着这些疑问，我们一起深入 Watcher，它位于 src/core/observer/watcher.js

### Watcher options

````js
if (options) {
  this.deep = !!options.deep
  this.user = !!options.user
  this.lazy = !!options.lazy
  this.sync = !!options.sync
} else {
  this.deep = this.user = this.lazy = this.sync = false
}
````
我们看到，在 Watcher 类中，一共有 4 中类型:
* `deep watcher`: 深度 watcher，不仅能够侦听对象本身的变化，还能逐层侦听到对象内部值的变化。
* `user watcher`: 用户 watcher，缺省
* `lazy watcher`：用于计算属性的 watcher，具有缓存，惰性取值
* `sync watcher`: 同步 watcher

#### deep watcher
我们一般这样使用 deep watcher：
````js
watch: {
  someObj: {
    deep: true,
    handler(newValue) {
      // do whatever you want,eg:
      console.log(newValue)
    }
  }
}
````
每当我们访问 someObj 的值时，会触发该 watcher 的 get 函数：
````js
get () {
  let value = this.getter.call(vm, vm)
  ...
  if (this.deep) {
    traverse(value)
  }
  ...
  return value
}
````
首页从该对象的 getter 中取值，然后调用 traverse(value) 方法，它也定义在 src/core/observer/watcher.js:
````js
const seenObjects = new Set()
function traverse (val: any) {
  seenObjects.clear()
  _traverse(val, seenObjects)
}

function _traverse (val: any, seen: ISet) {
  let i, keys
  const isA = Array.isArray(val)
  if ((!isA && !isObject(val)) || !Object.isExtensible(val)) {
    return
  }
  if (val.__ob__) {
    const depId = val.__ob__.dep.id
    if (seen.has(depId)) {
      return
    }
    seen.add(depId)
  }
  if (isA) {
    i = val.length
    while (i--) _traverse(val[i], seen)
  } else {
    keys = Object.keys(val)
    i = keys.length
    while (i--) _traverse(val[keys[i]], seen)
  }
}
````
traverse 函数会递归遍历一个对象，因为递归过程就是对对象内部属性的访问，所以就会触发属性自己的 getters，于是，所有属性作为依赖被该对象的 watcher 收集。另外，_traverse 还做了一个小优化：将遍历到的 dep.id 存入 Set 内，避免重复访问。

这样，每当修改被 watch 的对象内部属性，就会触发回调函数 handler。

#### user watcher
每次调用 $watch 函数，都会创建一个 user watcher，它的作用就是处理取值遇到的错误。
````js
get () {
  let value = this.getter.call(vm, vm)
  ...
  catch(e) {
    if (this.user) {
      handleError(e, vm, `getter for watcher "${this.expression}"`)
    } else {
      throw e
    }
  }
  ...
  return value
}
````

#### lazy watcher
文章开始就提到过，计算属性本质上是一个 lazy watcher，这里我们详细分析下 lazy watcher 的实现。
````js
class Watcher {
  constructor(options) {
    ...
    this.dirty = this.lazy
    ...
    this.value = this.lazy ? undefined : this.get()
  }
}
````
可以看到，在 Watcher 实例化时，如果是一个 lazy watcher，则标记 dirty 为真，并且不会立即求值。拿官方的例子来说：
````js
var vm = new Vue({
  el: '#demo',
  data: {
    firstName: 'Foo',
    lastName: 'Bar'
  },
  computed: {
    fullName: function () {
      return this.firstName + ' ' + this.lastName
    }
  }
})
````
即在初始化完成后，fullName 的值为 undefined。当 render 函数访问 fullName 的时候，才触发它的 getter，拿到计算属性对应的 watcher，执行`watcher.evaluate()`和`watcher.depend()`后，返回`watcher.value`，得到最终的结果`Foo Bar`。

evaluate/depend 是 Watcher 类的原型方法：
````js
// 计算 watcher 的值，仅适用于 lazy watcher
evaluate () {
  this.value = this.get()
  this.dirty = false
}
// Depend on all deps collected by this watcher.
depend () {
  let i = this.deps.length
  while (i--) {
    this.deps[i].depend()
  }
}
````
第一步，evaluate 执行当前 watcher 的 get() 方法：
  * a.执行 pushTarget(this) ，这样会把 Dep.target 指向当前正在执行计算的 watcher。
  * b.执行 this.getter() 得到结果，在本例中就是执行 function () {return this.firstName + ' ' + this.lastName}。
第二步，收集当前 watcher 的依赖添加到 Dep.target 指向的 watcher 中

值得注意的是，由于 firstName 和 lastName 都是响应式的，上面的 b 操作会触发这两个对象的 getter，这会把它们各自持有的 dep 添加到当前的 lazy watcher 中。

#### sync watcher
当某个被 watch 的值发生变化的时候，会执行一系列函数：setter() -> dep.notify() -> watcher.update()。如果设置了 sync 为真，就在当前 tick 中执行 watcher 的回调方法。
````js
update () {
  if (this.lazy) {
    this.dirty = true
  } else if (this.sync) {
    // 在当前 tick 中执行 watcher.run()
    this.run()
  } else {
    // 将 watcher 推入到待执行队列中，在下一个 tick 中执行 watcher.run()
    queueWatcher(this)
  }
}
````




