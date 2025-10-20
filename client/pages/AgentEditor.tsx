import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlowCanvas } from "@/components/flow/FlowCanvas";
import { createAgent, getAgent, getTools, updateAgent } from "@/services/api";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AgentEditor() {
  const { id } = useParams();
  const isNew = id === "new" || !id;
  const navigate = useNavigate();

  const [agentName, setAgentName] = useState("");
  const [qcPrompt, setQcPrompt] = useState("");
  const [finalPrompt, setFinalPrompt] = useState("");
  const [suggestPrompt, setSuggestPrompt] = useState("");
  const [tools, setTools] = useState<Record<string, any>>({});
  const [initialQC, setInitialQC] = useState<Record<string, any> | null>(null);
  const builtQC = useRef<Record<string, any> | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await getTools();
      setTools(t);
      if (!isNew && id) {
        const agent = await getAgent(Number(id));
        setAgentName(agent.agent_name || "");
        setQcPrompt(agent.question_class_system_prompt || "");
        setFinalPrompt(agent.final_response_system_prompt || "");
        setSuggestPrompt(agent.suggested_questions_system_prompt || "");
        setInitialQC(agent.question_class || {});
      } else {
        setInitialQC({});
      }
    })();
  }, [id, isNew]);

  const onBuild = (qc: Record<string, any>) => {
    builtQC.current = qc;
  };

  const submit = async () => {
    const qc = builtQC.current ?? initialQC ?? {};
    const payload = {
      agent_name: agentName,
      question_class: qc,
      question_class_system_prompt: qcPrompt,
      final_response_system_prompt: finalPrompt,
      suggested_questions_system_prompt: suggestPrompt,
    };

    if (!agentName || !qcPrompt || !finalPrompt || !suggestPrompt) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please complete all fields. Prompts must include keys in {braces} as required.",
      });
      return;
    }

    if (isNew) {
      const created = await createAgent(payload);
      // navigate(`/agents/${created.id}`);
      toast({ title: "Success", description: "Agent has been created!" });
      navigate(`/`);
    } else {
      await updateAgent(Number(id), payload);
      toast({ title: "Success", description: "Agent has been updated" });
      navigate(`/`);
    }
  };

  const exportJson = () => {
    const data = {
      agent_name: agentName,
      question_class: builtQC.current ?? initialQC ?? {},
      question_class_system_prompt: qcPrompt,
      final_response_system_prompt: finalPrompt,
      suggested_questions_system_prompt: suggestPrompt,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${agentName || "agent"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fileRef = useRef<HTMLInputElement | null>(null);

  const importJson = () => {
    setImportConfirmOpen(true);
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    const data = JSON.parse(text);
    setAgentName(data.agent_name || "");
    setInitialQC(data.question_class || {});
    setQcPrompt(data.question_class_system_prompt || "");
    setFinalPrompt(data.final_response_system_prompt || "");
    setSuggestPrompt(data.suggested_questions_system_prompt || "");
  };

  const deleteAgent = async () => {
    await fetch(`/agents/${id}`, { method: "DELETE" });
    navigate("/");
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? "Create Agent" : `Edit Agent #${id}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              Build AI Agents flows: Start → Class → (Class|Tool). Every branch
              must end with a tool; missing tools default to "No Tool".
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <Button
                variant="destructive"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                Delete Agent
              </Button>
            )}
            <Button variant="outline" onClick={exportJson}>
              Export JSON
            </Button>
            <Button variant="outline" onClick={importJson}>
              Import JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={onImportFile}
            />
            <Button onClick={submit}>{isNew ? "Create Agent" : "Apply"}</Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-4 rounded-xl border bg-white p-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Agent Name</label>
              <Input
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g., ORIN AI"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Question Class System Prompt
              </label>
              <textarea
                className="h-32 w-full rounded-md border p-2 text-sm"
                value={qcPrompt}
                onChange={(e) => setQcPrompt(e.target.value)}
                placeholder="Must include keys like {question_classes_list}, {question_classes_description}"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Include keys in braces exactly as needed.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Final Response System Prompt
              </label>
              <textarea
                className="h-32 w-full rounded-md border p-2 text-sm"
                value={finalPrompt}
                onChange={(e) => setFinalPrompt(e.target.value)}
                placeholder="Must include keys like {user_devices_info}, {extra_prompt}"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Suggested Questions System Prompt
              </label>
              <textarea
                className="h-28 w-full rounded-md border p-2 text-sm"
                value={suggestPrompt}
                onChange={(e) => setSuggestPrompt(e.target.value)}
                placeholder="Use {question_classes_description} if needed"
              />
            </div>
          </div>
          <div>
            <FlowCanvas
              tools={tools}
              initialQuestionClass={initialQC || {}}
              onBuildQuestionClass={onBuild}
            />
          </div>
        </div>
      </div>

      <AlertDialog open={importConfirmOpen} onOpenChange={setImportConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Import</AlertDialogTitle>
            <AlertDialogDescription>
              Import will replace current agent data. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => fileRef.current?.click()}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this agent? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAgent}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
