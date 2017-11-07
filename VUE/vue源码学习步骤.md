
> 我不读书，从不去听课，我就是去阅读别人的代码，并搞清楚那些代码是如何工作的。——TJ Holowaychuk

如何阅读别人的代码呢？前辈们给出了不同的思路：
* 带着问题读源码
    用于使用别人代码遇到问题时
* 抓主线
    用于单纯的去学习代码

以下内容是我在学习 Vue-2.5.2 源码时的一个总结。

## 第一章 活捉`Vue`
既然是学习`Vue`源码，首先要搞清楚的是——`Vue`是什么东西？不然，天知道你在学什么玩意儿。所以，找到`Vue`对象就是本次学习的一条主线。本次任务的目标就是——活捉`Vue`。

### 第一回 不入虎穴焉得虎子
工欲善其事必先利其器，本次活捉`Vue`，最紧要的是找到它大概在哪里，然后根据线索顺藤摸瓜。

`git clone https://github.com/vuejs/vue.git`，恭喜，`Vue`的老巢已经被你发现，令人激动的是，入口`package.json`也被你找到了。但紧闭的大门阻碍了你进攻的节奏，于是你运用所学姿势，很快找到破解大门的关键属性`scripts`：
````
  "scripts": {
    "dev": "rollup -w -c build/config.js --environment TARGET:web-full-dev",
    ...
    "build": "node build/build.js",
    ...
  }  
````
P.S.`package.json`几乎是所有成熟库/框架必备的入口文件。

你命令终端执行`npm run dev`，看到`rollup`构建工具会自动执行`build`文件夹下的`config.js`，并在环境中注入参数`TARGET:web-full-dev`，你紧跟线索，找到了`build/config.js`。看着两百多行代码，你微微一笑，心想，这等雕虫小技也敢造次？径直走向`exports`，看它**导出**了些什么？
P.S 一般而言，导出对象在文件末尾。

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
脑回路高速飞转——因为执行`npm run dev`会植入环境变量`TARGET:web-full-dev`，上述代码会走（1），所以实际导出的对象应该是这样的：
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
直到这里，`Vue`的庐山真面目依然没有揭开。“果然是狡兔三窟！”你轻哼道，但是你明白，已经越来越近了...此地唯一的入口就是`input`，小小的障眼法对你来讲不足挂齿，轻轻旋转机关，门开了——`src/platforms/web/entry-runtime-with-compiler.js`。只一眼，你就看到了`import Vue from './runtime/index'`。"hehe，总算把你逮住了，小东西！"。

### 第二回 智斗`Vue`及众门徒









