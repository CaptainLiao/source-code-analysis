
Vue.use(VueRouter):vue ---> VueRouter.install():void --> router.init()


## new VueRouter()
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
    * 保存`positionStore`:
      ````
      const key = getStateKey()
      if (key) {
        positionStore[key] = {
          x: window.pageXOffset,
          y: window.pageYOffset
        }
      }
      ````
    * 并且设置一个全局`key`


