import native from './native';

let RequestMQ = {
    map: {},
    mq: [],
    running: [],
    MAX_REQUEST: 5,
    push (param) {
        param.t = +new Date();
        while ((this.mq.indexOf(param.t) > -1 || this.running.indexOf(param.t) > -1)) {
            param.t += Math.random() * 10 >> 0;
        }
        this.mq.push(param.t);
        this.map[param.t] = param;
    },
    next () {
        let me = this;

        if (this.mq.length === 0)
            return;

        if (this.running.length < this.MAX_REQUEST - 1) {
            let newone = this.mq.shift();
                let obj = this.map[newone];
                let oldComplete = obj.complete;
                obj.complete = (...args) => {
                    me.running.splice(me.running.indexOf(obj.t), 1);
                    delete me.map[obj.t];
                    oldComplete && oldComplete.apply(obj, args);
                    me.next();
                }
                this.running.push(obj.t);
                return wx.request(obj);
        }
    },
    request (obj) {
        let me = this;

        obj = obj || {};
        obj = (typeof(obj) === 'string') ? {url: obj} : obj;


        this.push(obj);

        return this.next();
    }
};


export default class {
    // 中间件列表
    $addons = {};

    // 拦截器列表
    $interceptors = {};

    // 所有页面列表
    $pages = {};



    $init (wepy, config = {}) {
        this.$initAPI(wepy, config.promisifyAPI);
        this.$wxapp = getApp();
    }


    use (addon, ...args) {
        if (typeof(addon) === 'string' && this[addon]) {
            this.$addons[addon] = 1;
            this[addon](args);
        } else {
            this.$addons[addon.name] = new addon(args);
        }
    }

    intercept (api, provider) {
        this.$interceptors[api] = provider;
    }

    promisify () {
    }

    requestfix () {
    }

    $initAPI (wepy, promisifyAPI) {
        var self = this;
        // 定义非promise方法的对象集合
        let noPromiseMethods = {
            stopRecord: true,
            pauseVoice: true,
            stopVoice: true,
            pauseBackgroundAudio: true,
            stopBackgroundAudio: true,
            showNavigationBarLoading: true,
            hideNavigationBarLoading: true,
            createAnimation: true,
            createContext: true,
            createCanvasContext: true,
            hideKeyboard: true,
            stopPullDownRefresh: true
        };
        if (promisifyAPI) {
            for (let k in promisifyAPI) {
                noPromiseMethods[k] = promisifyAPI[k];
            }
        }
        // 遍历wx对象中的所有key，拷贝给形参 wepy
        // 若 key 是同步的，或是noPromiseMethods对象的属性，或带有'on'前缀，通过定义native对象为中间值，再赋值给形参 wepy，结束！！
        // 否则将方法的形参obj经过拦截器转化，执行下面两个分支
        // 1' 若 obj 是字符串，返回 wx[key](obj)
        // 2' 否则，执行拦截器中 key 属性的success、faile、complete 方法，再执行 wx[key](obj)
        // 最后将 wepy[key] = native[key] 结束！！
        Object.keys(wx).forEach((key) => {

            if (!noPromiseMethods[key] && key.substr(0, 2) !== 'on' && !(/\w+Sync$/.test(key))) {
                // 满足三个条件：非promise方法、方法前没有'on'修饰、方法是异步的
                // 思考1：这里为什么用Object.defineProperty来设置getter() ?
                Object.defineProperty(native, key, {
                    get () {
                        // getter 返回一个匿名函数，参数为 obj
                        return (obj) => {
                            obj = obj || {};
                            // 如果拦截器列表中有这个key并且有config方法
                            // 用 obj 为参数执行config方法，将执行结果赋值给 rst
                            if (self.$interceptors[key] && self.$interceptors[key].config) {
                                let rst = self.$interceptors[key].config.call(self, obj);
                                // 若结果为false，return 错误信息
                                if (rst === false) {
                                    if (self.$addons.promisify) {
                                        return Promise.reject('aborted by interceptor');
                                    } else {
                                        obj.fail && obj.fail('aborted by interceptor');
                                        return;
                                    }
                                }
                                // 否则，将结果赋值给形参 obj 
                                obj = rst;
                            }
                            // 遇到 request 方法，调整形参 obj
                            if (key === 'request') {
                                obj = (typeof(obj) === 'string') ? {url: obj} : obj;
                            }

                            // 到这里开始执行函数方法
                            // 若形参 obj 为字符串，直接执行wx[key](obj)，并返回结果
                            if (typeof obj === 'string') {
                                return wx[key](obj);
                            }

                            // 若 obj 不是字符串，且中间件有 promisify 属性
                            // 则返回一个 pormise 对象
                            if (self.$addons.promisify) {
                                return new Promise((resolve, reject) => {
                                    let bak = {};
                                    ['fail', 'success', 'complete'].forEach((k) => {
                                        bak[k] = obj[k];
                                        obj[k] = (res) => {
                                            // 第一步：执行拦截器中的方法
                                            if (self.$interceptors[key] && self.$interceptors[key][k]) {
                                                res = self.$interceptors[key][k].call(self, res);
                                            }
                                            // 第二步：resolve或者reject 执行结果
                                            if (k === 'success')
                                                resolve(res)
                                            else if (k === 'fail')
                                                reject(res);
                                        };
                                    });
                                    if (self.$addons.requestfix && key === 'request') {
                                        RequestMQ.request(obj);
                                    } else
                                        wx[key](obj);
                                });
                            } else {
                                let bak = {};
                                ['fail', 'success', 'complete'].forEach((k) => {
                                    bak[k] = obj[k];
                                    obj[k] = (res) => {
                                        if (self.$interceptors[key] && self.$interceptors[key][k]) {
                                            res = self.$interceptors[key][k].call(self, res);
                                        }
                                        bak[k] && bak[k].call(self, res);
                                    };
                                });
                                if (self.$addons.requestfix && key === 'request') {
                                    RequestMQ.request(obj);
                                } else
                                    wx[key](obj);
                            }
                        };
                    }
                });
                wepy[key] = native[key];
            } else {
                Object.defineProperty(native, key, {
                    get () { return (...args) => wx[key].apply(wx, args) }
                });
                wepy[key] = native[key];
            }
        });

    }
}
/**
 * 答思考1：为什么用Object.defineProperty()来设置对象的属性？
 * 
 * 此方法在原有的对象上新增/修改一个属性.
 * 语法为：Object.defineProperty(obj, prop, descriptor)
 * 返回值：返回传递给函数的对象obj
 * 
 * 属性描述符（descriptor）有两种主要形式：数据描述符和存取描述符。
 * 描述符必须是两种形式之一，不能同时是两者。当使用了getter或setter方法，不允许使用writable和value这两个属性
 * # 数据描述符：是一个拥有可写或不可写值的属性。
 * value: 设置属性的值。 默认 undefined
 * writable: 值是否可以重写。默认 false
 * # 存取描述符：是由一对 getter-setter 函数功能来描述的属性。
 * get() 获得属性值的方法
 * set() 设置属性值的方法
 * # 描述符共有：
 * enumerable: 目标属性是否可以被枚举。默认 false
 * configurable: 目标属性是否可以被删除或是否可以再次修改特性。 默认 false
 * 
 * 有了以上前提知识，则明白这里是为了设置对象属性的 enumberable和comfingurable，使其不能被枚举和修改，起保护数据的作用。
 */
