"use client";
import { signIn } from "next-auth/react";

export default function SignIn() {
  return (
    <div style={{ padding: 24 }}>
      <h1>登入</h1>
      <button onClick={() => signIn("google")}>使用 Google 登入</button>
    </div>
  );
}


