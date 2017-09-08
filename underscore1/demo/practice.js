  // 对集合中的每一项注册方法，arguments作为方法参数
  _.invoke = function(obj, method) {
    var args = _.rest(arguments, 2);
    return _.map(obj, function(value) {
      return (method ? value[method] : value).apply(value, args);
    });
	};
	

	  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator = iterator || _.identity;
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };


  _.uniq = function(array, isSorted) {
    return _.reduce(array, [], function(memo, el, i) {
      var m = (isSorted ? _.last(memo) != el : !_.include(memo, el));
      if (0 == i || m ) {
        memo.push(el);
      }
      return memo;
    });
  };