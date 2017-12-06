/* @flow */

import { toArray } from '../util/index'


// Vue 插件开发不一定要实现 install 方法，但最好有
export function initUse (Vue: GlobalAPI) {
  // 插件 plugin 是一个函数或者对象
  Vue.use = function (plugin: Function | Object) {

    // 变量 installedPlugins 指向 this._installedPlugins
    // 即：如果动态改变（不是重新赋值） installedPlugins，this._installedPlugins 也会随之改变 
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))

    // 阻止多次使用同一个插件
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    // 转化 arguments 成为一个数组
    const args = toArray(arguments, 1)
    // args队首添加一个Vue构造器
    args.unshift(this)

    if (typeof plugin.install === 'function') { // 如果install是一个函数，则执行
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {  // 若plugin是函数，执行之
      plugin.apply(null, args)
    }
    // 此时 plugin 是一个对象
    // this._installedPlugins 也一并发生变化
    installedPlugins.push(plugin)
    return this
  }
}
