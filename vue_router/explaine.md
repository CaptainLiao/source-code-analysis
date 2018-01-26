
Vue.use(VueRouter):vue ---> VueRouter.install():void --> router.init()


## new VueRouter()
### （一）路由变化，保存滚动的`position`
````
if (supportsScroll) {
  setupScroll()
}
````
**伪代码如下：**
如果有：
  `supportsPushState && scrollBehavior` 为真
则：
  监听`popstate`事件：
    * 先保存`positionStore`:
      ````
      const key = getStateKey()
      if (key) {
        positionStore[key] = {
          x: window.pageXOffset,
          y: window.pageYOffset
        }
      }
      ````
    * 再设置一个全局的新`key`，以覆盖之前的值

### （二）路由变化，页面跳转后滚动到指定位置
````
window.addEventListener('popstate', e => {
  this.transitionTo(location, route => {
    handleScroll(router, route, current, true)
  })
})
````
**伪代码如下：**
  * 监听`popstate`：
    页面跳转到，成功完成后执行`handleScroll`
  * 执行`handleScroll`:
    获取最新`positionStore[key]`值，并滚动到这个位置


## 实例说明
假设`scrollBehavior`表现如下：
````
const scrollBehavior = (to, from, savedPosition) => {
  if (savedPosition) {
    return savedPosition;
  } else {
    const position = {
      x: 0,
      y: 0
    };
    if (to.meta.keepAlive) {
      position.y = document.body.scrollTop;
    }
    return position;
  }
};
````
又，假设页面`A`第一次路由到页面`B`，且`A`路由的`keepAlive`为真，`B`不存在`keepAlive`。

以上是背景.....

首先我们需要进入`A`页面，此时：
（1）触发`popstate`事件执行`setupScroll`函数，即：
  * 由系统生成一个`key`作为`positionStore`的属性，用来保存页面滚动的位置（此刻页面并没有滚动）；
  * 将事件的`e.state.key`值覆盖由系统生成的`key`值；
  * *参考：（一 ）路由变化，保存滚动的`position`。*

（2）再次触发`popstate`事件，这里才会真正的进入到`A`页面，成功后进行以下操作：
  * 获取(1)中第二步生成的`key`，得到`positionStore[key]`的值，此时为`undefined`
  * 执行`scrollBehavior(to, from, positionStore[key])`，返回`position`，此时`position.y=0;position.x=0`；
  * 执行页面滚动`window.scrollTo(position.x, position.y)`。

此时，因为`B`不存在`keepAlive`，所以只简单的进行页面跳转。

当我们点击浏览器返回按钮时，即从`B`跳转到`A`，此时：

（1）触发`popstate`事件执行`setupScroll`函数，即：
  * 由系统生成一个`key`作为`positionStore`的属性，用来保存页面滚动的位置；
  * 将事件的`e.state.key`值覆盖由系统生成的`key`值；
  * *参考：（一 ）路由变化，保存滚动的`position`。*

（2）再次触发`popstate`事件，这里才会真正的跳转到`A`页面，成功后进行滚动操作：
  * 获取(1)中第二步生成的`key`，得到`positionStore[key]`的值，此时为`undefined`
  * 执行`scrollBehavior(to, from, positionStore[key])`，返回`position`。（此时`position.y`的值就等于`A`页面的`document.body.scrollTop`）。
  * 执行`window.scrollTo(position.x, position.y)`，滚动到
