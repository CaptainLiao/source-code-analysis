
> 我不读书，从不去听课，我就是去阅读别人的代码，并搞清楚那些代码是如何工作的。——TJ Holowaychuk

如何阅读别人的代码呢？前辈们给出了不同的思路：
* 带着问题读源码

    用于使用别人代码遇到问题时
* 抓主线

    用于单纯的去学习代码

以下内容是我在学习 Vue-2.5.2 源码时的一个总结。

## 第一章 活捉`Vue`
前言：

既然是学习`Vue`源码，首先要搞清楚的是——`Vue`是什么东西？不然，天知道你在学什么玩意儿。所以，找到`Vue`对象就是本次学习的一条主线。本次任务的目标就是——活捉`Vue`。

### 第一回 不入虎穴焉得虎子
工欲善其事必先利其器，本次活捉`Vue`，最紧要的是找到它大概在哪里，然后根据线索顺藤摸瓜。

`git clone https://github.com/vuejs/vue.git`，恭喜，`Vue`的老巢已经被你发现，令人激动的是，入口`package.json`也被你找到了。但紧闭的大门阻碍了你的步伐，于是你运用所学姿势，很快找到破解开关的关键`scripts`属性：
````
  "scripts": {
    "dev": "rollup -w -c build/config.js --environment TARGET:web-full-dev",
    ...
    "build": "node build/build.js",
    ...
  }  
````
P.S.`package.json`几乎是所有成熟库/框架必备的入口文件。

你命令终端执行`npm run dev`，看到`rollup`构建工具正在自动执行`build`文件夹下的`config.js`，并在环境中注入参数`TARGET:web-full-dev`，你紧跟线索，找到了`build/config.js`。看着两百多行代码，你微微一笑，心想，这等雕虫小技也敢造次？径直走向`exports`，看它**导出**了什么？

P.S.s 一般而言，导出对象在文件末尾。

// build/config.js
````
...
if (process.env.TARGET) {
  module.exports = genConfig(process.env.TARGET); // (1)
} else {
  exports.getBuild = genConfig
  exports.getAllBuilds = () => Object.keys(builds).map(genConfig)
}
````
脑回路高速飞转——因为执行`npm run dev`会植入环境变量`TARGET:web-full-dev`，上述代码会走（1），所以结合上下文，`build/config.js`实际导出的对象应该是这样的：
````
module.exports = {
  input: resolve('web/entry-runtime-with-compiler.js'),
  plugins: [
    replace({__VERSION__: version}),
    {
      vue: resolve('src/platforms/web/entry-runtime-with-compiler'),
      compiler: resolve('src/compiler'),
      core: resolve('src/core'),
      shared: resolve('src/shared'),
      web: resolve('src/platforms/web'),
      weex: resolve('src/platforms/weex'),
      server: resolve('src/server'),
      entries: resolve('src/entries'),
      sfc: resolve('src/sfc'),
      he: './entity-decoder'
    }
  ],
  output: {
    file: resolve('dist/vue.js'),
    format: 'umd',
    banner: banner,
    name: 'Vue'
  }
}         
````
直到这里，`Vue`的庐山真面目依然没有揭开。“果然是狡兔三窟！”你不屑道，然而你明白，已经越来越近了...此地唯一的入口就是`input`，小小的障眼法对你来讲不足挂齿，轻轻旋转机关，来到了`src/platforms/web/entry-runtime-with-compiler.js`。只一眼，你便看到了`import Vue from './runtime/index'`。"hehe，总算把你逮住了，老东西！"。

你小心翼翼的进入`./runtime/index`，满心欢喜的以为终于抓到了`Vue`。突然，一支利箭飞来`import Vue from 'core/index'`，险险的避过后，一群彪形大汉又蜂拥而至：

./runtime/index.js
````
import Vue from 'core/index'
...
Vue.config.mustUseProp = mustUseProp
...
extend(Vue.options.directives, platformDirectives)
...
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}
...
````
### 第二回 降服`Vue`

面对群魔乱舞，你开始受伤、流血，一波又一波的攻势逐渐让你体力不支，更糟糕的是，你，只是一个人。“就这样结束了么？”你喘着粗气暗问自己，恍惚间，往昔在脑海中一幕幕重现，从一无所知的小白到现在敢于挑战`Vue`，经历了重重历练，你不甘心，不甘心就这样失败。放手一搏吧，骚年！！！体内的能量在积累，终于，你用尽全力使出了终极必杀技：404 Page Not Found。一时间，大汉们应声而倒，就连`./runtime/index`也开始坍塌，电光火石间，一股大力将你震晕击飞，醒来之时，已经到了另一个世界：`src/core/index.js`。

这里就是`Vue`的核心了么？环顾四周，只见一间虚掩着房门的小屋`./instance/index`，推开门，`Vue`端坐在那里：
````
...
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  
  this._init(options)
}
...
````
终于找到了，此刻，你可以轻松的把它杀死，成为万众瞩目的英雄，于是乎你挥起手中利刃，直直的刺向`Vue`。当刃尖离`Vue`只有0.0001公分的时候，你看着眼前的`Vue`，原来，鼎鼎大名的`Vue`只是一个普普通通的构造函数，好像看到了最初的自己，刹那间，你顿住了。

`Vue`却开口到：“骚年，你终于来了！”说罢，万丈金光从`Vue`身上迸发而出，场面一度失控。待金光散去，`Vue`却不见了，只留下一本《Vue 编程~~闺房~~秘术》...









