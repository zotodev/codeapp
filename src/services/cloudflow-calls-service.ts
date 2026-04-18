import { Zap_cloudflowcallsService } from "@/generated/services/Zap_cloudflowcallsService";

const MAX_POLL_MS = 10_000;
const POLL_INTERVAL_MS = 1_000;

async function createCall(payload: unknown) {
	const record = {
		zap_request: JSON.stringify(payload),
	} as Parameters<typeof Zap_cloudflowcallsService.create>[0];

	const result = await Zap_cloudflowcallsService.create(record);
	if (result.error) throw result.error;
	if (!result.data?.zap_cloudflowcallid) {
		throw new Error("Dataverse did not return a row ID.");
	}
	return result.data.zap_cloudflowcallid;
}

async function fetchCall(id: string) {
	const result = await Zap_cloudflowcallsService.get(id, {
		select: ["zap_response", "zap_responsecode"],
	});
	if (result.error) throw result.error;
	return result.data ?? null;
}

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function submitAndWaitForResponse(payload: unknown) {
	const id = await createCall(payload);

	const deadline = Date.now() + MAX_POLL_MS;

	while (Date.now() < deadline) {
		await delay(POLL_INTERVAL_MS);

		const record = await fetchCall(id);

		if (record?.zap_responsecode != null) {
			return record;
		}
	}

	throw new Error("Timed out waiting for a response. Try again later.");
}
