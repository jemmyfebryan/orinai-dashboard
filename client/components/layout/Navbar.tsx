import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const orinCsLinks = [
  { to: "/", label: "Agents" },
  { to: "/assign", label: "Assign to WhatsApp" },
  { to: "/chat", label: "WhatsApp Chat" },
  { to: "/notification_setting", label: "Notification Setting" },
];

const siorinLinks = [
  { to: "/siorin", label: "Dashboard" },
  { to: "/siorin/chat-history", label: "Chat History" },
  { to: "/siorin/admin-settings", label: "Admin Settings" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isOrinCsActive = orinCsLinks.some((l) => pathname === l.to);
  const isSiorinActive = siorinLinks.some((l) => pathname === l.to);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:bg-background/70">
      <div className="container mx-auto flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/favicon.ico"
              alt="ORIN logo"
              className="h-7 w-7 rounded shadow ring-1 ring-primary/30"
            />
            <span className="font-extrabold tracking-tight">
              ORIN AI Chat Dashboard
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {/* Orin CS Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`text-sm font-medium hover:text-primary ${
                    isOrinCsActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Orin CS
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {orinCsLinks.map((l) => (
                  <DropdownMenuItem key={l.to} asChild>
                    <Link
                      to={l.to}
                      className={`cursor-pointer ${
                        pathname === l.to ? "bg-accent" : ""
                      }`}
                    >
                      {l.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/agents/new")}
                >
                  Create New Agent
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Siorin Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`text-sm font-medium hover:text-primary ${
                    isSiorinActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Siorin
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {siorinLinks.map((l) => (
                  <DropdownMenuItem key={l.to} asChild>
                    <Link
                      to={l.to}
                      className={`cursor-pointer ${
                        pathname === l.to ? "bg-accent" : ""
                      }`}
                    >
                      {l.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
        <div className="flex items-center gap-2">
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
