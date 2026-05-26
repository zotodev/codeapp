import { NextResponse, type NextRequest } from "next/server";
import { submitInterviewStage } from "../../../../server/interview-case-repository";

type RouteContext = {
  params: Promise<{ caseId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { caseId } = await context.params;
  const body = await request.json();

  try {
    const result = await submitInterviewStage({
      candidateId: caseId,
      expectedVersion: body.expectedVersion,
      actorId: body.actorId,
      stage: body.stage,
      formKey: body.formKey,
      payload: body.payload,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit stage" },
      { status: 409 },
    );
  }
}
