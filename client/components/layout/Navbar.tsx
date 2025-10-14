import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Agents" },
  { to: "/assign", label: "Assign to WhatsApp" },
  { to: "/chat", label: "WhatsApp Chat" },
  // { to: "/how-it-works", label: "How it Works" },
  // { to: "/about", label: "About" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:bg-background/70">
      <div className="container mx-auto flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-primary shadow ring-1 ring-primary/30" />
            <span className="font-extrabold tracking-tight">
              ORIN AI Chat Dashboard
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded px-3 py-2 text-sm font-medium hover:text-primary ${
                  pathname === l.to ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="text-sm"
            onClick={() => navigate("/agents/new")}
          >
            Create New Agent
          </Button>
          <Button
            variant="default"
            onClick={() => {
              localStorage.removeItem("orin_auth");
              navigate("/login");
            }}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
