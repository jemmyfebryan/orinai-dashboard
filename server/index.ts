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
      res.cookie(COOKIE_NAME, "1", {
        httpOnly: false,
        sameSite: "none",
        secure: true,
        path: "/",
      });
      return res.json({ ok: true });
    }
    return res.status(401).json({ error: "invalid credentials" });
  });

  // Seed default agent (id=1)
  if (agents.length === 0) {
    agents = [
      {
        id: 1,
        agent_name: "ORIN AI",
        question_class: {
          operational_time: {
            name: "Operational Time",
            description:
              "Pertanyaan yang berkaitan dengan waktu operasional kendaraan, seperti jam mulai bergerak, jam berhenti, total waktu bergerak, waktu idle, atau waktu kendaraan aktif dalam sehari atau sebulan.",
            subclass: {
              general: {
                name: "General",
                description:
                  "Pertanyaan-pertanyaan yang bisa dijawab oleh database yang berisi summary kendaraan harian.\nGunakan subclass ini saat user bertanya tentang waktu operasional dalam kurun waktu harian, mingguan, bulanan, atau lebih lama.\nWaktu operasional menyakup moving dan idle. Jika user bertanya tentang pertanyaan general, tidak spesifik ke satu hari, melainkan setiap hari atau banyak hari, gunakan subclass ini.",
                tools: "ds_operational_time",
                instructions:
                  "- Untuk keterangan waktu, tambahkan informasi dalam bentuk menit, jam, dan hari.",
              },
              report: {
                name: "Report",
                subclass: {
                  idle: {
                    name: "Idle",
                    description:
                      "Gunakan subclass ini saat user bertanya tentang waktu operasional mengenai idle atau berhentinya kendaraan.",
                    tools: "or_idle",
                    instructions: "",
                  },
                  moving: {
                    name: "Moving",
                    description:
                      "Gunakan subclass ini saat user bertanya tentang waktu operasional mengenai moving atau perjalanan kendaraan.",
                    tools: "or_moving",
                    instructions: "",
                  },
                },
                description:
                  "Pertanyaan-pertanyaan yang bisa dijawab oleh database yang berisi detail setiap kendaraan user saat idle atau moving yang spesifik ke dalam jam-jam dalam satu hari.\nGunakan subclass ini saat user bertanya tentang waktu operasional detail yang spesifik ke jam-jam di dalamnya dengan menyebutkan spesifik tanggal/hari. Jangan gunakan subclass ini jika user hanya bertanya pertanyaan general seperti operasional harian, mingguan, atau bulanan.\nWaktu operasional di subclass ini hanya men-cakup moving dan idle saja.",
              },
            },
          },
          vehicle_utilization: {
            name: "Vehicle Utilization",
            description:
              "Pertanyaan yang berkaitan dengan seberapa sering kendaraan digunakan atau tidak digunakan, termasuk jumlah hari tidak beroperasi atau kendaraan tidak jalan.",
            tools: "ds_vehicle_utilization",
            instructions:
              "Jika sedang tidak digunakan maka 'total_km' = 0, sehingga ada 2 kolom untuk jumlah hari tidak beroperasi yaitu tanpa hari minggu (SUM(CASE WHEN total_km = 0 AND DAYOFWEEK(dt) != 1 THEN 1 ELSE 0 END)) dan semua hari (SUM(CASE WHEN total_km = 0 THEN 1 ELSE 0 END)), tidak perlu COUNT(*) AS total_days.",
          },
          distance_estimation: {
            name: "Distance Estimation",
            description:
              "Pertanyaan yang berhubungan dengan jarak tempuh kendaraan, seperti estimasi kilometer yang ditempuh dalam periode tertentu.",
            tools: "ds_distance_estimation",
            instructions: "-",
          },
          driving_behaviour: {
            name: "Driving Behaviour",
            description:
              "Pertanyaan tentang perilaku berkendara yang berisiko atau agresif, seperti insiden overspeed (ngebut), speedup (akselerasi), braking (pengereman), atau cornering (manuver).",
            tools: "ds_driving_behaviour",
            instructions: "-",
          },
          speed_analysis: {
            name: "Speed Analysis",
            description:
              "Pertanyaan mengenai kecepatan kendaraan, termasuk kecepatan maksimal atau kecepatan rata-rata harian.",
            tools: "ds_speed_analysis",
            instructions: "-",
          },
          fuel_estimation: {
            name: "Fuel Estimation",
            description:
              "Pertanyaan tentang estimasi penggunaan bahan bakar atau biaya bensin kendaraan berdasarkan aktivitas kendaraan.",
            tools: "ds_fuel_estimation",
            instructions: "-",
          },
          general_talk: {
            name: "General Talk",
            description:
              "Pertanyaan sangat general yang tidak berhubungan dengan kendaraan seperti sapaan, ucapan terima kasih, perminataan maaf, dan sebagainya.",
            tools: "",
            instructions: "-",
          },
        },
        question_class_system_prompt:
          "Kamu adalah asisten AI yang handal dalam mengklasifikasikan pertanyaan. Gunakan {question_classes_list} dan {question_classes_description} sebagai konteks untuk memilih kelas yang benar.",
        final_response_system_prompt:
          "Anda adalah asisten yang bertugas menjawab pertanyaan User berdasarkan data. Device: {user_devices_info}. {extra_prompt}.",
        suggested_questions_system_prompt:
          "Hasilkan 3 pertanyaan lanjutan singkat. Gunakan {question_classes_description} sebagai konteks.",
      },
    ];
    nextId = 2;
  }

  // Agents
  // app.get("/agents", requireAuth, (_req, res) => {
  //   res.json(agents.map(({ id, agent_name }) => ({ id, agent_name })));
  // });

  // app.get("/agents/:id", requireAuth, (req, res) => {
  //   const id = Number(req.params.id);
  //   const a = agents.find((x) => x.id === id);
  //   if (!a) return res.status(404).json({ error: "not found" });
  //   res.json(a);
  // });

  // app.post("/agents", requireAuth, (req, res) => {
  //   const b = req.body || {};
  //   const a: Agent = {
  //     id: nextId++,
  //     agent_name: b.agent_name,
  //     question_class: b.question_class || {},
  //     question_class_system_prompt: b.question_class_system_prompt || "",
  //     final_response_system_prompt: b.final_response_system_prompt || "",
  //     suggested_questions_system_prompt:
  //       b.suggested_questions_system_prompt || "",
  //   };
  //   agents.push(a);
  //   res.status(201).json(a);
  // });

  // app.put("/agents/:id", requireAuth, (req, res) => {
  //   const id = Number(req.params.id);
  //   const idx = agents.findIndex((x) => x.id === id);
  //   if (idx === -1) return res.status(404).json({ error: "not found" });
  //   const b = req.body || {};
  //   agents[idx] = { ...agents[idx], ...b, id };
  //   res.json(agents[idx]);
  // });

  // app.delete("/agents/:id", requireAuth, (req, res) => {
  //   const id = Number(req.params.id);
  //   agents = agents.filter((x) => x.id !== id);
  //   res.json({ ok: true });
  // });

  // // Tools
  // app.get("/tools", requireAuth, (_req, res) => res.json(tools));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  
  app.get("/api/demo", handleDemo);

  return app;
}
