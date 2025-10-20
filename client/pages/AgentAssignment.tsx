import React, { useEffect, useState } from 'react';
import { getAgents, AgentSummary, getWhatsappNumbers, WhatsappAssignment, assignAgentToWhatsapp } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AgentAssignmentPage() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [assignments, setAssignments] = useState<WhatsappAssignment[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [numberToDelete, setNumberToDelete] = useState<string>('');

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
      toast({ title: "Success", description: `Assignment updated for ${selectedNumber}` });
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

  const handleDelete = async (phoneNumber: string) => {
    setNumberToDelete(phoneNumber);
    setDeleteConfirmOpen(true);
  };

  // const confirmDelete = async () => {
  //   try {
  //     setLoading(true);
  //     // Implement actual delete API call here
  //     // await deleteWhatsappNumber(numberToDelete);
  //     setAssignments(prev => prev.filter(a => a.phoneNumber !== numberToDelete));
  //     toast({ title: "Success", description: `Number ${numberToDelete} deleted` });
  //   } catch (err) {
  //     setError('Delete failed. Please try again.');
  //   } finally {
  //     setLoading(false);
  //     setDeleteConfirmOpen(false);
  //   }
  // };

  return (
    <>
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
                    {/* <TableHead className="w-24">Actions</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.phoneNumber}>
                      <TableCell>{assignment.phoneNumber}</TableCell>
                      <TableCell>
                        {assignment.agentName || 'Unassigned'}
                      </TableCell>
                      {/* <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(assignment.phoneNumber)}
                        >
                          Delete
                        </Button>
                      </TableCell> */}
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

      {/* <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Delete number {numberToDelete}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}
    </>
  );
}