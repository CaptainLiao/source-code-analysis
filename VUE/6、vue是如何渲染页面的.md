> 我们知道它是工作的，但却不清楚为何一开始它是工作的。

按照文档，我可以很快创建一个 Vue 工程并运行起来，并热衷于搜寻机智/高深的写法、概念——JSX,HOCs,VNode...但却不知道 vue 是如何将它们组织起来，正确的渲染到页面，泻特！

so，今天便围绕**页面渲染**这一关键词，来看看VUE是怎么做的。

## 起步
在VUE文档[起步](https://cn.vuejs.org/v2/guide/index.html)中，创建了最简单的vue应用：
````
var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!'
  }
})
````
通过简洁的模板语法，声明式地将数据渲染进 DOM 的系统，最终呈现在网页上。这背后，究竟隐藏着怎样的秘密？

### new Vue(options)
通过之前的学习，我们已经知道，`new Vue(options)`时，会执行`this._init(options)`：
src/core/instance/init.js
````
Vue.prototype._init = function(options) {
  ...
  if (vm.$options.el) {
    vm.$mount(vm.$options.el)
  }
}
````
在`src/platforms/web/entry-runtime-with-compiler.js`可以找到`$mount`的定义，由于代码较多就不贴出来了，有兴趣的可以[结合源码](https://github.com/CaptainLiao/source-code-analysis/blob/master/VUE/src/platforms/web/entry-runtime-with-compiler.js)看，这里概括一下它做了哪些事情：
* 如果`this.$options.render`不存在
  + 编译模板 template，返回 render & staticRenderFns 函数；
  + 将函数分别挂载到 this.$options 上。
* 执行 mountComponent(this, el, hydrating)
  + 执行 this.$options.render()，得到 vnode
  + 更新 vnode：vm._update(vnode)

### VNode & patch

