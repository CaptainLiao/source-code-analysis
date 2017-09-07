
var _ ;
_.each = function(obj, iterator, context) {
	var index = 0;

	try {
		if(obj.forEach) {
			obj.forEach(iterator, context);
		} else if(obj.length) {
			for(var i = 0, l = obj.length; i < l; i++) {
				iterator.call(context, obj[i]);
			}
		} else {
      var keys = _.keys(obj),
        l = keys.length;
      
      for(var i = 0; i < l; i++) {
        iterator.call(context, obj[keys[i]], keys[i], obj);
      }  
		}
	} catch(e) {
    throw(e);
  }
}
