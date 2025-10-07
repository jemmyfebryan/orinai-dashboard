import Navbar from "./Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50 dark:from-background dark:to-background">
      <Navbar />
      <main className="container mx-auto py-6">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ORIN AI
      </footer>
    </div>
  );
}
