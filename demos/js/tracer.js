const { HoneycombSDK } = require('@honeycombio/opentelemetry-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const setupTelemetry = () => {
  if (process.env.HONEYCOMB_ENABLED === 'true' && process.env.HONEYCOMB_API_KEY && process.env.OTEL_SERVICE_NAME) {
    console.log('Honeycomb / OpenTelemetry ENABLED.');
    // Uses environment variables named HONEYCOMB_API_KEY and OTEL_SERVICE_NAME
    // @ts-ignore
    const sdk = new HoneycombSDK({
      instrumentations: [    
        getNodeAutoInstrumentations({
          // disable fs automatic instrumentation because 
          // it can be noisy and expensive during startup
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
        }),
      ],
    });
    sdk.start();
  } else {
    console.log('Honeycomb API key or OTEL_SERVICE_NAME not found. Skipping telemetry setup.');
  }
};

module.exports = { setupTelemetry };
