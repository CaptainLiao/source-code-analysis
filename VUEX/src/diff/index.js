const type = require('./type.js')
const clone = require('./clone')

const SAME = '__DIFF_SAME__'
const REPLACE = '__DIFF_REPLACE__'

// 生成两个对象的比较结果
function diff(prev, next) {
  if (prev === next) return SAME

  const prevType = type(prev)
  const nextType = type(next)
  if (prevType !== nextType) {
    if (nextType === 'object' || nextType === 'array') next[REPLACE] = true // 标记为整个替换，便于flatten()时生成较优的结果
    return next
  }

  switch (nextType) {
    case 'object': {
      // 假设数据条目用key/id作为唯一标识，来决定更新还是新建

      if (next.id !== prev.id || next.key !== prev.key) { // 如果是新建，就标记为整个替换
        next[REPLACE] = true
      }
      if (next[REPLACE]) return next
      
      // 否则就是更新
      const keys = [...Object.keys(prev), ...Object.keys(next)].filter( 
        // 去掉重复数组
        (key, id, keys) => keys.indexOf(key) === id
      )

      let result = {}
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        let childResult = diff(prev[key], next[key])
        if (childResult !== SAME) {
          result[key] = childResult
        }
      }
      return result
    }
    case 'array': {
      if (prev.length > next.length) {
        next[REPLACE] = true
      }
      if (next[REPLACE]) return next

      let result = {}
      for (let i = 0; i < next.length; i++) {
        let childResult = diff(prev[i], next[i])
        if (childResult !== SAME) {
          result[i] = childResult
        }
      }
      return result
    }

    default:
      return next
  }
}

// 将diff()输出的比较结果扁平化，构建setData()接受的格式
function flatten(obj, prefix = '') {
  return Object.keys(obj).reduce((prev, key) => {
    const newPrefix = (prefix === '' ? key : prefix + '.' + key).replace(
      /\.(\d+)/g,
      (match, p) => `[${p}]` // 把 .0 换成 [0] ，小程序只认这个
    )
    const elem = obj[key]
    const elemType = type(elem)
    switch (elemType) {
      case 'object':
      case 'array': {
        if (elem[REPLACE]) {
          delete elem[REPLACE]
          Object.assign(prev, { [newPrefix]: elem })
        } else {
          Object.assign(prev, flatten(elem, newPrefix))
        }
        break
      }
      default:
        Object.assign(prev, { [newPrefix]: elem })
        break
    }
    return prev
  }, {})
}

function getUpdate(prev, next) {
  const d = diff(clone(prev), clone(next))
  const update = d === SAME ? {} : flatten(d)
  return update
}



//------- test -----------
const A = {
  b: 4,
  c: {
    d: 4,
    e: 5,
    f: [1, { y: 4 }, 3, { x: 3 }],
    g: [1, 2, 3, { x: 4 }]
  }
}

const B = {
  a: 3,
  c: {
    d: 3,
    e: 5,
    f: [1, { y: 4, z: 5 }, 3, { x: 4 }],
    g: [1, 2, 3]
  }
}
const d = diff(A, B)

console.log(d)
console.log(flatten(d))

module.exports = {
  getUpdate,
}
