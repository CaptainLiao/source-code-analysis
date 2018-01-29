
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
    if (supportsScroll) {
      handleScroll(router, route, current, true)
    }
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
又，假设页面`A`第一次路由到页面`B`，再返回`A`，且`A`路由的`keepAlive`为真，`B`不存在`keepAlive`。

请详细描述整个路由的过程发生了什么？

---------------------割背景---------------------

由题可知，`A、B`页面`supportsScroll`为都为真

**第一步：**首先我们需要进入`A`页面，此时页面并没有滚动，即滚动距离都为0：
（1）触发`popstate`事件。
  * 执行`setupScroll()`，即：
    * 去全局中获取`key`，因不存在，这里由系统生成一个`key`作为`positionStore`的属性，用来保存页面滚动的位置；
    * 将事件的`e.state.key`值**覆盖**由系统生成的`key`值（注意理解这句话）；
    * *参考：（一 ）路由变化，保存滚动的`position`。*

（2）再次触发`popstate`事件。
  * 这里先执行`transitionTo()`进入到`A`页面，成功后执行回调进行以下操作：
    * 获取(1)中生成的`key`，得到`positionStore[key]`的值，此时为`undefined`；
    * 执行`scrollBehavior(to, from, positionStore[key])`，返回`position`。此时`A`页面的`document.body.scrollTop = 0`；
    * 执行`window.scrollTo(0, 0)`，页面`A`滚动。

**第二步：**从`A`跳转到`B`，此时，
（1）触发`popstate`事件。
  * **此时仍然停留在`A`**；
  * 执行`setupScroll()`，即：
    * 去全局中获取`key`（第一步生成的`key`）作为`positionStore`的属性，用来保存`A`页面滚动的位置；
    * 将事件的`e.state.key`值**覆盖**第一步生成的`key`值；

（2）再次触发`popstate`事件，
  * **真正跳转到`B`**，成功后进行以下回调操作
    * 获取第二步(1)中生成的`key`，得到`positionStore[key]`的值为`undefined`
    * 执行`scrollBehavior(to, from, positionStore[key])`，返回`position`(因`keepAlive=false`所以position={x: 0, y: 0})。
    * 执行`window.scrollTo(position.x, position.y)`，`B`页面滚动。

**第三步：**当我们点击浏览器返回按钮时，即从`B`跳转到`A`，此时：
（1）触发`popstate`事件。
  * 执行`setupScroll()`，即：
    * 获取第二步(1)中生成的`key`作为`positionStore`的属性，用来保存`B`页面滚动的位置；
    * 将事件的`e.state.key`值**覆盖**第二步(1)中生成的`key`值。因为`A`未被销毁，所以这里的`key`和第一步(1)中生成的`key`相同；

（2）再次触发`popstate`事件：
  * **真正跳转到`A`**，成功后进行以下回调操作(`B`被销毁)
    * 获取第三步(1)中生成的`key`，得到`positionStore[key]`的值为`A`上一次滚动的值
    * 执行`scrollBehavior(to, from, positionStore[key])`，直接返回`positionStore[key]`
    * `position = positionStore[key]`，执行`window.scrollTo(position.x, position.y)`，`A`页面滚动。
