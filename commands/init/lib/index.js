"use strict";
const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
const inquirer = require("inquirer");
const semver = require("semver");
const Command = require("@lingfeng-cli-dev/command");
const log = require("@lingfeng-cli-dev/log");
const getProjectTemplate = require("./getProjectTemplate");

const TYPE_PROJECT = "project";
const TYPE_COMPONENT = "component";

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || "";
    this.force = !!this._argv[1].force;
    log.verbose("projectName", this.projectName);
    log.verbose("force", this.force);
  }
  async exec() {
    try {
      // 准备阶段
      const projectInfo = await this.prepare();
      if (projectInfo) {
        this.projectInfo = projectInfo;
        log.verbose("projectInfo", projectInfo);
        // 下载模板
        this.downloadTemplate();
        // 安装模板
      }
    } catch (e) {
      log.error(e.message);
    }
  }
  downloadTemplate() {
    const { projectTemplate } = this.projectInfo;
    const templateInfo = this.template.find(
      (item) => item.url === projectTemplate
    );
    console.log(templateInfo);
  }
  async prepare() {
    // 判断项目模板是否存在
    const template = await getProjectTemplate();
    if (!template || !template.length) {
      throw new Error("项目模板不存在！");
    }
    this.template = template;
    // 判断当前目录是否为空
    const localPath = process.cwd();
    if (!this.isCwdEmpty(localPath)) {
      let isContinue = false;
      if (!this.force) {
        // 询问是否继续创建
        isContinue = (
          await inquirer.prompt({
            type: "confirm",
            name: "isContinue",
            message: "当前文件夹不为空，是否继续创建项目？",
            default: false,
          })
        ).isContinue;
        if (!isContinue) {
          return;
        }
      }
      if (isContinue || this.force) {
        // 二次确认
        const { confirmDel } = await inquirer.prompt({
          type: "confirm",
          name: "confirmDel",
          message: "是否确认清空当前目录下的文件？",
          default: false,
        });
        if (confirmDel) {
          // 清空当前目录
          fse.emptyDirSync(localPath);
        }
      }
    }
    // 获取项目信息
    return await this.getProjectInfo();
  }

  async getProjectInfo() {
    let projectInfo = {};
    // 选择创建项目或组件
    const { type } = await inquirer.prompt({
      type: "list",
      name: "type",
      message: "请选择初始化类型",
      default: TYPE_PROJECT,
      choices: [
        {
          name: "项目",
          value: TYPE_PROJECT,
        },
        {
          name: "组件",
          value: TYPE_COMPONENT,
        },
      ],
    });
    log.verbose("type", type);
    if (type === TYPE_PROJECT) {
      // 获取项目的基本信息
      const project = await inquirer.prompt([
        {
          type: "input",
          name: "projectName",
          message: "请输入项目名称",
          default: "",
          validate: function (v) {
            // 1、首字符只能为英文
            // 2、尾字符只能为英文和数字
            // 3、字符仅允许"-_"
            // 4、字符后面第一位只能为英文
            const done = this.async();
            setTimeout(function () {
              if (
                !/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(
                  v
                )
              ) {
                done("请输入合法的项目名称");
                return;
              }
              done(null, true);
            }, 0);
          },
          filter: function (v) {
            return v;
          },
        },
        {
          type: "input",
          name: "projectVersion",
          message: "请输入项目版本号",
          default: "1.0.0",
          validate: function (v) {
            const done = this.async();
            setTimeout(function () {
              if (!semver.valid(v)) {
                done("请输入合法的版本号");
                return;
              }
              done(null, true);
            }, 0);
          },
          filter: function (v) {
            if (!!semver.valid(v)) {
              return semver.valid(v);
            } else {
              return v;
            }
          },
        },
        {
          type: "list",
          name: "projectTemplate",
          message: "请选择项目模板",
          choices: this.createTemplateChoices(),
        },
      ]);
      projectInfo = { type, ...project };
    } else if (type === TYPE_COMPONENT) {
    }

    return projectInfo;
  }
  createTemplateChoices() {
    return this.template.map((item) => ({
      name: item.name,
      value: item.url,
    }));
  }
  isCwdEmpty(localPath) {
    // 获取当前目录下包含的文件
    let fileList = fs.readdirSync(localPath);
    // console.log(path.resolve("."));

    // 文件过滤
    fileList = fileList.filter(
      (file) => !file.startsWith(".") && ["node_modules"].indexOf(file) < 0
    );
    return !fileList || fileList.length <= 0;
  }
}
function init(argv) {
  return new InitCommand(argv);
}
module.exports = init;
module.exports.InitCommand = InitCommand;
