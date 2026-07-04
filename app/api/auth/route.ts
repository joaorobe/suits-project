import { NextResponse } from "next/server";
import { authenticateUser } from "../../../lib/data";
import type { LoginRequest, LoginResponse } from "../../../lib/types";

export async function POST(request: Request) {
  const payload = (await request.json()) as LoginRequest;
  const user = await authenticateUser(payload.cpf, payload.password);

  const response: LoginResponse = user
    ? { success: true, message: "Login realizado com sucesso.", user }
    : { success: false, message: "CPF ou senha inválidos." };

  return NextResponse.json(response, { status: response.success ? 200 : 401 });
}
