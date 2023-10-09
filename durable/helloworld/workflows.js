const { Durable } = require('@hotmeshio/hotmesh');

const { helloworld } = Durable.workflow.proxyActivities();

module.exports = async function helloworldExample(name) {
  return await helloworld(name);
}
