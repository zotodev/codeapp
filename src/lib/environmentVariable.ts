import { EnvironmentvariablevaluesService } from "@/generated/services/EnvironmentvariablevaluesService";
import { logger } from "@/utils/logger";

const service = EnvironmentvariablevaluesService;

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
    name: typeof error,
    stack: undefined,
  };
}

/**
 * Get Environment Variable value by schema name.
 * Handles errors, logging, and context enrichment.
 */
export async function getEnvironmentVariableValue(
  schemaName: string,
): Promise<string | null> {
  const phase = "fetchEnvVar";

  try {
    const result = await service.getAll({
      select: ["value"],
      filter: `schemaname eq '${schemaName}'`,
      top: 1,
    });

    if (!result.success || !result.data?.length) {
      logger.warn("Environment variable not found or empty", {
        schemaName,
        phase,
        valueFound: false,
      });
      return null;
    }

    const value = result.data[0].value ?? null;

    logger.info("Environment variable fetched", {
      schemaName,
      phase,
      valueFound: true,
      valueLength: value?.length ?? 0,
    });

    return value;
  } catch (error: unknown) {
    logger.error("Failed to fetch environment variable", {
      schemaName,
      phase,
      error: getErrorDetails(error),
      timestamp: new Date().toISOString(),
    });

    return null;
  }
}
