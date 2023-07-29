"use strict";

const cliSpinners = require("cli-spinners");
const ora = require("ora");

function isObject(o) {
  return Object.prototype.toString.call(o) === "[object Object]";
}

function spinnerStart(msg) {
  const spinner = ora({
    prefixText: msg,
    spinner: cliSpinners.clock,
  });
  spinner.start();
  return spinner;
}
module.exports = {
  isObject,
  spinnerStart,
};
