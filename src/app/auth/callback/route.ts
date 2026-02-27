import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { initSampleData } from "@/services/onboarding";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (!existingUser) {
        const { data: tenant } = await supabase
          .from("tenants")
          .insert({
            name: user.email?.split("@")[0] + " 的店铺",
            category: "未设置",
            sku_scale: "0-50",
            status: "active",
          })
          .select("id")
          .single();

        if (tenant) {
          await supabase.from("users").insert({
            tenant_id: tenant.id,
            auth_id: user.id,
            email: user.email ?? "",
            nickname: user.email?.split("@")[0] ?? "新用户",
            role: "admin",
            onboarding_completed: false,
            status: "active",
          });

          await supabase.from("subscriptions").insert({
            tenant_id: tenant.id,
            plan: "free",
            billing_cycle: "monthly",
            price: 0,
            started_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
            status: "active",
          });

          await initSampleData(supabase, tenant.id);
        }

        return NextResponse.redirect(
          `${origin}/auth/welcome?next=${encodeURIComponent(next)}`
        );
      }
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
