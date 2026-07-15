import {
  SeverityLevel,
  type ApplicationInsights,
} from "@microsoft/applicationinsights-web";
import { getContext } from "@microsoft/power-apps/app";
import powerConfig from "../../power.config.json";

type LogProperties = Record<string, unknown>;

const loggerDefaults = {
  appName: powerConfig.appDisplayName,
} as const satisfies LogProperties;

let appInsights: ApplicationInsights | null = null;
let contextDefaults: LogProperties = {};

/** Bind Application Insights after it is initialized (avoids circular imports). */
export function bindLoggerAppInsights(instance: ApplicationInsights | null) {
  appInsights = instance;
}

/** Cache Power Apps context so every log includes it without async call sites. */
export async function initLoggerContext() {
  const ctx = await getContext().catch(() => null);
  if (!ctx) {
    contextDefaults = {};
    return;
  }

  contextDefaults = {
    appId: ctx.app.appId,
    environmentId: ctx.app.environmentId,
    userPrincipalName: ctx.user.userPrincipalName,
    userObjectId: ctx.user.objectId,
    tenantId: ctx.user.tenantId,
    sessionId: ctx.host.sessionId,
  };
}

function withDefaults(properties?: LogProperties): LogProperties {
  return {
    ...contextDefaults,
    ...properties,
    ...loggerDefaults,
  };
}

function toTraceProperties(properties: LogProperties): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined) continue;
    result[key] = typeof value === "string" ? value : JSON.stringify(value);
  }
  return result;
}

function log(
  consoleMethod: "info" | "warn" | "error",
  severityLevel: SeverityLevel,
  message: string,
  properties?: LogProperties,
) {
  const props = withDefaults(properties);

  console[consoleMethod](message, props);

  if (!appInsights) return;

  appInsights.trackTrace({
    message,
    severityLevel,
    properties: toTraceProperties(props),
  });
}

export const logger = {
  info(message: string, properties?: LogProperties) {
    log("info", SeverityLevel.Information, message, properties);
  },
  warn(message: string, properties?: LogProperties) {
    log("warn", SeverityLevel.Warning, message, properties);
  },
  error(message: string, properties?: LogProperties) {
    log("error", SeverityLevel.Error, message, properties);
  },
};
