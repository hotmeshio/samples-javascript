const { HoneycombSDK } = require('@honeycombio/opentelemetry-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

let sdk;

const setupTelemetry = () => {
  if (process.env.HONEYCOMB_ENABLED === 'true' && process.env.HONEYCOMB_API_KEY && process.env.OTEL_SERVICE_NAME) {
    console.log('Honeycomb / OpenTelemetry ENABLED.');
    // Uses environment variables named HONEYCOMB_API_KEY and OTEL_SERVICE_NAME
    // @ts-ignore
    sdk = new HoneycombSDK({
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

// Function to gracefully shut down the Honeycomb SDK
const shutdownTelemetry = async () => {
  if (sdk) {
    await sdk.shutdown().then(() => {
      console.log('Telemetry has been shut down gracefully.');
    }).catch((error) => {
      console.error('Failed to shut down telemetry:', error);
    });
  }
};

function getUtcUnixEpoch(decrementHours = 0) {
  const currentTime = Date.now();
  const decrementMilliseconds = decrementHours * 60 * 60 * 1000;
  const adjustedTime = currentTime - decrementMilliseconds;
  return Math.floor(adjustedTime / 1000);
}

const getTraceUrl = (traceId) => {
  return `https://ui.honeycomb.io/${process.env.HONEYCOMB_SERVICE_NAME}/environments/${process.env.HONEYCOMB_ENVIRONMENT}/trace?trace_id=${traceId}&trace_start_ts=${getUtcUnixEpoch(24)}&trace_end_ts=${getUtcUnixEpoch(-24)}`;
}

module.exports = { setupTelemetry, shutdownTelemetry, getTraceUrl };
