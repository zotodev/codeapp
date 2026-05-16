// XrmTest.tsx
import { useEffect, useState } from "react";

/** Minimal typing for Dynamics / Power Apps host `Xrm` global */
type XrmWebApi = {
	retrieveMultipleRecords(
		entityLogicalName: string,
		query?: string,
	): Promise<{ entities?: Array<{ name?: string }> }>;
};

type XrmGlobal = {
	WebApi?: XrmWebApi;
};

/** Safe read: cross-origin parent/opener blocks access to `.Xrm` with SecurityError. */
function getXrmFromWindow(w: Window): XrmGlobal | undefined {
	try {
		return (w as Window & { Xrm?: XrmGlobal }).Xrm;
	} catch {
		return undefined;
	}
}

function resolveXrm(): XrmGlobal | undefined {
	return (
		getXrmFromWindow(window) ??
		getXrmFromWindow(window.parent) ??
		(window.opener ? getXrmFromWindow(window.opener) : undefined)
	);
}

type XrmStatus = {
	available: boolean;
	webApiAvailable: boolean;
	testResult?: string;
	error?: string;
};

export default function XrmTest() {
	const [status, setStatus] = useState<XrmStatus | null>(null);

	useEffect(() => {
		queueMicrotask(() => {
			const xrm = resolveXrm();

			if (!xrm) {
				setStatus({
					available: false,
					webApiAvailable: false,
					error: "Xrm not found on window, parent, or opener",
				});
				return;
			}

			const webApi = xrm.WebApi;
			const webApiAvailable = Boolean(webApi);

			if (webApiAvailable && webApi) {
				webApi
					.retrieveMultipleRecords("account", "?$select=name&$top=1")
					.then((res) => {
						const name = res.entities?.[0]?.name ?? "No records";
						setStatus({
							available: true,
							webApiAvailable: true,
							testResult: `✅ Live call OK — first account: "${name}"`,
						});
					})
					.catch((err: unknown) => {
						const message =
							err instanceof Error ? err.message : String(err);
						setStatus({
							available: true,
							webApiAvailable: true,
							error: `WebApi call failed: ${message}`,
						});
					});
			} else {
				setStatus({
					available: true,
					webApiAvailable: false,
					error: "Xrm found but WebApi not available",
				});
			}
		});
	}, []);

	const winXrm = getXrmFromWindow(window);
	const parentXrm = getXrmFromWindow(window.parent);
	const openerXrm = window.opener
		? getXrmFromWindow(window.opener)
		: undefined;

	return (
		<div style={{ fontFamily: "monospace", padding: 24 }}>
			<h3>Xrm Availability Test</h3>
			{!status && <p>Checking...</p>}
			{status && (
				<table border={1} cellPadding={8}>
					<tbody>
						<tr>
							<td>window.Xrm</td>
							<td>{winXrm ? "✅" : "❌"}</td>
						</tr>
						<tr>
							<td>parent.Xrm</td>
							<td>{parentXrm ? "✅" : "❌"}</td>
						</tr>
						<tr>
							<td>opener.Xrm</td>
							<td>{openerXrm ? "✅" : "❌"}</td>
						</tr>
						<tr>
							<td>Xrm.WebApi</td>
							<td>{status.webApiAvailable ? "✅" : "❌"}</td>
						</tr>
						<tr>
							<td>Live Call</td>
							<td>{status.testResult ?? status.error ?? "—"}</td>
						</tr>
					</tbody>
				</table>
			)}
		</div>
	);
}
