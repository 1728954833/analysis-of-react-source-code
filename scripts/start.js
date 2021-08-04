

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

// Ensure environment variables are read.
require('../config/env');


const fs = require('fs');
const chalk = require('react-dev-utils/chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
// 清理输出控制台
const clearConsole = require('react-dev-utils/clearConsole');
// 确保所有传递的文件都存在。
// 文件名应该是绝对的。
// 如果未找到文件，则打印警告消息并返回 false。
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const {
  choosePort,
  createCompiler,
  // 从 package.json 中的代理设置创建一个 WebpackDevServer 代理配置对象。
  prepareProxy,
  prepareUrls,
} = require('react-dev-utils/WebpackDevServerUtils');
const openBrowser = require('react-dev-utils/openBrowser');
const paths = require('../config/paths');
const configFactory = require('../config/webpack.config');
const createDevServerConfig = require('../config/webpackDevServer.config');

const useYarn = fs.existsSync(paths.yarnLockFile);
// 是否在终端执行
const isInteractive = process.stdout.isTTY;

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

// 像 Cloud9 这样的工具依赖于此。
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

if (process.env.HOST) {
  console.log(
    chalk.cyan(
      `尝试绑定到 HOST 环境变量: ${chalk.yellow(
        chalk.bold(process.env.HOST)
      )}`
    )
  );
  console.log(
    `如果这是无意的，请检查您是否在 shell 中错误地设置了它。`
  );
  console.log(
    `Learn more here: ${chalk.yellow('https://bit.ly/CRA-advanced-config')}`
  );
  console.log();
}

// 我们要求您明确设置浏览器并且不要回退到浏览器列表默认值
const { checkBrowsers } = require('react-dev-utils/browsersHelper');
checkBrowsers(paths.appPath, isInteractive)
  .then(() => {
    // We attempt to use the default port but if it is busy, we offer the user to
    // run on a different port. `choosePort()` Promise resolves to the next free port.
    return choosePort(HOST, DEFAULT_PORT);
  })
  .then(port => {
    if (port == null) {
      // We have not found a port.
      return;
    }

    // 获取所有的webpack配置
    const config = configFactory('development');
    const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
    const appName = require(paths.appPackageJson).name;
    const useTypeScript = fs.existsSync(paths.appTsConfig);
    const tscCompileOnError = process.env.TSC_COMPILE_ON_ERROR === 'true';
    // 组合url
    const urls = prepareUrls(
      protocol,
      HOST,
      port,
      paths.publicUrlOrPath.slice(0, -1)
    );
    const devSocket = {
      warnings: warnings =>
        devServer.sockWrite(devServer.sockets, 'warnings', warnings),
      errors: errors =>
        devServer.sockWrite(devServer.sockets, 'errors', errors),
    };
    // 使用内置的帮助消息为 WebpackDevServer 创建一个 Webpack 编译器实例。 
    // 将 require('webpack') 入口点作为第一个参数。 要提供 urls 参数，请使用下面描述的 prepareUrls()。
    //   export interface CreateCompilerOptions {
    //     /**
    //      * 将打印到终端的名称。
    //      */
    //     appName: string;
    //     /**
    //      * 要提供给 webpack 构造函数的 webpack 配置选项。 
    //      */
    //     config: webpack.Configuration;
    //     /**
    //      * 要提供 `urls` 参数，请使用下面描述的 `prepareUrls()`。
    //      */
    //     urls: Urls;
    //     /**
    //      * 是否用yarn
    //      */
    //     useYarn?: boolean | undefined;
    //     /**
    //      * 采用 `require('webpack')` 入口点。 
    //      */
    //     webpack: typeof webpack;
    // }
    const compiler = createCompiler({
      appName,
      config,
      devSocket,
      urls,
      useYarn,
      useTypeScript,
      tscCompileOnError,
      webpack,
    });
    //  获取package.json的proxy配置传入WebpackDevServer
    const proxySetting = require(paths.appPackageJson).proxy;
    const proxyConfig = prepareProxy(
      proxySetting,
      // => /Users/liu/mydir/analysis-of-react-source-code/public 
      paths.appPublic,

      // => /
      paths.publicUrlOrPath
    );

    // 通过 Web 服务器提供由编译器生成的 Webpack 资产。 
    const serverConfig = createDevServerConfig(
      // 若没有配置则为undefined
      proxyConfig,
      // 192.168.50.3 本机ip 将会在启动后显示在终端
      urls.lanUrlForConfig
    );

    const devServer = new WebpackDevServer(compiler, serverConfig);
    // 启动服务器
    devServer.listen(port, HOST, err => {
      if (err) {
        return console.log(err);
      }
      // 如果在终端执行则清楚之前的打印
      if (isInteractive) {
        clearConsole();
      }

      //我们曾经支持根据`NODE_PATH`解析模块。
      //现在已经弃用了 jsconfig/tsconfig.json
      //这允许您在大型 monorepos 内的导入中使用绝对路径：
      if (process.env.NODE_PATH) {
        console.log(
          chalk.yellow(
            'Setting NODE_PATH to resolve modules absolutely has been deprecated in favor of setting baseUrl in jsconfig.json (or tsconfig.json if you are using TypeScript) and will be removed in a future major release of create-react-app.'
          )
        );
        console.log();
      }

      console.log(chalk.cyan('Starting the development server...\n'));
      
      // 打开本地浏览器根据启动地址
      openBrowser(urls.localUrlForBrowser);
    });

    // SIGINT为input 流接收到 Ctrl+C 输入
    // 总之就是接受到退出信号后退出
    ['SIGINT', 'SIGTERM'].forEach(function (sig) {
      process.on(sig, function () {
        devServer.close();
        process.exit();
      });
    });

    if (isInteractive || process.env.CI !== 'true') {
      // Gracefully exit when stdin ends
      // stdin是进程的输入流
      // 这里可以理解为监听输入流事件
      process.stdin.on('end', function () {
        devServer.close();
        process.exit();
      });
      process.stdin.resume();
    }
  })
  .catch(err => {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });
