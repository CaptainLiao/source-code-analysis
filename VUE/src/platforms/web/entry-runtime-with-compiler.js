/* @flow */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

import Vue from './runtime/index'
import { query } from './util/index'
import { shouldDecodeNewlines } from './util/compat'
import { compileToFunctions } from './compiler/index'

const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

/**
 * 缓存 $mount，等下会被 overwrite
 * 此处的 mount 引用自 './runtime/index'，只做 mountComponent(this, el, hydrating) ：
 * 1 执行 render 方法得到 vnode
 * 2 更新 vnode 到真实 dom 上
 * 
 */ 
const mount = Vue.prototype.$mount

// overwrite
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el)

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  /**
   * 当 options.render 不存在时，
   * 处理模板template，并且将其编译为 render&staticRenderFns 函数后分别挂载到 options 上，
   * 最后执行 mountComponent(this, el, hydrating)
   * 
   * vue-loader等预处理器 会将 .vue文件中的<template>转换为模板字符串，并作为options.template 值导出
   * eg:
   * some-file.vue有如下内容：
   * <template>
   *   <div>这是一个.vue组件</div>
   * </template>
   * 
   * 经过vue-loader转化----->
   * some-file.vue --> some-file.js:
   * module.exports.options.template = "\n<div _v-028af462=\"\">这是一个.vue组件</div>\n"
   * 
   * 在实例化Vue时，options.template 作为参数传入，最终挂载到 this.$optons 上
   */
  if (!options.render) {
    // template 可对应上面的 "\n<div _v-028af462=\"\">这是一个.vue组件</div>\n"
    let template = options.template
    if (template) {

      if (typeof template === 'string') { // template 为字符串
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) { // 当 template 为 dom 节点
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) { // 不存在 template 且存在 element
      template = getOuterHTML(el)
    }
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }

      /**
       * 将 template 通过 compileToFunctions 函数编译。
       * 返回一个对象：
       * {  ast,
       *    render,
       *    staticRenderFns
       * }
       * 解构后挂载到 this.$options 上
       * 
       * staticRenderFns不需要在VNode更新时进行patch，优化性能
       */
      const { render, staticRenderFns } = compileToFunctions(template, {
        shouldDecodeNewlines,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  /* 执行 mountComponent(this, el, hydrating)  */
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue
