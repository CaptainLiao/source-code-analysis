import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  // 判断this 是否是 Vue 的一个实例
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  
  /**
  * 开始初始化，_init() 方法在initMixin中
  * this.$options = {
      components,
      directives,
      filters,
      options,
      vm
    }
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm)
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')
   */
  this._init(options)
}

/**
 * 在 Vue 上挂载 _init()
 */
initMixin(Vue)

/**
 * $data
   $props
   $set
   $delete
   $watch
   其中，$data、$props只有getter()
 */
stateMixin(Vue)

/**
 * $on
   $once
   $off
   $emit
 */
eventsMixin(Vue)

/**
 * _update
   $forceUpdate
   $destroy
 */
lifecycleMixin(Vue)

/**
 * $nextTick 
   _render
 */
renderMixin(Vue)

export default Vue
