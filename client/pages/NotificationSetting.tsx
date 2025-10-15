import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Pencil, Save, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

import {
  fetchNotificationSettings,
  updateNotificationSetting,
  createPromptSetting,
  deletePromptSetting
} from '@/services/notificationSettings';
import type { NotificationSetting } from '@/services/notificationSettings';

const NotificationSetting = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newPrompt, setNewPrompt] = useState({ name: '', value: '' });

  // Fetch notification settings
  const { data: settings, isLoading } = useQuery<NotificationSetting[]>({
    queryKey: ['notificationSettings'],
    queryFn: fetchNotificationSettings
  });

  // Mutation for updating a setting
  const updateSettingMutation = useMutation({
    mutationFn: ({ setting, value }: { setting: string; value: string }) =>
      updateNotificationSetting(setting, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      setEditingId(null);
    }
  });

  // Mutation for creating a prompt setting
  const createPromptMutation = useMutation({
    mutationFn: ({ name, value }: { name: string; value: string }) =>
      createPromptSetting(name, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      setNewPrompt({ name: '', value: '' });
    }
  });

  // Mutation for deleting a prompt setting
  const deletePromptMutation = useMutation({
    mutationFn: (setting: string) => deletePromptSetting(setting),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
    }
  });

  // Start editing a setting
  const startEditing = (id: number, value: string) => {
    setEditingId(id);
    setEditValue(value);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  // Handle update submit
  const handleUpdateSubmit = (setting: string) => {
    updateSettingMutation.mutate({ setting, value: editValue });
  };

  // Handle create new prompt
  const handleCreatePrompt = () => {
    if (!newPrompt.name || !newPrompt.value) {
      toast({ title: 'Name and value are required', variant: 'destructive' });
      return;
    }
    createPromptMutation.mutate(newPrompt);
  };

  if (isLoading) return <div className="p-6">Loading notification settings...</div>;

  // Separate settings
  const allowedAlertType = settings?.find(s => s.setting === 'allowed_alert_type');
  const promptSettings = settings?.filter(s => s.setting.startsWith('prompt_'));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>

      {/* Allowed Alert Types */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Allowed Alert Types</h2>
        <div className="flex items-center gap-4">
          {editingId === allowedAlertType?.id ? (
            <div className="flex items-center gap-2">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full max-w-md"
              />
              <Button size="sm" onClick={() => handleUpdateSubmit('allowed_alert_type')}>
                <Save size={16} className="mr-1" /> Save
              </Button>
              <Button variant="outline" size="sm" onClick={cancelEditing}>
                <X size={16} className="mr-1" /> Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="border rounded-md px-4 py-2 bg-muted">
                {allowedAlertType?.value || 'No alert types configured'}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => startEditing(allowedAlertType?.id!, allowedAlertType?.value || '')}
              >
                <Pencil size={16} className="mr-1" /> Modify
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Prompt Settings */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Prompt Settings</h2>
        
        {/* Table for existing prompts */}
        <Table className="mb-6">
          <TableHeader>
            <TableRow>
              <TableHead>Setting Name</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promptSettings?.map((setting) => (
              <TableRow key={setting.id}>
                <TableCell>{setting.setting.replace('prompt_', '')}</TableCell>
                <TableCell>
                  {editingId === setting.id ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full"
                    />
                  ) : (
                    setting.value
                  )}
                </TableCell>
                <TableCell className="flex gap-2">
                  {editingId === setting.id ? (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateSubmit(setting.setting)}
                      >
                        <Save size={16} />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={cancelEditing}
                      >
                        <X size={16} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => startEditing(setting.id, setting.value)}
                      >
                        <Pencil size={16} />
                      </Button>
                      {setting.setting !== 'prompt_default' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deletePromptMutation.mutate(setting.setting)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Form to add new prompt */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Add New Prompt</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input
                placeholder="Enter prompt name (e.g., notif_speed_alert)"
                value={newPrompt.name}
                onChange={(e) => setNewPrompt({...newPrompt, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Value</label>
              <Input
                placeholder="Enter prompt value"
                value={newPrompt.value}
                onChange={(e) => setNewPrompt({...newPrompt, value: e.target.value})}
              />
            </div>
            <Button onClick={handleCreatePrompt}>Add Custom Prompt</Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Note: The "prompt_default" setting is a built-in prompt and cannot be deleted.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationSetting;