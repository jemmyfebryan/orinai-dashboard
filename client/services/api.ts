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
  const res = await fetch("/agents", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}

export async function getAgent(id: number) {
  const res = await fetch(`/agents/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch agent");
  return res.json();
}

export async function createAgent(payload: AgentPayload) {
  const res = await fetch("/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = "Failed to create agent";
    try {
      const t = await res.text();
      if (t) msg = `${msg}: ${t}`;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function updateAgent(id: number, payload: AgentPayload) {
  const res = await fetch(`/agents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = "Failed to update agent";
    try {
      const t = await res.text();
      if (t) msg = `${msg}: ${t}`;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function deleteAgent(id: number) {
  const res = await fetch(`/agents/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error("Failed to delete agent");
  return res.json();
}

export const FALLBACK_TOOLS: Record<string, any> = {
  ds_operational_time: {
    name: "Operational Time Summary",
    db: "devsites_orin",
    columns: [
      "device_sn",
      "dt",
      "start_moving_time",
      "stop_moving_time",
      "total_moving_time",
      "total_idle_time",
      "total_acc_on_time",
    ],
  },
  ds_vehicle_utilization: {
    name: "Vehicle Utilization Summary",
    db: "devsites_orin",
    columns: ["device_sn", "dt", "total_km"],
  },
  ds_distance_estimation: {
    name: "Distance Estimation Summary",
    db: "devsites_orin",
    columns: ["device_sn", "dt", "total_km"],
  },
  ds_driving_behaviour: {
    name: "Driving Behaviour Summary",
    db: "devsites_orin",
    columns: [
      "device_sn",
      "dt",
      "behaviour_point",
      "behaviour_point_card",
      "total_overspeed_incident",
      "total_speedup_incident",
      "total_braking_incident",
      "total_cornering_incident",
    ],
  },
  ds_speed_analysis: {
    name: "Speed Analysis Summary",
    db: "devsites_orin",
    columns: ["device_sn", "dt", "top_speed", "average_speed"],
  },
  ds_fuel_estimation: {
    name: "Fuel Estimation Summary",
    db: "devsites_orin",
    columns: ["device_sn", "dt", "fuel_scale", "fuel_cost_est"],
  },
  or_idle: {
    name: "Idle Reports",
    columns: ["device_sn", "dt", "data", "speed", "status_gps", "status_acc"],
  },
  or_moving: {
    name: "Moving Reports",
    columns: ["device_sn", "dt", "data", "speed", "status_gps", "status_acc"],
  },
  no_tool: { name: "No Tool" },
};

export async function getTools(): Promise<Record<string, any>> {
  try {
    const res = await fetch("/tools", { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch tools");
    return await res.json();
  } catch {
    return FALLBACK_TOOLS;
  }
}
