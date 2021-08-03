'use strict';
// 文件返回一系列东西的绝对路径
/*
{
  dotenv: '/Users/liu/mydir/analysis-of-react-source-code/.env',
  appPath: '/Users/liu/mydir/analysis-of-react-source-code',
  appBuild: '/Users/liu/mydir/analysis-of-react-source-code/build',
  appPublic: '/Users/liu/mydir/analysis-of-react-source-code/public',
  appHtml: '/Users/liu/mydir/analysis-of-react-source-code/public/index.html',
  appIndexJs: '/Users/liu/mydir/analysis-of-react-source-code/src/index.js',
  appPackageJson: '/Users/liu/mydir/analysis-of-react-source-code/package.json',
  appSrc: '/Users/liu/mydir/analysis-of-react-source-code/src',
  appTsConfig: '/Users/liu/mydir/analysis-of-react-source-code/tsconfig.json',
  appJsConfig: '/Users/liu/mydir/analysis-of-react-source-code/jsconfig.json',
  yarnLockFile: '/Users/liu/mydir/analysis-of-react-source-code/yarn.lock',
  testsSetup: '/Users/liu/mydir/analysis-of-react-source-code/src/setupTests.js',
  proxySetup: '/Users/liu/mydir/analysis-of-react-source-code/src/setupProxy.js',
  appNodeModules: '/Users/liu/mydir/analysis-of-react-source-code/node_modules',
  publicUrlOrPath: '/'
}
*/
const path = require('path');
const fs = require('fs');
const getPublicUrlOrPath = require('react-dev-utils/getPublicUrlOrPath');

// Make sure any symlinks in the project folder are resolved:
// https://github.com/facebook/create-react-app/issues/637
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

// We use `PUBLIC_URL` environment variable or "homepage" field to infer
// "public path" at which the app is served.
// webpack needs to know it to put the right <script> hrefs into HTML even in
// single-page apps that may serve index.html for nested URLs like /todos/42.
// We can't use a relative path in HTML because we don't want to load something
// like /todos/42/static/js/bundle.7289d.js. We have to know the root.
const publicUrlOrPath = getPublicUrlOrPath(
  process.env.NODE_ENV === 'development',
  require(resolveApp('package.json')).homepage,
  process.env.PUBLIC_URL
);


const moduleFileExtensions = [
  'web.mjs',
  'mjs',
  'web.js',
  'js',
  'web.ts',
  'ts',
  'web.tsx',
  'tsx',
  'json',
  'web.jsx',
  'jsx',
];

// Resolve file paths in the same order as webpack
const resolveModule = (resolveFn, filePath) => {
  const extension = moduleFileExtensions.find(extension =>
    fs.existsSync(resolveFn(`${filePath}.${extension}`))
  );

  if (extension) {
    return resolveFn(`${filePath}.${extension}`);
  }

  return resolveFn(`${filePath}.js`);
};

// config after eject: we're in ./config/
module.exports = {
  dotenv: resolveApp('.env'),
  appPath: resolveApp('.'),
  appBuild: resolveApp('build'),
  appPublic: resolveApp('public'),
  appHtml: resolveApp('public/index.html'),
  appIndexJs: resolveModule(resolveApp, 'src/index'),
  appPackageJson: resolveApp('package.json'),
  appSrc: resolveApp('src'),
  appTsConfig: resolveApp('tsconfig.json'),
  appJsConfig: resolveApp('jsconfig.json'),
  yarnLockFile: resolveApp('yarn.lock'),
  testsSetup: resolveModule(resolveApp, 'src/setupTests'),
  proxySetup: resolveApp('src/setupProxy.js'),
  appNodeModules: resolveApp('node_modules'),
  publicUrlOrPath,
};



module.exports.moduleFileExtensions = moduleFileExtensions;
