/* @flow */

import { isRegExp, remove } from 'shared/util'
import { getFirstComponentChild } from 'core/vdom/helpers/index'

type VNodeCache = { [key: string]: ?VNode };

function getComponentName (opts: ?VNodeComponentOptions): ?string {
  return opts && (opts.Ctor.options.name || opts.tag)
}

// 根据组件的 name 字段进行匹配
function matches (pattern: string | RegExp | Array<string>, name: string): boolean {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  /* istanbul ignore next */
  return false
}

// 遍历实例中的cache对象，销毁不满足条件的cachedNode
function pruneCache (keepAliveInstance: any, filter: Function) {
  // 从 keepAliveInstance 解构出需要的对象
  const { cache, keys, _vnode } = keepAliveInstance

  // 遍历实例中的cache对象
  for (const key in cache) {
    const cachedNode: ?VNode = cache[key]
    if (cachedNode) {
      const name: ?string = getComponentName(cachedNode.componentOptions)
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode)
      }
    }
  }
}

function pruneCacheEntry (
  cache: VNodeCache,
  key: string,
  keys: Array<string>,
  current?: VNode
) {
  const cached = cache[key]
  // 销毁被缓存的组件实例
  if (cached && cached !== current) {
    cached.componentInstance.$destroy()
  }
  cache[key] = null
  // 将key从keys中移除
  remove(keys, key)
}

const patternTypes = [String, RegExp, Array]

export default {
  name: 'keep-alive',
  abstract: true,

  props: {
    // 根据组件 name 进行匹配。如果 name 选项不可用，则匹配它的局部注册名称 (父组件 components 选项的键值)。匿名组件不能被匹配。
    include: patternTypes,  // 匹配的组件将会被缓存
    exclude: patternTypes,  // 匹配的组件不会被缓存
    max: [String, Number]   // 最大缓存组件数
  },

  created () {
    // 保存缓存的组件
    this.cache = Object.create(null)
    // 保存缓存的组件的key
    this.keys = []
  },

  // 注销钩子函数
  destroyed () {
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },

  watch: {
    include (val) {
      pruneCache(this, name => matches(val, name))
    },
    exclude (val) {
      pruneCache(this, name => !matches(val, name))
    }
  },

  // 渲染<keep-alive>组件时，执行render方法  
  render () {
    // this 表示当前渲染的<keep-alive>组件
    // this.$slots.default 包含了所有非具名插槽节点
    // 这里取得第一个子组件，因为进过包装的模板长这样： <keep-alive> <slot></slot> </keep-alive>
    const vnode = getFirstComponentChild(this.$slots.default)
    const componentOptions = vnode && vnode.componentOptions

    if (componentOptions) {
      // check pattern
      const name = getComponentName(componentOptions)

      // 组件有name字段,
      //  如果name不在include中，或者name在exclude中，直接返回 vnode，即不进行keep-alive
      if (name && (
        (this.include && !matches(this.include, name)) ||
        (this.exclude && matches(this.exclude, name))
      )) {
        return vnode
      }
      
      // 对组件进行缓存
      const { cache, keys } = this
      const key = vnode.key == null
        // 相同的构造器（constructor）可能会注册为不同的本地组件，所以仅有一个 cid 是不够的（#3269）。
        ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
        : vnode.key
      
      if (cache[key]) { // 如果已经缓存了，需要保持当前的key 是最新的
        vnode.componentInstance = cache[key].componentInstance
        remove(keys, key)
        keys.push(key)
      } else {  // 否则，进行缓存并更新keys数组。
        cache[key] = vnode
        keys.push(key)
        // 缓存组件超出最大值，将队首的组件销毁（先进先出）
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode)
        }
      }

      vnode.data.keepAlive = true
    }
    return vnode
  }
}
