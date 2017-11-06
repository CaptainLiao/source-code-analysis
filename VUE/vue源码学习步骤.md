
> 我不读书，从不去听课，我就是去阅读别人的代码，并搞清楚那些代码是如何工作的。——TJ Holowaychuk

如何阅读别人的代码呢？前辈们给出了两种方法：
* 带着问题读源码
    用于当你使用别人代码时遇到问题后的解决办法。
* 抓主线
    用于只是单纯的想要学习别人的代码

以下方法是我在阅读 Vue-2.5.2 源码时的一个总结。

### 第一步：下载源码，找入口

`git clone https://github.com/vuejs/vue.git`，clone完成后我们找到并打开 `package.json` 文件，找到`scripts`，如下：
````
  "scripts": {
    "dev": "rollup -w -c build/config.js --environment TARGET:web-full-dev",
    .
    .
    "build": "node build/build.js",
    .
    .
  }  
````
P.S.记住，这个文件几乎是所有成熟库/框架都必备的入口文件。

我们的重点放在 `dev` 属性下，如果你在终端下执行`npm run dev`，`rollup`构建工具会自动执行`build`文件夹下的`config.js`，并在环境中注入参数`TARGET:web-full-dev`。让我们跟随脚本找到`build/config.js`。



