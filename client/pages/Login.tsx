import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      localStorage.setItem("orin_auth", "1");
      navigate("/");
    } catch (err) {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-orange-50 to-white">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 h-12 w-12 rounded bg-primary" />
          <h1 className="text-xl font-bold">ORIN AI Chat Dashboard</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="user"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="pass"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full h-11">
            Sign In
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Default credentials: user / pass
          </p>
        </form>
      </div>
    </div>
  );
}
