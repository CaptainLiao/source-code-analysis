const type = things => {
  if(things === null) return 'null'
  if(Array.isArray(things)) return 'array'
  return typeof things
}

module.exports = type;