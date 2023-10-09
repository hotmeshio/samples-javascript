const {Durable} = require('@hotmeshio/hotmesh');
const activities = require('./activities');

const { helloworld } = Durable.workflow.proxyActivities();

module.exports = async function helloworldExample(name) {
  return await helloworld(name);
}
