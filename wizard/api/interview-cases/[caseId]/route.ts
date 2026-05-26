import { NextResponse, type NextRequest } from "next/server";
import { ensureInterviewCaseWorkflow } from "../../../server/interview-case-repository";

type RouteContext = {
  params: Promise<{ caseId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { caseId } = await context.params;
  const workflowInstance = ensureInterviewCaseWorkflow(caseId);

  return NextResponse.json({ workflowInstance });
}
