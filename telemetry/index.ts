import { NodeSDK } from '@opentelemetry/sdk-node';
import { HoneycombSDK } from '@honeycombio/opentelemetry-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
export const setupTelemetry = () => {
  if (process.env.HONEYCOMB_ENABLED === 'true' && process.env.HONEYCOMB_API_KEY && process.env.OTEL_SERVICE_NAME) {
    console.log('Honeycomb / OpenTelemetry ENABLED. Setting up telemetry.');
    // Uses environment variables named HONEYCOMB_API_KEY and OTEL_SERVICE_NAME
    // @ts-ignore
    const sdk: NodeSDK = new HoneycombSDK({
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
    console.log('Honeycomb / OpenTelemetry DISABLED. Skipping telemetry setup.');
  }
};
