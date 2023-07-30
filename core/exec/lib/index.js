"use strict";

const path = require("path");
const cp = require("child_process");
const Package = require("@lingfeng-cli-dev/package");
const log = require("@lingfeng-cli-dev/log");
const { exec: spawn } = require("@lingfeng-cli-dev/utils");

const SETTINGS = {
  init: "@lingfeng-cli-dev/core",
};
const CACHE_DIR = "dependencies";

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  let storeDir = "";
  let pkg;

  const cmdObj = arguments[arguments.length - 1];
  const cmdName = cmdObj.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = "latest";

  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR); // 生成缓存目录
    storeDir = path.resolve(targetPath, "node_modules/.store");
    // storeDir = path.resolve(targetPath, "node_modules");

    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    });
    if (await pkg.exists()) {
      // 更新package
      await pkg.update();
    } else {
      // 安装package
      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }
  log.verbose("targetPath", targetPath);
  log.verbose("homePath", homePath);
  log.verbose("storeDir", storeDir);
  const rootFile = pkg.getRootFilePath();
  if (rootFile) {
    try {
      // 在当前进程中调用
      // require(rootFile).call(null, Array.from(arguments));

      // 在node子进程中调用
      const args = Array.from(arguments);
      const cmd = args[args.length - 1];
      const o = Object.create(null);
      Object.keys(cmd).forEach((key) => {
        if (
          cmd.hasOwnProperty(key) &&
          !key.startsWith("_") &&
          key !== "parent"
        ) {
          o[key] = cmd[key];
        }
      });
      args[args.length - 1] = o;
      const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`;
      const child = spawn("node", ["-e", code], {
        cwd: process.cwd(),
        stdio: "inherit",
        // shell: true,
      });
      child.on("error", (e) => {
        log.error(e.message);
        process.exit(1);
      });
      child.on("exit", (e) => {
        if (e === 0) {
          log.verbose("命令执行成功：" + e);
        }
        process.exit(e);
      });
    } catch (error) {
      log.error(error.message);
    }
  }
}

module.exports = exec;
