import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signupSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists", code: "EMAIL_IN_USE" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
        role: parsed.data.role,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(
      { data: user, message: "Account created" },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create account", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
