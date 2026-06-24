import { NextResponse } from "next/server";
import { buildFuriganaFromNames } from "@/lib/utils/furigana";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { lastName?: string; firstName?: string };
    const furigana = await buildFuriganaFromNames(body.lastName ?? "", body.firstName ?? "");
    return NextResponse.json({ furigana });
  } catch {
    return NextResponse.json({ error: "フリガナ変換に失敗しました" }, { status: 500 });
  }
}
