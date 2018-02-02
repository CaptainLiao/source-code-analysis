
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
又，假设进入应用的页面是`A`，在从`A`路由到`B`，再返回`A`，且`A`路由的`keepAlive`为真，`B`不存在`keepAlive`。

请详细描述整个路由的过程发生了什么？

---------------------割背景---------------------

由题可知，`A、B`页面`supportsScroll`为都为真

**第一步：**进入应用，第一次来到`A`页面，并不会触发`popstate`事件，跳过。

**第二步：**从`A`跳转到`B`，此时，
（1）拦截`B`页面的`popstate`事件。
  * **此时仍然停留在`A`**；
  * 执行`setupScroll()`，即：
    * 去全局中获取`key`，若不存在，则由系统生成，`positionStore[key]`保存`A`页面滚动的位置；
    * 将`B`的`e.state.key`**覆盖**全局中的`key`；

（2）再次拦截`popstate`事件，
  * **执行跳转到`B`**，成功后进行以下回调操作
    * 获取此步(1)中生成的`key`，得到`positionStore[key]`的值为`undefined`
    * 执行`scrollBehavior(to, from, positionStore[key])`，返回`position`(因`keepAlive=false`所以position={x: 0, y: 0})。
    * 执行`window.scrollTo(position.x, position.y)`，`B`页面滚动。

**第三步：**当我们点击浏览器返回按钮时，即从`B`跳转到`A`，此时：
（1）拦截`A`页面的`popstate`事件。
  * **此时仍然停留在`B`**；
  * 执行`setupScroll()`，即：
    * 获取全局中的`key`作为`positionStore`的属性，用来保存`B`页面滚动的位置；
    * 将`A`的`e.state.key`值**覆盖**全局中的`key`。
    * **特别注意：**因为`A`未被销毁，所以`e.state.key`保持不变。

（2）再次拦截`popstate`事件：
  * **执行跳转到`A`**，成功后进行以下回调操作(`B`被销毁)
    * 获取全局中的`key`，得到`positionStore[key]`，它保存着`A`上一次滚动的值
    * 执行`scrollBehavior(to, from, positionStore[key])`，`return positionStore[key]`
    * `position = positionStore[key]`，执行`window.scrollTo(position.x, position.y)`，`A`页面滚动。

再往后，路由之间的跳转就是重复执行第二步和第三步了。
