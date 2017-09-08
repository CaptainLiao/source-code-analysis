// Underscore.js
// (c) 2009 Jeremy Ashkenas, DocumentCloud Inc.
// Underscore is freely distributable under the terms of the MIT license.
// Portions of Underscore are inspired by or borrowed from Prototype.js,
// Oliver Steele's Functional, and John Resig's Micro-Templating.
// For all details and documentation:
// http://documentcloud.github.com/underscore/

(function() {

  /*------------------------- 基础设置 ---------------------------------*/

  // 定义全局对象，在 browser 下 this 指向 window，在 server 下 this 指向 global。
  var root = this;

  // 使用 _ 作为 underscore 的预设值。
  var previousUnderscore = root._;

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. 
  // 如果 Underscore 作为函数来调用，则返回一个面向对象风格的 wrapped 对象。
  // wrapper 函数作为原型链，持有underscore 的所有功能/方法
  var wrapper = function(obj) { this._wrapped = obj; };

  // 定义breaker，作为跳出循环遍历的值。
  var breaker = typeof StopIteration !== 'undefined' ? StopIteration : '__break__';

  // 创建一个对 underscore 对象的安全引用
  var _ = root._ = function(obj) { return new wrapper(obj); };

  // 用CommonJS 的方式导出 underscore
  if (typeof exports !== 'undefined') exports._ = _;

  // 当前版本
  _.VERSION = '0.5.0';

  /*------------------------ 函数方法集合： ---------------------------*/

  // 核心的 each 方法实现
  // 返回原始 obj
  // @obj       {Object}    需要遍历的对象：实现了 forEach 方法的对象，数组和原生对象
  // @iterator  {Function}  遍历器：三个参数：currentValue, index, array
  // @context   {[Object]}  上下文：如有，iterator中的 this 就指向这个context

  _.each = function(obj, iterator, context) {
    var index = 0;
    try {
      // 如果对象有forEach 方法，就使用原生方法
      if (obj.forEach) {  
        obj.forEach(iterator, context);
      }
      // 如果对象有 length 属性，则按照数组进行遍历 
      else if (obj.length) {
        for (var i=0, l=obj.length; i<l; i++) iterator.call(context, obj[i], i, obj);
      } 
      // 遍历对象
      else {
        var keys = _.keys(obj), l = keys.length;
        for (var i=0; i<l; i++) iterator.call(context, obj[keys[i]], keys[i], obj);
      }
    } catch(e) {
      if (e != breaker) throw e;
    }
    return obj;
  };

  // map 方法，返回遍历处理后的数组
  // 如果被遍历的 obj 具有map方法，则直接使用js v1.6 的 map 方法并返回
  // 否则，使用 _.each 遍历obj，使得 obj 的每一项都经过 iterator 处理，并保存在results中
  _.map = function(obj, iterator, context) {
    if (obj && obj.map) return obj.map(iterator, context);
    var results = [];
    _.each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  // reduce，聚合obj对象的值并返回一个结果值
  // @memo       {Array}      用于初始化
  // @iterator   {Function}   聚合函数：previousValue，nextValue,currentIndex, array
  // @context    {Object}     绑定 iterator 的this指向
  _.reduce = function(obj, memo, iterator, context) {
    if (obj && obj.reduce) return obj.reduce(_.bind(iterator, context), memo);
    _.each(obj, function(value, index, list) {
      memo = iterator.call(context, memo, value, index, list);
    });
    return memo;
  };

  // reduceRight 从右侧开始聚合，reduce的逆向版
  _.reduceRight = function(obj, memo, iterator, context) {
    if (obj && obj.reduceRight) return obj.reduceRight(_.bind(iterator, context), memo);
    var reversed = _.clone(_.toArray(obj)).reverse();
    _.each(reversed, function(value, index) {
      memo = iterator.call(context, memo, value, index, obj);
    });
    return memo;
  };

  // 返回第一个 iterator 函数判断为 true 的值
  _.detect = function(obj, iterator, context) {
    var result;
    _.each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        _.breakLoop();
      }
    });
    return result;
  };

  // 返回所有 iterator 判断为 true 的元素数组
  // 如果存在 fileter 方法，直接使用并return
  _.select = function(obj, iterator, context) {
    if (obj.filter) return obj.filter(iterator, context);
    var results = [];
    _.each(obj, function(value, index, list) {
      iterator.call(context, value, index, list) && results.push(value);
    });
    return results;
  };

  // 返回所有 iterator 判断为 false 的元素数组
  // 与 _.select 相反
  _.reject = function(obj, iterator, context) {
    var results = [];
    _.each(obj, function(value, index, list) {
      !iterator.call(context, value, index, list) && results.push(value);
    });
    return results;
  };

  // 返回一个布尔值
  // 所有元素都为真时，结果为 true，否则为 false
  // 相当于 JS V1.6 的 every 方法
  // _.identity 为默认的迭代器函数，不做任何操作直接返回第一个参数（value）
  _.all = function(obj, iterator, context) {
    iterator = iterator || _.identity;
    if (obj.every) return obj.every(iterator, context);
    var result = true;
    _.each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) _.breakLoop();
    });
    return result;
  };

  // 返回一个布尔值
  // 当有任意元素为真时，结果为 true，否则为 false
  // 如果对象本身存在 some 方法，直接使用并 return
  _.any = function(obj, iterator, context) {
    iterator = iterator || _.identity;
    if (obj.some) return obj.some(iterator, context);
    var result = false;
    _.each(obj, function(value, index, list) {
      if (result = iterator.call(context, value, index, list)) _.breakLoop();
    });
    return result;
  };

  // 返回布尔值
  // 判断给定的 target 是否包含在 obj（数组或对象） 中
  // 使用 “===” 
  _.include = function(obj, target) {
    if (_.isArray(obj)) return _.indexOf(obj, target) != -1;
    var found = false;
    _.each(obj, function(value) {
      if (found = value === target) _.breakLoop();
    });
    return found;
  };

  // 对集合中的每一项注册方法，arguments作为方法参数
  _.invoke = function(obj, method) {
    var args = _.rest(arguments, 2);
    return _.map(obj, function(value) {
      return (method ? value[method] : value).apply(value, args);
    });
  };

  // 返回一个数组
  // 方便使用 map 提取集合中的某个/组属性
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // 返回一个最大值
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    var result = {computed : -Infinity};
    _.each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // 返回一个最小值
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
    var result = {computed : Infinity};
    _.each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // 使用 iterator 返回的值（criteria）对 obj 的值（value）进行排序
  // 返回排序后的对象的值的数组
  // _.map 返回一个数组，接着使用 _sort 排序，最后使用 _.pluck 提取出 value 作为数组返回
  _.sortBy = function(obj, iterator, context) {
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // 使用二分查找确定 obj 在 array(有序数组) 中的位置序号
  // obj 按照此序号插入能保证 array 原有的排序
  // 如果提供 iterator 函数，iterator 将作为 array 排序的依据
  // _.sortedIndex(array, obj, [interator])
  _.sortedIndex = function(array, obj, iterator) {
    iterator = iterator || _.identity;
    var low = 0, high = array.length;
    // 二分查找法
    while (low < high) {
      // >> 1 右移运算符，可以理解为 mid = parseInt((low + high)/2) 2的1次方
      // >> 2 右移运算符 a >> 2 === parseInt(a / (2*2)) 2 的平方
      // << 1 左移运算符 a << 1 === a * (2*1)
      // << 2 左移运算符 a << 2 === a * (2*2)
      var mid = (low + high) >> 1;
      // 二分查找的关键
      // iterator(array[mid]) < iterator(obj)，则只比较 mid 左侧的数组，继续循环，反之亦然
      // 每次都将数组分成两部分，结果只取1/2，这就是二分查找
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // 将任何可迭代对象转化为数组
  _.toArray = function(iterable) {
    if (!iterable)           return [];
    if (iterable.toArray)    return iterable.toArray();
    if (_.isArray(iterable)) return iterable;
    return _.map(iterable, function(val){ return val; });
  };

  // 返回对象的元素个数
  _.size = function(obj) {
    return _.toArray(obj).length;
  };

  /*-------------------------- 数组方法 ------------------------------*/

  // 返回数组中的第一个元素，如果有参数 n，返回第一个到第 n 个元素组成的新数组。
  // 别名：head
  _.first = function(array, n) {
    return n ? Array.prototype.slice.call(array, 0, n) : array[0];
  };

  // 返回除第一个元素以外的所有内容，别名：tail（尾巴）
  // 指定 index ，返回从 index 开始后的所有内容
  _.rest = function(array, index) {
    return Array.prototype.slice.call(array, _.isUndefined(index) ? 1 : index);
  };

  // Get 最后一个数组元素
  _.last = function(array) {
    return array[array.length - 1];
  };

  // 去掉所有值为 false 的元素
  // compact：紧凑、简洁
  _.compact = function(array) {
    return _.select(array, function(value){ return !!value; });
  };

  // 将嵌套多层的数组变成一维数组
  _.flatten = function(array) {
    return _.reduce(array, [], function(memo, value) {
      if (_.isArray(value)) return memo.concat(_.flatten(value));
      memo.push(value);
      return memo;
    });
  };

  // 返回不包含指定值（可指定多个）的新数组
  _.without = function(array) {
    var values = _.rest(arguments);
    return _.select(array, function(value){ return !_.include(values, value); });
  };

  // 数组去重，返回新的数组
  // 如果数组经过排序，即isSorted 为真，就用更快的算法进行
  _.uniq = function(array, isSorted) {
    return _.reduce(array, [], function(memo, el, i) {
      if (0 == i || (isSorted ? _.last(memo) != el : !_.include(memo, el))) memo.push(el);
      return memo;
    });
  };

  // 返回多个数组的交集
  _.intersect = function(array) {
    // 返回除 array 外的 arguments
    var rest = _.rest(arguments);
    return _.select(_.uniq(array), function(item) {
      return _.all(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = _.toArray(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i=0; i<length; i++) results[i] = _.pluck(args, String(i));
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, MSIE),
  // we need this function. Return the position of the first occurence of an
  // item in an array, or -1 if the item is not included in the array.
  _.indexOf = function(array, item) {
    if (array.indexOf) return array.indexOf(item);
    for (var i=0, l=array.length; i<l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Provide JavaScript 1.6's lastIndexOf, delegating to the native function,
  // if possible.
  _.lastIndexOf = function(array, item) {
    if (array.lastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python range() function. See:
  // http://docs.python.org/library/functions.html#range
  _.range = function(start, stop, step) {
    var a     = _.toArray(arguments);
    var solo  = a.length <= 1;
    var start = solo ? 0 : a[0], stop = solo ? a[0] : a[1], step = a[2] || 1;
    var len   = Math.ceil((stop - start) / step);
    if (len <= 0) return [];
    var range = new Array(len);
    for (var i = start, idx = 0; true; i += step) {
      if ((step > 0 ? i - stop : stop - i) >= 0) return range;
      range[idx++] = i;
    }
  };

  /* ----------------------- Function Functions: -----------------------------*/

  // Create a function bound to a given object (assigning 'this', and arguments,
  // optionally). Binding with arguments is also known as 'curry'.
  _.bind = function(func, obj) {
    var args = _.rest(arguments, 2);
    return function() {
      return func.apply(obj || root, args.concat(_.toArray(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = _.rest(arguments);
    if (funcs.length == 0) funcs = _.functions(obj);
    _.each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = _.rest(arguments, 2);
    return setTimeout(function(){ return func.apply(func, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(_.rest(arguments)));
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(_.toArray(arguments));
      return wrapper.apply(wrapper, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = _.toArray(arguments);
    return function() {
      var args = _.toArray(arguments);
      for (var i=funcs.length-1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  /* ------------------------- Object Functions: ---------------------------- */

  // 获取对象的属性名
  _.keys = function(obj) {
    if(_.isArray(obj)) return _.range(0, obj.length);
    var keys = [];
    for (var key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Extend a given object with all of the properties in a source object.
  _.extend = function(destination, source) {
    for (var property in source) destination[property] = source[property];
    return destination;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (_.isArray(obj)) return obj.slice(0);
    return _.extend({}, obj);
  };

  // 深度比较两个对象是否相等
  _.isEqual = function(a, b) {
    // === 类型和值都相等
    if (a === b) return true;
    // 比较不同类型的值
    var atype = typeof(a), btype = typeof(b);
    if (atype != btype) return false;
    // 基本相等，注意有强制转换
    if (a == b) return true;
    // 其中一个实现了 isEqual 方法
    if (a.isEqual) return a.isEqual(b);
    // 比较日期，转化成整形后再比较
    if (_.isDate(a) && _.isDate(b)) return a.getTime() === b.getTime();
    // 都是 NaN，其实 NaN !== NaN;
    if (_.isNaN(a) && _.isNaN(b)) return true;
    // 比较两个正则表达式
    if (_.isRegExp(a) && _.isRegExp(b))
      return a.source     === b.source &&
             a.global     === b.global &&
             a.ignoreCase === b.ignoreCase &&
             a.multiline  === b.multiline;

    // 到这里，如果检查到 a 不是对象，我们就不能进行下面的操作，直接返回false
    if (atype !== 'object') return false;

    // 比较数组
    // 在比较内容前，先检查数组长度
    if (a.length && (a.length !== b.length)) return false;
    // Nothing else worked, deep compare the contents.
    var aKeys = _.keys(a), bKeys = _.keys(b);
    // Different object sizes?
    if (aKeys.length != bKeys.length) return false;
    // Recursive comparison of contents.
    for (var key in a) if (!_.isEqual(a[key], b[key])) return false;
    return true;
  };

  // 数组或对象是是否为空
  _.isEmpty = function(obj) {
    return _.keys(obj).length == 0;
  };

  // 是否为 DOM 元素
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // 判断给定的值是否是 NaN
  // 注意 NaN !== NaN，isNaN(undefined) == true;
  // 所以在使用 isNaN() 之前，要确定给定的值是否为数字
  _.isNaN = function(obj) {
    return _.isNumber(obj) && isNaN(obj);
  };

  // 是否为空 null
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return typeof obj == 'undefined';
  };

  // Define the isArray, isDate, isFunction, isNumber, isRegExp, and
  // isString functions based on their toString identifiers.
  _.each(['Array', 'Date', 'Function', 'Number', 'RegExp', 'String'], function(type) {
    _['is' + type] = function(obj) {
      return Object.prototype.toString.call(obj) == '[object ' + type + ']';
    };
  });

  /* -------------------------- 工具函数 -------------------------- */

  // Run Underscore.js in noConflict mode, returning the '_' variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // 指定一个默认的迭代器函数
  _.identity = function(value) {
    return value;
  };

  // 跳出迭代循环
  _.breakLoop = function() {
    throw breaker;
  };

  // Generate a unique integer id (unique within the entire client session).
  // 对临时的 DOM id 很有用
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // 返回对象里的所有经过排序后的方法名
  _.functions = function(obj) {
    return _.select(_.keys(obj), function(key){ return _.isFunction(obj[key]); }).sort();
  };

  // JavaScript templating a-la ERB, pilfered from John Resig's
  // "Secrets of the JavaScript Ninja", page 83.
  _.template = function(str, data) {
    var fn = new Function('obj',
      'var p=[],print=function(){p.push.apply(p,arguments);};' +
      'with(obj){p.push(\'' +
      str
        .replace(/[\r\t\n]/g, " ")
        .split("<%").join("\t")
        .replace(/((^|%>)[^\t]*)'/g, "$1\r")
        .replace(/\t=(.*?)%>/g, "',$1,'")
        .split("\t").join("');")
        .split("%>").join("p.push('")
        .split("\r").join("\\'")
    + "');}return p.join('');");
    return data ? fn(data) : fn;
  };

  /*------------------------------- Aliases ----------------------------------*/

  _.forEach  = _.each;
  _.foldl    = _.inject       = _.reduce;
  _.foldr    = _.reduceRight;
  _.filter   = _.select;
  _.every    = _.all;
  _.some     = _.any;
  _.head     = _.first;
  _.tail     = _.rest;
  _.methods  = _.functions;

  /*------------------------ Setup the OOP Wrapper: --------------------------*/

  // 辅助函数，使得 underscore 可以对结果进行链式调用
  var result = function(obj, chain) {
    // _(obj) 实例化一个 wapper 对象，这个实例对象的 this._wrapper = obj;
    //  _(obj).chain() 返回 this ；this 指向 _(obj) 实例化的 wapper 对象
    return chain ? _(obj).chain() : obj;
  };


  // 将 Underscore 的所有函数添加到 warpper 对象上。
  // _.functions(_) 取得 _ 对象上的所有函数名，返回一个数组，遍历这个数组
  _.each(_.functions(_), function(name) {
    // 给 wrapper 的原型上添加方法
    wrapper.prototype[name] = function() {
      // 将 this._wrapped 对象放在 arguments 数组的首位
      Array.prototype.unshift.call(arguments, this._wrapped);
      return result(_[name].apply(_, arguments), this._chain);
    };
  });

  // 将所有数组原生方法添加到 wrapper 对象上
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    wrapper.prototype[name] = function() {
      Array.prototype[name].apply(this._wrapped, arguments);
      return result(this._wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    wrapper.prototype[name] = function() {
      return result(Array.prototype[name].apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

})();
