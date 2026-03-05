import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: "Project ID required" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const role = body?.role === "reviewer" ? "reviewer" : null;
  if (!role) {
    return NextResponse.json(
      { error: "Body must include role: 'reviewer'" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, client_id, designer_id")
    .eq("id", projectId)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const isClientOrDesigner =
    project.client_id === user.id || project.designer_id === user.id;
  if (!isClientOrDesigner) {
    return NextResponse.json(
      { error: "Only the client or designer can create reviewer invites" },
      { status: 403 }
    );
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error: inviteError } = await supabase.from("project_invites").insert({
    project_id: projectId,
    token,
    role: "reviewer",
    expires_at: expiresAt.toISOString(),
  });

  if (inviteError) {
    return NextResponse.json(
      { error: inviteError.message || "Failed to create invite" },
      { status: 500 }
    );
  }

  const origin = request.headers.get("origin") || request.nextUrl.origin;
  const url = `${origin}/invite/${token}`;

  return NextResponse.json({ token, url });
}
