import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Handle,
  Node,
  Position,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ToolMap = Record<string, { name: string } & Record<string, any>>;

export type FlowNodeData =
  | { type: "start" }
  | { type: "class"; name: string; description: string }
  | { type: "tools"; toolKey: string };

export interface FlowCanvasProps {
  tools: ToolMap;
  initialQuestionClass?: Record<string, any> | null;
  onBuildQuestionClass?: (qc: Record<string, any>) => void;
}

const StartNode = () => (
  <div className="rounded-lg border bg-white px-3 py-2 shadow-sm">
    <div className="text-xs font-semibold text-primary">Start</div>
    <Handle type="source" position={Position.Right} />
  </div>
);

function ClassNode({ data }: { data: Extract<FlowNodeData, { type: "class" }> }) {
  return (
    <div className="w-64 rounded-lg border bg-white p-3 shadow-sm">
      <Handle type="target" position={Position.Left} />
      <div className="text-sm font-semibold">{data.name || "Class"}</div>
      <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{data.description}</p>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function ToolNode({ data, tools }: { data: Extract<FlowNodeData, { type: "tools" }>; tools: ToolMap }) {
  const label = tools?.[data.toolKey]?.name ?? data.toolKey ?? "Tool";
  return (
    <div className="w-64 rounded-lg border bg-white p-3 shadow-sm">
      <Handle type="target" position={Position.Left} />
      <div className="text-sm font-semibold">{label}</div>
    </div>
  );
}

const baseNodeTypes = {
  startNode: StartNode,
  classNode: (props: any) => <ClassNode {...props} />,
};

let nextId = 1;
const genId = () => `${Date.now()}_${nextId++}`;

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/__+/g, "_");
}

export function FlowCanvas({ tools, initialQuestionClass, onBuildQuestionClass }: FlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Build initial graph
  useEffect(() => {
    const start: Node<FlowNodeData> = {
      id: "start",
      type: "startNode",
      position: { x: 0, y: 0 },
      data: { type: "start" },
    };

    if (!initialQuestionClass || Object.keys(initialQuestionClass).length === 0) {
      setNodes([start]);
      setEdges([]);
      return;
    }

    const newNodes: Node<FlowNodeData>[] = [start];
    const newEdges: Edge[] = [];

    const placements = new Map<string, number>();
    const nextY = (depth: number) => {
      const y = placements.get(String(depth)) ?? 0;
      placements.set(String(depth), y + 120);
      return y;
    };

    const addClassTree = (obj: any, depth: number, parentId: string, keyHint?: string) => {
      const name = obj.name || keyHint || "Class";
      const id = genId();
      newNodes.push({ id, type: "classNode", position: { x: depth * 300, y: nextY(depth) }, data: { type: "class", name, description: obj.description || "" } });
      newEdges.push({ id: genId(), source: parentId, target: id });
      if (obj.tools) {
        const toolId = genId();
        newNodes.push({ id: toolId, type: "toolNode", position: { x: (depth + 1) * 300, y: nextY(depth + 1) }, data: { type: "tools", toolKey: obj.tools } });
        newEdges.push({ id: genId(), source: id, target: toolId });
      }
      if (obj.subclass) {
        Object.entries(obj.subclass).forEach(([k, v]) => addClassTree(v as any, depth + 1, id, k));
      }
    };

    Object.entries(initialQuestionClass).forEach(([k, v]) => addClassTree(v as any, 1, "start", k));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [initialQuestionClass, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: false }, eds)),
    [setEdges],
  );

  const isValidConnection = useCallback(
    (connection: Connection) => {
      const src = nodes.find((n) => n.id === connection.source);
      const tgt = nodes.find((n) => n.id === connection.target);
      if (!src || !tgt) return false;
      if (src.id === tgt.id) return false;
      const srcType = src.type;
      const tgtType = tgt.type;
      if (srcType === "startNode" && tgtType !== "classNode") return false;
      if (srcType === "classNode" && !(tgtType === "classNode" || tgtType === "toolNode")) return false;
      if (srcType === "toolNode") return false;
      // Prevent multiple tool connections from one class
      if (srcType === "classNode" && tgtType === "toolNode") {
        const already = edges.some((e) => e.source === src.id && nodes.find((n) => n.id === e.target)?.type === "toolNode");
        if (already) return false;
      }
      return true;
    },
    [nodes, edges],
  );

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedId), [nodes, selectedId]);

  const updateSelected = (updater: (data: any) => any) => {
    if (!selectedNode) return;
    setNodes((nds) => nds.map((n) => (n.id === selectedNode.id ? { ...n, data: updater(n.data) } : n)));
  };

  const addClass = () => {
    const id = genId();
    setNodes((nds) => [
      ...nds,
      { id, type: "classNode", position: { x: 300, y: (nds.length + 1) * 40 }, data: { type: "class", name: "New Class", description: "" } },
    ]);
  };

  const addTool = () => {
    const id = genId();
    setNodes((nds) => [
      ...nds,
      { id, type: "toolNode", position: { x: 600, y: (nds.length + 1) * 40 }, data: { type: "tools", toolKey: "no_tool" } },
    ]);
  };

  const removeSelected = () => {
    if (!selectedNode) return;
    if (selectedNode.id === "start") return;
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setSelectedId(null);
  };

  const buildQuestionClass = () => {
    const adj = new Map<string, string[]>();
    edges.forEach((e) => {
      adj.set(e.source, [...(adj.get(e.source) || []), e.target]);
    });

    const idToNode = new Map(nodes.map((n) => [n.id, n] as const));
    const usedSlugs = new Set<string>();

    const uniqueSlug = (name: string) => {
      let base = slugify(name || "class");
      let s = base;
      let i = 1;
      while (usedSlugs.has(s)) {
        s = `${base}_${i++}`;
      }
      usedSlugs.add(s);
      return s;
    };

    const buildFromClass = (nodeId: string): any => {
      const node = idToNode.get(nodeId)!;
      const data = node.data as Extract<FlowNodeData, { type: "class" }>;
      const obj: any = { name: data.name, description: data.description };
      const children = adj.get(nodeId) || [];
      const childNodes = children.map((id) => idToNode.get(id)!).filter(Boolean);
      const toolChild = childNodes.find((n) => n.type === "toolNode");
      if (toolChild) obj.tools = (toolChild.data as any).toolKey;
      const classChildren = childNodes.filter((n) => n.type === "classNode");
      if (classChildren.length > 0) {
        obj.subclass = {} as Record<string, any>;
        classChildren.forEach((cn) => {
          const child = buildFromClass(cn.id);
          const slug = uniqueSlug((cn.data as any).name);
          obj.subclass[slug] = child;
        });
      }
      if (!toolChild && classChildren.length === 0) {
        obj.tools = "no_tool";
      }
      return obj;
    };

    const roots = adj.get("start") || [];
    const qc: Record<string, any> = {};
    roots
      .map((id) => idToNode.get(id)!)
      .filter((n) => n?.type === "classNode")
      .forEach((n) => {
        const slug = uniqueSlug((n.data as any).name);
        qc[slug] = buildFromClass(n.id);
      });

    onBuildQuestionClass?.(qc);
    return qc;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="rounded-xl border bg-white p-2">
        <div className="mb-2 flex items-center gap-2">
          <Button size="sm" onClick={addClass}>Add Class</Button>
          <Button size="sm" variant="secondary" onClick={addTool}>Add Tool</Button>
          <span className="ml-auto text-xs text-muted-foreground">Connect: drag from node dots</span>
        </div>
        <div className="h-[520px] rounded-lg border">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onNodeClick={(_, n) => setSelectedId(n.id)}
            nodeTypes={{ ...baseNodeTypes, toolNode: (p: any) => <ToolNode {...p} tools={tools} /> }}
            fitView
          >
            <Background />
            <MiniMap pannable zoomable />
            <Controls />
          </ReactFlow>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-4">
        <h3 className="text-sm font-semibold">Selected Node</h3>
        {!selectedNode && (
          <p className="mt-2 text-xs text-muted-foreground">Select a node to edit</p>
        )}
        {selectedNode && selectedNode.type === "classNode" && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Class Name</label>
              <Input
                value={(selectedNode.data as any).name}
                onChange={(e) => updateSelected((d) => ({ ...d, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Description</label>
              <Input
                value={(selectedNode.data as any).description}
                onChange={(e) => updateSelected((d) => ({ ...d, description: e.target.value }))}
              />
            </div>
            <div className="pt-2">
              <Button variant="destructive" size="sm" onClick={removeSelected}>Delete</Button>
            </div>
          </div>
        )}
        {selectedNode && selectedNode.type === "toolNode" && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Tool</label>
              <Select
                value={(selectedNode.data as any).toolKey}
                onValueChange={(v) => updateSelected((d) => ({ ...d, toolKey: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tool" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tools).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2">
              <Button variant="destructive" size="sm" onClick={removeSelected}>Delete</Button>
            </div>
          </div>
        )}
        {selectedNode && selectedNode.id === "start" && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">The Start node cannot be modified</p>
          </div>
        )}
        <div className="mt-6">
          <Button size="sm" variant="outline" onClick={buildQuestionClass}>Preview JSON</Button>
        </div>
      </div>
    </div>
  );
}
