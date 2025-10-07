import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Simple session via cookie
  const COOKIE_NAME = "session";
  const requireAuth: express.RequestHandler = (req, res, next) => {
    const cookie = req.headers.cookie || "";
    const ok = cookie.split("; ").some((c) => c.startsWith(`${COOKIE_NAME}=`));
    if (!ok) return res.status(401).json({ error: "unauthorized" });
    next();
  };

  // In-memory stores
  type Agent = {
    id: number;
    agent_name: string;
    question_class: Record<string, any>;
    question_class_system_prompt: string;
    final_response_system_prompt: string;
    suggested_questions_system_prompt: string;
  };

  const tools: Record<string, any> = {
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

  let agents: Agent[] = [];
  let nextId = 1;

  // Auth
  app.post("/login", (req, res) => {
    const { username, password } = req.body || {};
    if (username === "user" && password === "pass") {
      res.cookie(COOKIE_NAME, "1", { httpOnly: false, sameSite: "lax" });
      return res.json({ ok: true });
    }
    return res.status(401).json({ error: "invalid credentials" });
  });

  // Agents
  app.get("/agents", requireAuth, (_req, res) => {
    res.json(agents.map(({ id, agent_name }) => ({ id, agent_name })));
  });

  app.get("/agents/:id", requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const a = agents.find((x) => x.id === id);
    if (!a) return res.status(404).json({ error: "not found" });
    res.json(a);
  });

  app.post("/agents", requireAuth, (req, res) => {
    const b = req.body || {};
    const a: Agent = {
      id: nextId++,
      agent_name: b.agent_name,
      question_class: b.question_class || {},
      question_class_system_prompt: b.question_class_system_prompt || "",
      final_response_system_prompt: b.final_response_system_prompt || "",
      suggested_questions_system_prompt: b.suggested_questions_system_prompt || "",
    };
    agents.push(a);
    res.status(201).json(a);
  });

  app.put("/agents/:id", requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const idx = agents.findIndex((x) => x.id === id);
    if (idx === -1) return res.status(404).json({ error: "not found" });
    const b = req.body || {};
    agents[idx] = { ...agents[idx], ...b, id };
    res.json(agents[idx]);
  });

  app.delete("/agents/:id", requireAuth, (req, res) => {
    const id = Number(req.params.id);
    agents = agents.filter((x) => x.id !== id);
    res.json({ ok: true });
  });

  // Tools
  app.get("/tools", requireAuth, (_req, res) => res.json(tools));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  return app;
}
