"use strict";
const semver = require("semver");
const colors = require("colors");
const LOWEST_NODE_VERSION = "12.0.0";

class Command {
  constructor(argv) {
    this._argv = argv;
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => this.checkNodeVersion());
    });
  }
  checkNodeVersion() {
    // 获取当前node版本号
    const currentVersion = process.version;
    // 比对最低版本号
    const lowestVersion = LOWEST_NODE_VERSION;
    if (!semver.gte(currentVersion, lowestVersion)) {
      throw new Error(
        colors.red(`lingfeng-cli 需要安装 v${lowestVersion} 以上版本的 Node.js`)
      );
    }
  }
  init() {
    throw new Error("init 必须实现");
  }
  exec() {
    throw new Error("exec 必须实现");
  }
}
module.exports = Command;
