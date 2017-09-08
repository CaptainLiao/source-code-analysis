(function () {
  var wrapper = function (obj) {
    this.__wrapped = obj;
  }

  var __ = function (obj) {
    return new wrapper(obj);
  }

  var m = __(22)

  __.each = function (obj, iterator, context) {
    var index = 0;
    try {
      // 如果对象有forEach 方法，就使用原生方法
      if (obj.forEach) {
        obj.forEach(iterator, context);
      }
      // 如果对象有 length 属性，则按照数组进行遍历 
      else if (obj.length) {
        for (var i = 0, l = obj.length; i < l; i++) iterator.call(context, obj[i], i, obj);
      }
      // 遍历对象
      else {
        var keys = __.keys(obj),
          l = keys.length;
        for (var i = 0; i < l; i++) iterator.call(context, obj[keys[i]], keys[i], obj);
      }
    } catch (e) {
      if (e != breaker) throw e;
    }
    return obj;
  };
  __.map = function (obj, iterator, context) {
    if (obj && obj.map) return obj.map(iterator, context);
    var results = [];
    __.each(obj, function (value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var result = function (obj, chain) {
    return chain ? __(obj).chain() : obj;
  };


  // 将 Underscore 的所有函数添加到 warpper 对象上。
  // __.functions(__) 取得 __ 对象上的所有函数名，返回一个数组，遍历这个数组
  __.each(['each', 'map'], function (name) {
    // 给 wrapper 的原型上添加方法
    console.log(name)
    wrapper.prototype[name] = function () {
      // 将 this.__wrapped 对象放在 arguments 数组的首位，它有什么作用呢？？？
      console.log(arguments);
      Array.prototype.unshift.call(arguments, this.__wrapped);
      console.log(this)
      result(__[name].apply(__, arguments), this.__chain);
    };
  });

  // 将所有数组原生方法添加到 wrapper 对象上
  __.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function (name) {
    wrapper.prototype[name] = function () {
      Array.prototype[name].apply(this.__wrapped, arguments);
      return result(this.__wrapped, this.__chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function () {
    this.__chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function () {
    return this.__wrapped;
  };
  console.log(m)

})()