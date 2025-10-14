import React, { useEffect, useState } from 'react';
import { getAgents, AgentSummary, getWhatsappNumbers, WhatsappAssignment, assignAgentToWhatsapp } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AgentAssignmentPage() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [assignments, setAssignments] = useState<WhatsappAssignment[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [agentList, assignmentList] = await Promise.all([
          getAgents(),
          getWhatsappNumbers()
        ]);
        setAgents(agentList);
        setAssignments(assignmentList);
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleAssign = async () => {
    if (!selectedNumber) {
      setError('Please select a number');
      return;
    }

    try {
      setLoading(true);
      await assignAgentToWhatsapp(selectedNumber, selectedAgentId);
      
      // Update local state to reflect the change
      setAssignments(prev => prev.map(a =>
        a.phoneNumber === selectedNumber
          ? {...a, agentId: selectedAgentId, agentName: agents.find(ag => ag.id === selectedAgentId)?.agent_name || null}
          : a
      ));
      
      setError(null);
      alert(`Assignment updated for ${selectedNumber}`);
    } catch (err) {
      setError('Assignment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAgentName = (agentId: number | null) => {
    if (agentId === null) return 'Unassigned';
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.agent_name : 'Unknown';
  };

  if (loading) {
    return <div className="p-6">Loading assignments...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Agent to WhatsApp Number Assignments</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-medium mb-2">Current Assignments</h2>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>WhatsApp Number</TableHead>
                  <TableHead>Assigned Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.phoneNumber}>
                    <TableCell>{assignment.phoneNumber}</TableCell>
                    <TableCell>
                      {assignment.agentName || 'Unassigned'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-medium">Update Assignment</h2>
          
          <div>
            <h3 className="text-md font-medium mb-2">WhatsApp Number</h3>
            <Select onValueChange={setSelectedNumber} value={selectedNumber}>
              <SelectTrigger>
                <SelectValue placeholder="Select a number" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map(a => (
                  <SelectItem key={a.phoneNumber} value={a.phoneNumber}>
                    {a.phoneNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="text-md font-medium mb-2">Agent</h3>
            <Select
              onValueChange={val => setSelectedAgentId(val === "unassign" ? null : Number(val))}
              value={selectedAgentId?.toString() || ''}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassign">Unassign</SelectItem>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.agent_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleAssign} disabled={loading}>
              Update Assignment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}