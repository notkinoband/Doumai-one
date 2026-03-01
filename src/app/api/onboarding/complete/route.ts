import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { completeOnboarding, type OnboardingCompletePayload } from "@/services/onboarding";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("id, tenant_id, onboarding_completed")
      .eq("auth_id", authUser.id)
      .single();
    if (!profile) {
      return NextResponse.json({ error: "用户信息不存在" }, { status: 404 });
    }
    if (profile.onboarding_completed) {
      return NextResponse.json({ ok: true });
    }

    const body = (await request.json()) as OnboardingCompletePayload;
    if (!body.step1 || !body.step2 || !Array.isArray(body.products)) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    await completeOnboarding(supabase, profile.tenant_id, profile.id, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
