const env = process.env.NODE_ENV || 'development';
console.log('CLUSTER MODE ENABLED', process.env.HMSH_IS_CLUSTER === 'true');

const baseConfig = {
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000', //local testing of React Web App

  BILL_WORKER_COUNT: process.env.BILL_WORKER_COUNT ? parseInt(process.env.BILL_WORKER_COUNT, 10) : 2,
  TEST_WORKER_COUNT: process.env.TEST_WORKER_COUNT ? parseInt(process.env.TEST_WORKER_COUNT, 10) : 2,
  MAX_FLOWS_PER_TEST: process.env.MAX_FLOWS_PER_TEST ? parseInt(process.env.MAX_FLOWS_PER_TEST, 10) : 5000,
};

const envConfig = {
  development: require('./development').default,
  test: require('./test').default,
  staging: require('./staging').default,
  production: require('./production').default,
};

export default { ...baseConfig, ...envConfig[env] };
