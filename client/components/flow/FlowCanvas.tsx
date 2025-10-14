import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export type ToolMap = Record<string, { name: string } & Record<string, any>>;

export type FlowNodeData =
  | { type: "start" }
  | { type: "class"; name: string; description: string; instructions: string }
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

function ClassNode({
  data,
}: {
  data: Extract<FlowNodeData, { type: "class" }>;
}) {
  return (
    <div className="w-64 rounded-lg border bg-white p-3 shadow-sm">
      <Handle type="target" position={Position.Left} />
      <div className="text-sm font-semibold">{data.name || "Class"}</div>
      <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
        {data.description}
      </p>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function ToolNode({
  data,
  tools,
}: {
  data: Extract<FlowNodeData, { type: "tools" }>;
  tools: ToolMap;
}) {
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

export function FlowCanvas({
  tools,
  initialQuestionClass,
  onBuildQuestionClass,
}: FlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlowNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Build initial graph
  useEffect(() => {
    const start: Node<FlowNodeData> = {
      id: "start",
      type: "startNode",
      position: { x: 0, y: 0 },
      data: { type: "start" },
      draggable: false,
      selectable: false,
    };

    if (
      !initialQuestionClass ||
      Object.keys(initialQuestionClass).length === 0
    ) {
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

    const addClassTree = (
      obj: any,
      depth: number,
      parentId: string,
      keyHint?: string,
    ) => {
      const name = obj.name || keyHint || "Class";
      const id = genId();
      newNodes.push({
        id,
        type: "classNode",
        position: { x: depth * 300, y: nextY(depth) },
        data: { type: "class", name, description: obj.description || "", instructions: obj.instructions || "" },
      });
      newEdges.push({ id: genId(), source: parentId, target: id });
      if (obj.tools) {
        const toolId = genId();
        newNodes.push({
          id: toolId,
          type: "toolNode",
          position: { x: (depth + 1) * 300, y: nextY(depth + 1) },
          data: { type: "tools", toolKey: obj.tools },
        });
        newEdges.push({ id: genId(), source: id, target: toolId });
      }
      if (obj.subclass) {
        Object.entries(obj.subclass).forEach(([k, v]) =>
          addClassTree(v as any, depth + 1, id, k),
        );
      }
    };

    Object.entries(initialQuestionClass).forEach(([k, v]) =>
      addClassTree(v as any, 1, "start", k),
    );

    setNodes(newNodes);
    setEdges(newEdges);
  }, [initialQuestionClass, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge({ ...connection, animated: false }, eds)),
    [setEdges],
  );

  const isValidConnection = useCallback(
    (connection: Connection) => {
      const src = nodes.find((n) => n.id === connection.source);
      const tgt = nodes.find((n) => n.id === connection.target);
      if (!src || !tgt) return false;
      if (src.id === tgt.id) return false;
      
      // Use type-safe checks for node data
      const isStartNode = (n: Node<FlowNodeData>): n is Node<{type: "start"}> =>
        n.data.type === "start";
      const isClassNode = (n: Node<FlowNodeData>): n is Node<{type: "class", name: string, description: string, instructions: string}> =>
        n.data.type === "class";
      const isToolNode = (n: Node<FlowNodeData>): n is Node<{type: "tools", toolKey: string}> =>
        n.data.type === "tools";

      if (isStartNode(src) && !isClassNode(tgt)) return false;
      if (isClassNode(src) && !(isClassNode(tgt) || isToolNode(tgt)))
        return false;
      if (isToolNode(src)) return false;
      
      // Prevent multiple tool connections from one class
      if (isClassNode(src) && isToolNode(tgt)) {
        const already = edges.some(
          (e) => e.source === src.id &&
            nodes.some(n => n.id === e.target && isToolNode(n))
        );
        if (already) return false;
      }
      return true;
    },
    [nodes, edges],
  );

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId),
    [nodes, selectedId],
  );
  const nodeTypes = useMemo(
    () => ({
      ...baseNodeTypes,
      toolNode: (p: any) => <ToolNode {...p} tools={tools} />,
    }),
    [tools],
  );

  const updateSelected = (updater: (data: FlowNodeData) => FlowNodeData) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id ? { ...n, data: updater(n.data) } : n,
      ),
    );
  };

  const addClass = () => {
    const id = genId();
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "classNode",
        position: { x: 300, y: (nds.length + 1) * 40 },
        data: { type: "class", name: "New Class", description: "", instructions: "" },
      },
    ]);
    setSelectedId(id);
    setDialogOpen(true);
  };

  const addTool = () => {
    const id = genId();
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "toolNode",
        position: { x: 600, y: (nds.length + 1) * 40 },
        data: { type: "tools", toolKey: "no_tool" },
      },
    ]);
    setSelectedId(id);
    setDialogOpen(true);
  };

  const removeSelected = () => {
    if (!selectedNode) return;
    if (selectedNode.id === "start") return;
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id,
      ),
    );
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

    // Type-safe node checks
    const isClassNode = (n: Node<FlowNodeData>): n is Node<{type: "class", name: string, description: string, instructions: string}> =>
      n.data.type === "class";
    const isToolNode = (n: Node<FlowNodeData>): n is Node<{type: "tools", toolKey: string}> =>
      n.data.type === "tools";

    const buildFromClass = (nodeId: string): any => {
      const node = idToNode.get(nodeId)!;
      if (!isClassNode(node)) return {};
      
      const data = node.data;
      const obj: any = { name: data.name, description: data.description, instructions: data.instructions };
      const children = adj.get(nodeId) || [];
      const childNodes = children
        .map((id) => idToNode.get(id)!)
        .filter(Boolean);
      
      const toolChild = childNodes.find(isToolNode);
      if (toolChild && isToolNode(toolChild)) {
        obj.tools = toolChild.data.toolKey;
      }
      
      const classChildren = childNodes.filter(isClassNode);
      if (classChildren.length > 0) {
        obj.subclass = {} as Record<string, any>;
        classChildren.forEach((cn) => {
          const child = buildFromClass(cn.id);
          const slug = uniqueSlug(isClassNode(cn) ? cn.data.name : "class");
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
      .filter(isClassNode)
      .forEach((n) => {
        const slug = uniqueSlug(isClassNode(n) ? n.data.name : "class");
        qc[slug] = buildFromClass(n.id);
      });

    onBuildQuestionClass?.(qc);
    return qc;
  };

  useEffect(() => {
    buildQuestionClass();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  return (
    <div className="grid"> {/* gap-4 lg:grid-cols-[1fr_320px] */}
      <div className="rounded-xl border bg-white p-2">
        <div className="mb-2 flex items-center gap-2">
          <Button size="sm" onClick={addClass}>
            Add Class
          </Button>
          <Button size="sm" variant="secondary" onClick={addTool}>
            Add Tool
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            Connect: drag from node dots
          </span>
        </div>
        <div className="h-[75vh] rounded-lg border">
          <ReactFlow
            nodes={nodes as Node[]}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onNodeClick={(_, n) => {
              setSelectedId(n.id);
              setDialogOpen(true);
            }}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <MiniMap pannable zoomable />
            <Controls />
          </ReactFlow>
        </div>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {selectedNode && selectedNode.data.type === "class" && (
          <DialogContent>
            <h3 className="text-sm font-semibold mb-2">Edit Class</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Class Name
                </label>
                <Input
                  value={selectedNode.data.type === "class" ? selectedNode.data.name : ""}
                  onChange={(e) => {
                    if (selectedNode.data.type === "class") {
                      updateSelected((d) => {
                        if (d.type === "class") {
                          return { ...d, name: e.target.value };
                        }
                        return d;
                      });
                    }
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Description
                </label>
                <textarea
                  className="h-32 w-full rounded-md border p-2 text-sm"
                  value={selectedNode.data.type === "class" ? selectedNode.data.description : ""}
                  onChange={(e) => {
                    if (selectedNode.data.type === "class") {
                      updateSelected((d) => {
                        if (d.type === "class") {
                          return { ...d, description: e.target.value };
                        }
                        return d;
                      });
                    }
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Instructions
                </label>
                <textarea
                  className="h-32 w-full rounded-md border p-2 text-sm"
                  value={selectedNode.data.type === "class" ? selectedNode.data.instructions : ""}
                  onChange={(e) => {
                    if (selectedNode.data.type === "class") {
                      updateSelected((d) => {
                        if (d.type === "class") {
                          return { ...d, instructions: e.target.value };
                        }
                        return d;
                      });
                    }
                  }}
                />
              </div>
              <div className="pt-2 flex justify-between">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    removeSelected();
                    setDialogOpen(false);
                  }}
                >
                  Delete
                </Button>
                <Button size="sm" onClick={() => setDialogOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
        {selectedNode && selectedNode.data.type === "tools" && (
          <DialogContent>
            <h3 className="text-sm font-semibold mb-2">Edit Tool</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Tool</label>
                <Select
                  value={selectedNode.data.type === "tools" ? selectedNode.data.toolKey : ""}
                  onValueChange={(v) => {
                    if (selectedNode.data.type === "tools") {
                      updateSelected((d) => {
                        if (d.type === "tools") {
                          return { ...d, toolKey: v };
                        }
                        return d;
                      });
                    }
                  }}
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
              <div className="pt-2 flex justify-between">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    removeSelected();
                    setDialogOpen(false);
                  }}
                >
                  Delete
                </Button>
                <Button size="sm" onClick={() => setDialogOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
