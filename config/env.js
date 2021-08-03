

const fs = require("fs")
const path = require("path")
const paths = require("./paths")

// Make sure that including paths.js after env.js will read .env variables.
delete require.cache[require.resolve("./paths")]

const NODE_ENV = process.env.NODE_ENV
if (!NODE_ENV) {
  throw new Error(
    "The NODE_ENV environment variable is required but was not specified."
  )
}

// https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
const dotenvFiles = [
  `${paths.dotenv}.${NODE_ENV}.local`,
  `${paths.dotenv}.${NODE_ENV}`,
  // Don't include `.env.local` for `test` environment
  // since normally you expect tests to produce the same
  // results for everyone
  NODE_ENV !== "test" && `${paths.dotenv}.local`,
  paths.dotenv
].filter(Boolean)

// Load environment variables from .env* files. Suppress warnings using silent
// if this file is missing. dotenv will never modify any environment variables
// that have already been set.  Variable expansion is supported in .env files.
// https://github.com/motdotla/dotenv
// https://github.com/motdotla/dotenv-expand
dotenvFiles.forEach(dotenvFile => {
  if (fs.existsSync(dotenvFile)) {
    require("dotenv-expand")(
      require("dotenv").config({
        path: dotenvFile
      })
    )
  }
})

// We support resolving modules according to `NODE_PATH`.
// This lets you use absolute paths in imports inside large monorepos:
// https://github.com/facebook/create-react-app/issues/253.
// It works similar to `NODE_PATH` in Node itself:
// https://nodejs.org/api/modules.html#modules_loading_from_the_global_folders
// Note that unlike in Node, only *relative* paths from `NODE_PATH` are honored.
// Otherwise, we risk importing Node.js core modules into an app instead of webpack shims.
// https://github.com/facebook/create-react-app/issues/1023#issuecomment-265344421
// We also resolve them to make sure all tools using them work consistently.
const appDirectory = fs.realpathSync(process.cwd())
process.env.NODE_PATH = (process.env.NODE_PATH || "")
  .split(path.delimiter)
  .filter(folder => folder && !path.isAbsolute(folder))
  .map(folder => path.resolve(appDirectory, folder))
  .join(path.delimiter)

// 获取 NODE_ENV 和 REACT_APP_* 环境变量并将它们准备好
// 通过 webpack 配置中的 DefinePlugin 注入到应用程序中。
const REACT_APP = /^REACT_APP_/i

function getClientEnvironment(publicUrl) {
  const raw = Object.keys(process.env)
    .filter(key => REACT_APP.test(key))
    .reduce(
      (env, key) => {
        env[key] = process.env[key]
        return env
      },
      {
        // 用于确定我们是否在生产模式下运行。
        // 最重要的是，它将 React 切换到正确的模式。
        NODE_ENV: process.env.NODE_ENV || "development",
        // 用于解析`public`中静态资产的正确路径。
        // 例如 <img src={process.env.PUBLIC_URL + '/img/logo.png'} />。
        // 这应该只用作逃生舱口。 通常你会放
        // 图像到 `src` 和 `import` 代码中以获取它们的路径。
        PUBLIC_URL: publicUrl,
        // 我们支持在开发过程中配置 sockjs 路径名。
        // 这些设置让开发人员可以同时运行多个项目。
        // 它们用作连接`hostname`、`pathname` 和`port`
        // 在 webpackHotDevClient. 它们被用作`sockHost`、`sockPath`
        // 和 webpack-dev-server 中的 `sockPort` 选项。
        WDS_SOCKET_HOST: process.env.WDS_SOCKET_HOST,
        WDS_SOCKET_PATH: process.env.WDS_SOCKET_PATH,
        WDS_SOCKET_PORT: process.env.WDS_SOCKET_PORT
      }
    )
  // Stringify all values so we can feed into webpack DefinePlugin
  const stringified = {
    "process.env": Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key])
      return env
    }, {}),
    __DEV__: true,
    SharedArrayBuffer: true,
    spyOnDev: true,
    spyOnDevAndProd: true,
    spyOnProd: true,
    __PROFILE__: true,
    __UMD__: true,
    __EXPERIMENTAL__: true,
    __VARIANT__: true,
    gate: true,
    trustedTypes: true
  }

  return { raw, stringified }
}

module.exports = getClientEnvironment
