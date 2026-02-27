import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { initSampleData } from "@/services/onboarding";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (existingUser) {
      return NextResponse.json({ ok: true, isNew: false });
    }

    // 客户端生成 UUID 后直接 INSERT，避免 RLS SELECT 策略
    // 阻止 INSERT ... RETURNING 读回新插入的行
    const tenantId = crypto.randomUUID();
    const { error: tenantError } = await supabase.from("tenants").insert({
      id: tenantId,
      name: (user.email?.split("@")[0] || "新用户") + " 的店铺",
      category: "未设置",
      sku_scale: "0-50",
      status: "active",
    });

    if (tenantError) {
      return NextResponse.json(
        { error: "创建店铺失败: " + tenantError.message },
        { status: 500 }
      );
    }

    const { error: userError } = await supabase.from("users").insert({
      tenant_id: tenantId,
      auth_id: user.id,
      email: user.email ?? "",
      nickname: user.email?.split("@")[0] ?? "新用户",
      role: "admin",
      onboarding_completed: false,
      status: "active",
    });

    if (userError) {
      return NextResponse.json(
        { error: "创建用户失败: " + userError.message },
        { status: 500 }
      );
    }

    await supabase.from("subscriptions").insert({
      tenant_id: tenantId,
      plan: "free",
      billing_cycle: "monthly",
      price: 0,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
      status: "active",
    });

    await initSampleData(supabase, tenantId);

    return NextResponse.json({ ok: true, isNew: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
