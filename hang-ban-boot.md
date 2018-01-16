
node app/bin/www

app.js
------>
var boot = require('express-app-boot')(__dirname);  // (1)
var app = express();  // (2)
var bootApp = boot(app, 'boot');  // (3)

经过上面三个步骤，代码会去访问`__dirname`下的`boot.xx.yml`配置文件，以配置文件预设的`params`作为参数，执行其`path`路径下的`js`文件。

**eg：**
一个典型的 boot.yml 配置文件如下：
````
- path: load-module
  name: add load module route
  params:
    debug: true
    routePath: /m
    loaderPath: /m-loader.js
    pathSettings:
      base: ../public/scripts

````

假设`load-module/index.js`有如下代码：
````
var moduleServ = require('express-module-serv');

moduleServ(app, params);
````
当依次执行(1)(2)(3)后，代码会执行`moduleServ(app, params)`，其中，`params`来自`boot.yml`中的`params`参数

`moduleServ`又干了些什么呢？

### express-module-serv
> express 应用模块加载器，支持 AMD,CMD 和 UMD 标准的前端模块。[express-module-serv](https://www.npmjs.com/package/express-module-serv)

执行完毕，会给`app`增加两个中间件：
````
app.use(loaderPath, scriptsMiddleware(loaderPath, routePath, options));
app.use(routePath, depsStreamMiddleware(streamMaker, resolverFns, options));
````


bootApp.beforeStart((app) => {
  // TODO
})




