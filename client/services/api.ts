export interface AgentPayload {
  agent_name: string;
  question_class: Record<string, any>;
  question_class_system_prompt: string;
  final_response_system_prompt: string;
  suggested_questions_system_prompt: string;
}

export interface AgentSummary {
  id: number;
  agent_name: string;
}

export async function login(username: string, password: string) {
  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  return true;
}

export async function getAgents(): Promise<AgentSummary[]> {
  const res = await fetch("/agents");
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}

export async function getAgent(id: number) {
  const res = await fetch(`/agents/${id}`);
  if (!res.ok) throw new Error("Failed to fetch agent");
  return res.json();
}

export async function createAgent(payload: AgentPayload) {
  const res = await fetch("/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create agent");
  return res.json();
}

export async function updateAgent(id: number, payload: AgentPayload) {
  const res = await fetch(`/agents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update agent");
  return res.json();
}

export async function deleteAgent(id: number) {
  const res = await fetch(`/agents/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete agent");
  return res.json();
}

export async function getTools(): Promise<Record<string, any>> {
  const res = await fetch("/tools");
  if (!res.ok) throw new Error("Failed to fetch tools");
  return res.json();
}
