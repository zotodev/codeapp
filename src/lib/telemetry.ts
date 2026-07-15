import {
  ApplicationInsights,
  SeverityLevel,
} from "@microsoft/applicationinsights-web";
import { setConfig } from "@microsoft/power-apps/app";
import { bindLoggerAppInsights, logger } from "@/utils/logger";
import { getEnvironmentVariableValue } from "./environmentVariable";

const APP_INSIGHTS_SCHEMA = "cbv_AppInsightsConnectionString";

let appInsights: ApplicationInsights | null = null;

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export async function initializeAppInsights() {
  const phase = "initAppInsights";

  try {
    const connectionString =
      (await getEnvironmentVariableValue(APP_INSIGHTS_SCHEMA)) ?? "";

    if (!connectionString) {
      logger.warn("App Insights connection string is missing", {
        phase,
        schemaName: APP_INSIGHTS_SCHEMA,
      });
      return null;
    }

    appInsights = new ApplicationInsights({ config: { connectionString } });
    appInsights.loadAppInsights();
    bindLoggerAppInsights(appInsights);

    setConfig({
      logger: {
        logMetric: (metric) => {
          appInsights?.trackEvent({ name: metric.type }, metric.data);
        },
      },
    });

    appInsights.trackTrace({
      message:
        "App Insights initialized successfully from Environment Variable",
      severityLevel: SeverityLevel.Information,
    });

    return appInsights;
  } catch (error: unknown) {
    const err = toError(error);

    const errorProps = {
      phase,
      schemaName: APP_INSIGHTS_SCHEMA,
      errorMessage: err.message,
      errorName: err.name,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    };

    logger.error("Failed to initialize Application Insights", errorProps);

    // Send exception to App Insights (if partially initialized)
    appInsights?.trackException({
      exception: err,
      properties: errorProps,
    });

    return null;
  }
}

export function getAppInsights() {
  return appInsights;
}
