/**
 * 现在主流浏览器已经内置 fetch 功能 http://blog.csdn.net/renfufei/article/details/51494396
 * 这里的代码是做 polyfill 的
 */
(function() {
  'use strict';

  // 如果发现全局中有fetch，直接返回
  if (window.fetch) {
    return
  }

  // 遍历headers 对象，将其深度拷贝到 this.map 上
  function Headers(headers) {
    this.map = {}

    var self = this
    // 如果 headers 已经是 Headers 的实例
    // 那么遍历
    if (headers instanceof Headers) {
      headers.forEach(function(name, values) {
        values.forEach(function(value) {
          self.append(name, value)
        })
      })

    } else if (headers) { // 否则，
      // Object.getOwnPropertyNames(obj) 返回obj 对象上所有属性名组成的数组
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        // 执行 append 方法
        self.append(name, headers[name])
      })
    }
  }

  Headers.prototype.append = function(name, value) {
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype.delete = function(name) {
    delete this.map[name]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[name]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[name] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(name)
  }

  Headers.prototype.set = function(name, value) {
    this.map[name] = [value]
  }

  // Instead of iterable for now.
  Headers.prototype.forEach = function(callback) {
    var self = this
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      callback(name, self.map[name])
    })
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return new Promise.reject(new TypeError('Body already consumed'))
    }
    body.bodyUsed = true
  }

  function Body() {
    this.body = null
    this.bodyUsed = false

    this.arrayBuffer = function() {
      throw new Error('Not implemented yet')
    }

    this.blob = function() {
      var rejected = consumed(this)
      return rejected ? rejected : Promise.resolve(new Blob([this.body]))
    }

    this.formData = function() {
      return Promise.resolve(decode(this.body))
    }

    this.json = function() {
      var rejected = consumed(this)
      if (rejected) {
        return rejected
      }

      var body = this.body
      return new Promise(function(resolve, reject) {
        try {
          resolve(JSON.parse(body))
        } catch (ex) {
          reject(ex)
        }
      })
    }

    this.text = function() {
      var rejected = consumed(this)
      return rejected ? rejected : Promise.resolve(this.body)
    }

    return this
  }

  function Request(url, options) {
    options = options || {}
    this.url = url
    this.body = options.body
    this.credentials = options.credentials || null
    this.headers = new Headers(options.headers)
    this.method = options.method || 'GET'
    this.mode = options.mode || null
    this.referrer = null
  }

  function encode(params) {
    return Object.getOwnPropertyNames(params).filter(function(name) {
      return params[name] !== undefined
    }).map(function(name) {
      var value = (params[name] === null) ? '' : params[name]
      return encodeURIComponent(name) + '=' + encodeURIComponent(value)
    }).join('&').replace(/%20/g, '+')
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function isObject(value) {
    try {
      // 返回 value 的原型
      // 等同于 Object.prototype.toString.call(value) === '[object Object]'
      return Object.getPrototypeOf(value) === Object.prototype
    } catch (ex) {
      // 如果 value 为 null 或 undefined ，会报错，这里catch 一下
      return false
    }
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = xhr.getAllResponseHeaders().trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Request.prototype.fetch = function() {
    var self = this

    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest()

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: headers(xhr)
        }
        resolve(new Response(xhr.responseText, options))
      }

      xhr.onerror = function() {
        reject()
      }

      xhr.open(self.method, self.url)

      self.headers.forEach(function(name, values) {
        values.forEach(function(value) {
          xhr.setRequestHeader(name, value)
        })
      })

      var body = self.body
      if (isObject(self.body)) {
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
        body = encode(self.body)
      }
      xhr.send(body)
    })
  }

  Body.call(Request.prototype)

  function Response(body, options) {
    this.body = body
    this.type = 'default'
    this.url = null
    this.status = options.status
    this.statusText = options.statusText
    this.headers = options.headers
  }

  Body.call(Response.prototype)

  window.fetch = function (url, options) {
    return new Request(url, options).fetch()
  }
})()
