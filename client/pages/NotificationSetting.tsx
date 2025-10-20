import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Pencil, Save, X } from 'lucide-react';
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

import {
  fetchNotificationSettings,
  updateNotificationSetting,
  createPromptSetting,
  deletePromptSetting
} from '@/services/notificationSettings';
import type { NotificationSetting } from '@/services/notificationSettings';
import { sendDummyNotification } from '@/services/notificationSettings';

const NotificationSetting = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newPrompt, setNewPrompt] = useState({ name: '', value: '' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<string | null>(null);
  const [modifyConfirmOpen, setModifyConfirmOpen] = useState(false);
  const [settingToModify, setSettingToModify] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [alertType, setAlertType] = useState('');
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

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
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update setting"
      });
    }
  });

  // Mutation for creating a prompt setting
  const createPromptMutation = useMutation({
    mutationFn: ({ name, value }: { name: string; value: string }) =>
      createPromptSetting(name, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      setNewPrompt({ name: '', value: '' });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Create Failed",
        description: "Failed to create new prompt"
      });
    }
  });

  // Mutation for deleting a prompt setting
  const deletePromptMutation = useMutation({
    mutationFn: (setting: string) => deletePromptSetting(setting),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      toast({
        title: "Success",
        description: "Prompt setting deleted"
      });
    },
    // onSuccess: () => {
    // },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete prompt setting"
      });
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
    setSettingToModify(setting);
    setModifyConfirmOpen(true);
  };

  // Handle create new prompt
  const handleCreatePrompt = () => {
    if (!newPrompt.name || !newPrompt.value) {
      toast({ title: 'Name and value are required', variant: 'destructive' });
      return;
    }
    toast({
      title: "Success",
      description: "New prompt setting created"
    });
    createPromptMutation.mutate(newPrompt);
  };

  if (isLoading) return <div className="p-6">Loading notification settings...</div>;

  // Separate settings
  const allowedAlertType = settings?.find(s => s.setting === 'allowed_alert_type');
  const promptSettings = settings?.filter(s => s.setting.startsWith('prompt_'));

  return (
    <>
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
                  onClick={() => {
                    startEditing(allowedAlertType?.id!, allowedAlertType?.value || '');
                    setSettingToModify('allowed_alert_type');
                  }}
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
                          onClick={() => {
                            startEditing(setting.id, setting.value);
                            setSettingToModify(setting.setting);
                          }}
                        >
                          <Pencil size={16} />
                        </Button>
                        {setting.setting !== 'prompt_default' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSettingToDelete(setting.setting);
                              setDeleteConfirmOpen(true);
                            }}
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

      {/* Dummy Notification Section */}
      <div className="p-6 border-t mt-8">
        <h2 className="text-xl font-semibold mb-4">Dummy Notification</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-sm font-medium mb-1 block">Phone Number</label>
            <Input
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Alert Type</label>
            <Input
              placeholder="Enter alert type"
              value={alertType}
              onChange={(e) => setAlertType(e.target.value)}
            />
          </div>
          <Button
            onClick={() => setSendDialogOpen(true)}
            disabled={!phoneNumber || !alertType}
          >
            Send Notification
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prompt setting? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (settingToDelete) {
                  deletePromptMutation.mutate(settingToDelete);
                }
                setDeleteConfirmOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={modifyConfirmOpen} onOpenChange={setModifyConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Modification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update this setting?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (settingToModify) {
                  updateSettingMutation.mutate({ setting: settingToModify, value: editValue });
                  toast({
                    title: "Success",
                    description: "Setting updated successfully"
                  });
                }
                setModifyConfirmOpen(false);
              }}
            >
              Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dummy Notification Confirmation Dialog */}
      <AlertDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Send</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send a dummy notification to {phoneNumber} with alert type {alertType}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                sendDummyNotification({ to: phoneNumber, alert_type: alertType })
                  .then(() => {
                    toast({
                      title: "Success",
                      description: "Dummy notification sent successfully"
                    });
                    setPhoneNumber('');
                    setAlertType('');
                  })
                  .catch(() => {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: "Failed to send dummy notification"
                    });
                  });
              }}
            >
              Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default NotificationSetting;