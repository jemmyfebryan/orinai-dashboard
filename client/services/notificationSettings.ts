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
// Define the expected response structure from the GET request
interface PhoneToLidResponse {
  lid_number: string;
}

// Define the payload structure for the final POST request
interface DummyNotificationPayload {
  to: string; // This will be the lid_number
  alert_type: string;
  number_type: 'lid';
}

export const sendDummyNotification = async (data: { to: string; alert_type: string }): Promise<void> => {
  const { to: phoneNumber, alert_type } = data; // Destructure and rename 'to' to 'phoneNumber'

  try {
    // ## 1. Fetch the lid_number
    // Perform a GET request to resolve the phone number to an LID
    const lidResponse = await fetch(`/whatsapp/phone_to_lid/${phoneNumber}`);
    
    if (!lidResponse.ok) {
      // Throw an error if the phone-to-LID resolution fails
      throw new Error(`Failed to get LID for phone number: ${phoneNumber}`);
    }
    
    const lidData: PhoneToLidResponse = await lidResponse.json();
    const lidNumber = lidData.lid_number;

    // ## 2. Prepare the new POST body
    const postBody: DummyNotificationPayload = {
      to: lidNumber, // Use the fetched lid_number
      alert_type: alert_type,
      number_type: 'lid', // Add the new number_type key
    };

    // ## 3. Send the dummy notification with the new payload
    const response = await fetch('/whatsapp/dummy_notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postBody), // Use the new postBody
    });

    if (!response.ok) {
      // Throw an error if sending the notification fails
      throw new Error('Failed to send dummy notification');
    }
    
  } catch (error) {
    // Catch any error from either the GET or POST requests
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    toast({ 
      title: 'Error sending dummy notification', 
      description: errorMessage, 
      variant: 'destructive' 
    });
    
    // Re-throw the error for upstream handling
    throw error;
  }
};