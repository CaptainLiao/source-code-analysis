> 我们知道它是工作的，但却不清楚为何一开始它是工作的。

按照文档，我可以很快创建一个 Vue 工程并运行起来，并热衷于搜寻机智/高深的写法、概念——JSX,HOCs,VNode...但却不知道 vue 是如何将它们组织起来，正确的渲染到页面，泻特！

so，今天便围绕**页面渲染**这一关键词，来看看VUE是怎么做的。

### 起步
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
* 执行 mountComponent(this, el, hydrating) //lifecycle.js
  + `vm._watcher = new Watcher(vm, () => vm._update(vm._render(), hydrating), noop)`
  + 通过Watcher的绑定，每当数据发生变化时，首先执行`vm._render()`得到 vnode
  + 再执行`vm._update(vnode,hydrating)`更新DOM

### VNode & patch

我们知道Render函数执行生成了VNode，而VNode只是Virtual DOM，我们还需要通过DOM Diff之后，来生成真正的DOM节点。在Vue.js 2.0中，是通过/src/core/vdom/patch.js中的patch(oldVnode, vnode ,hydrating)方法来完成的。

该方法有三个参数oldVnode表示旧VNode，vnode表示新VNode，hydrating表示是否直接使用服务端渲染的DOM元素，这个本文不作讨论。

其主要逻辑为当VNode为真实元素或旧的VNode和新的VNode完全相同时，直接调用createElm方法生成真实的DOM树，当VNode新旧存在差异时，则调用patchVnode方法，通过比较新旧VNode节点，根据不同的状态对DOM做合理的添加、删除、修改DOM（这里的Diff算法有兴趣的读者可以自行阅读patchVnode方法，鉴于篇幅不再赘述），再调用createElm生成真实的DOM树。

### 小结
回过头来看，这里的渲染逻辑并不是特别复杂，核心关键的几步流程还是非常清晰的：

* new Vue，执行初始化
* 挂载$mount方法，通过自定义Render方法、template、el等生成Render函数
* 通过Watcher监听数据的变化
* 当数据发生变化时，Render函数执行生成VNode对象
* 通过patch方法，对比新旧VNode对象，通过DOM Diff算法，添加、修改、删除真正的DOM元素

部分内容引自：http://blog.csdn.net/generon/article/details/72482844

