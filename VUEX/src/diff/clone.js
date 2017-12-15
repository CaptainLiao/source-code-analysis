const type = require('./type')

module.exports = o => {
  const t = type(o)
  if(t === 'object') {
    let cloned = {};
    for(var key in o) {
      cloned[key] = cloned(o[key])
    }
    return cloned
  }
  if( t === 'array' ) return o.map(cloned)

  return o;

}