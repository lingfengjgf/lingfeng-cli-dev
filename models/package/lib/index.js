"use strict";
const path = require("path");
const pkgDir = require("pkg-dir").sync;
const pathExists = require("path-exists").sync;
const fse = require("fs-extra");
const npminstall = require("npminstall");
const { isObject } = require("@lingfeng-cli-dev/utils");
const formatPath = require("@lingfeng-cli-dev/format-path");
const {
  getDefaultRegistry,
  getNpmLatestVersion,
} = require("@lingfeng-cli-dev/get-npm-info");

class Package {
  constructor(options) {
    if (!options) {
      throw new Error("Package类的options参数不能为空！");
    }
    if (!isObject(options)) {
      throw new Error("Package类的options参数必须为对象！");
    }
    // package目标路径
    this.targetPath = options.targetPath;
    // package缓存路径
    this.storeDir = options.storeDir;
    // package的name
    this.packageName = options.packageName;
    // package的version
    this.packageVersion = options.packageVersion;
    // package的缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace("/", "+");
    // this.cacheFilePathPrefix = this.packageName.replace("/", "_");
  }

  async prepare() {
    if (this.storeDir && !pathExists(this.storeDir)) {
      fse.mkdirpSync(this.storeDir);
    }
    if (this.packageVersion === "latest") {
      this.packageVersion = await getNpmLatestVersion(this.packageName);
    }
  }
  get cacheFilePath() {
    return path.resolve(
      this.storeDir,
      `${this.cacheFilePathPrefix}@${this.packageVersion}`
      // `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`
    );
  }
  getSpecificCacheFilePath(packageVersion) {
    return path.resolve(
      this.storeDir,
      `${this.cacheFilePathPrefix}@${packageVersion}`
      // `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`
    );
  }
  // 判断package是否存在
  async exists() {
    if (this.storeDir) {
      await this.prepare();
      return pathExists(this.cacheFilePath);
    } else {
      return pathExists(this.targetPath);
    }
  }

  // 安装package
  async install() {
    await this.prepare();
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(),
      pkgs: [{ name: this.packageName, version: this.packageVersion }],
    });
  }

  // 更新package  缓存目录有问题
  async update() {
    await this.prepare();
    // 获取最新的npm模块版本号
    const latestPackageVersion = await getNpmLatestVersion(this.packageName);
    // 查询最新的版本号对应的路径是否存在
    const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion);
    // 如果不存在则直接安装最新版本
    if (!pathExists(latestFilePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(),
        pkgs: [{ name: this.packageName, version: latestPackageVersion }],
      });
      this.packageVersion = latestPackageVersion;
    } else {
      this.packageVersion = latestPackageVersion;
    }
  }

  // 获取入口文件路径
  getRootFilePath() {
    function _getRootFile(targetPath) {
      // 获取package.json所在目录
      const dir = pkgDir(targetPath);
      if (dir) {
        const pkgFile = require(path.resolve(dir, "package.json"));
        if (pkgFile && pkgFile.main) {
          // 兼容Windows/macOS
          return formatPath(path.resolve(dir, pkgFile.main));
        }
      }
      return null;
    }
    if (this.storeDir) {
      return _getRootFile(this.cacheFilePath);
    } else {
      return _getRootFile(this.targetPath);
    }
  }
}

module.exports = Package;
