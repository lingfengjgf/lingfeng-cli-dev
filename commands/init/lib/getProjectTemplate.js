const request = require("@lingfeng-cli-dev/request");

module.exports = function () {
  return request({
    url: "/project/template",
  });
};
