import { toast } from "@/components/ui/use-toast";

export type NotificationSetting = {
  id: number;
  setting: string;
  value: string;
};

// Fetch all notification settings
export const fetchNotificationSettings = async (): Promise<NotificationSetting[]> => {
  try {
    const response = await fetch('/notification_setting');
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  } catch (error) {
    toast({ title: 'Error fetching settings', description: error.message, variant: 'destructive' });
    throw error;
  }
};

// Update a notification setting
export const updateNotificationSetting = async (setting: string, value: string): Promise<void> => {
  try {
    const response = await fetch(`/notification_setting/${setting}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    });
    if (!response.ok) throw new Error('Failed to update setting');
  } catch (error) {
    toast({ title: 'Error updating setting', description: error.message, variant: 'destructive' });
    throw error;
  }
};

// Create a new prompt setting
export const createPromptSetting = async (name: string, value: string): Promise<void> => {
  try {
    const response = await fetch('/notification_setting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setting: `prompt_${name}`, value })
    });
    if (!response.ok) throw new Error('Failed to create prompt');
  } catch (error) {
    toast({ title: 'Error creating prompt', description: error.message, variant: 'destructive' });
    throw error;
  }
};

// Delete a prompt setting
export const deletePromptSetting = async (setting: string): Promise<void> => {
  try {
    const response = await fetch(`/notification_setting/${setting}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete prompt');
  } catch (error) {
    toast({ title: 'Error deleting prompt', description: error.message, variant: 'destructive' });
    throw error;
  }
};

// Send dummy notification
export const sendDummyNotification = async (data: { to: string; alert_type: string }): Promise<void> => {
  try {
    const response = await fetch('/whatsapp/dummy_notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to send dummy notification');
  } catch (error) {
    toast({ title: 'Error sending dummy notification', description: error.message, variant: 'destructive' });
    throw error;
  }
};