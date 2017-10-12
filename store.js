class Store {
  constructor (initState = {}) {
    if (typeof initState !== 'object' || initState === null) {
      throw new TypeError('[Store] Init state must be a object.')
    }
    const _state = this._state = deepclone(initState)
    this.state = this._hookState(_state)
  }
   // 禁止直接修改
  _hookState (_state) {
    const state = {}
    Object.keys(_state).forEach(key => {
      if (typeof _state[key] === 'object' && _state[key] !== null) {
        _state[key] = this._hookState(_state[key])
      } else if (typeof _state[key] === 'function') {
        throw new TypeError('[Store] state cannot save function.')
      }
      Object.defineProperty(state, key, {
        enumerable: true,
        configurable: true,
        get () {
          return _state[key]
        },
        set (newVal) {
          throw new TypeError('[Store] mutate state failed. Use .mutate() to mutate state')
        }
      })
    })
    return state
  }
  mutate (fn) {
    const newState = this._state = deepclone(
      fn.apply(null, this._state)
    )
    this.state = this._hookState(newState)
  }
}
module.exports = new Store({})