const { Durable } = require('@hotmeshio/pluck');
const activities = require('./activities');

const { greet, saludar } = Durable.workflow.proxyActivities({
  activities,
  retryPolicy: {
    maximumAttempts: 1_000, //I hope not!
    maximumInterval: '5 seconds',
    backoffCoefficient: 2,
  }
});

async function example(name, lang) {
  //sleep to showcase replay/reentrance
  await Durable.workflow.sleepFor('1 second');

  //execute a proxied activity
  if (lang === 'es') {
    return await saludar(name);
  } else {
    return await greet(name);
  }
}

module.exports = {
  example
};
