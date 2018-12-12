对于`computed`和`watch`的直观区别：

computed 计算属性，基于依赖进行【缓存】，有且只有相关依赖发生改变时才会重新求值。由于缓存的存在，computed 适合较为复杂的逻辑。

watch 侦听属性，响应被监听数据的变化。当需要在数据变化时执行异步或开销较大的操作时，这个方式是最有用的。


为了搞明白这个属性的实际区别，得去 VUE 源码走一遭。

#### computed

计算属性的初始化发生在`src/core/instance/state`中的`initComputed(vm, opts.computed)`方法内，去掉了一些敬告：
````js
const computedWatcherOptions = { lazy: true }
function initComputed (vm: Component, computed: Object) {
  const watchers = vm._computedWatchers = Object.create(null)

  for (const key in computed) {
    const userDef = computed[key]
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    // create internal watcher for the computed property.
    watchers[key] = new Watcher(
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
首先创建 vm._computedWaatcher 为一个空对象，
遍历 computed，
* 拿到计算属性的每个 key 对应的值 userDef，
* 获取 userDef 的 getter，
* 为每个 getter 创建一个 wacher

