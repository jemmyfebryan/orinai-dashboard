import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAgents, deleteAgent } from "@/services/api";

export default function Index() {
  const [agents, setAgents] = useState<{ id: number; agent_name: string }[]>(
    [],
  );
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    const list = await getAgents();
    setAgents(list);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = agents.filter((a) =>
    a.agent_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-sm text-muted-foreground">
            Manage your AI agents and build their workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button onClick={() => navigate("/agents/new")}>Create New Agent</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((agent) => (
          <div
            key={agent.id}
            className="group rounded-xl border bg-card p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{agent.agent_name}</h3>
                <p className="text-xs text-muted-foreground">ID: {agent.id}</p>
              </div>
              <div className="opacity-0 transition group-hover:opacity-100">
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await deleteAgent(agent.id);
                    load();
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button size="sm" onClick={() => navigate(`/agents/${agent.id}`)}>
                Open
              </Button>
              <Button size="sm" variant="secondary" onClick={() => navigate(`/agents/${agent.id}`)}>
                Edit
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full grid place-items-center rounded-xl border bg-card p-12 text-center text-muted-foreground">
            No agents yet. Click "Create New Agent" to get started.
          </div>
        )}
      </div>
    </div>
  );
}
