import React, { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { 
  getWhatsappContacts, 
  getWhatsappChatHistory, 
  getWhatsappProfile,
  sendWhatsappMessage,
  getBotDisableStatus,
  updateBotDisableStatus
} from '@/services/api';

interface Contact {
  phone_number: string;
}

interface Message {
  role: string;
  content: string;
  timestamp?: number;
}

interface Profile {
  profile_image: string;
  contact_name: string;
  description: string;
}

const ChatPage = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [botDisabled, setBotDisabled] = useState(false);
  const [loadingBotStatus, setLoadingBotStatus] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoadingContacts(true);
        const data = await getWhatsappContacts();
        setContacts(data);
      } catch (error) {
        toast({
          title: 'Error loading contacts',
          description: (error as Error).message,
          variant: 'destructive'
        });
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, []);

  useEffect(() => {
    if (!selectedContact) return;

    const fetchChatData = async () => {
      try {
        setLoadingChat(true);
        setLoadingProfile(true);
        
        const [history, profileData] = await Promise.all([
          getWhatsappChatHistory(selectedContact),
          getWhatsappProfile(selectedContact)
        ]);
        
        setChatHistory(history);
        setProfile(profileData);
      } catch (error) {
        toast({
          title: 'Error loading chat data',
          description: (error as Error).message,
          variant: 'destructive'
        });
      } finally {
        setLoadingChat(false);
        setLoadingProfile(false);
      }
    };

    fetchChatData();
  }, [selectedContact]);

  useEffect(() => {
    if (!selectedContact) return;
    
    const fetchBotStatus = async () => {
      try {
        setLoadingBotStatus(true);
        const status = await getBotDisableStatus(selectedContact);
        setBotDisabled(status.disable_agent);
      } catch (error) {
        toast({
          title: 'Error loading bot status',
          description: (error as Error).message,
          variant: 'destructive'
        });
      } finally {
        setLoadingBotStatus(false);
      }
    };
    
    fetchBotStatus();
  }, [selectedContact]);

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    return format(new Date(timestamp * 1000), 'HH:mm, dd MMM yyyy', { locale: id });
  };

  const handleToggleBot = async () => {
    if (!selectedContact) return;
    
    try {
      setLoadingBotStatus(true);
      const newStatus = !botDisabled;
      await updateBotDisableStatus(selectedContact, newStatus);
      setBotDisabled(newStatus);
      toast({
        title: newStatus ? 'Bot disabled' : 'Bot enabled',
        description: `The bot has been ${newStatus ? 'deactivated' : 'activated'} for this contact`
      });
    } catch (error) {
      toast({
        title: 'Error updating bot status',
        description: (error as Error).message,
        variant: 'destructive'
      });
    } finally {
      setLoadingBotStatus(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedContact || !messageInput.trim()) return;
    
    try {
      await sendWhatsappMessage(selectedContact, messageInput);
      
      // Optimistically update chat history
      const newMessage: Message = {
        role: 'user',
        content: messageInput,
        timestamp: Math.floor(Date.now() / 1000)
      };
      setChatHistory(prev => [...prev, newMessage]);
      setMessageInput('');
      
      // Fetch latest chat history to ensure consistency
      const history = await getWhatsappChatHistory(selectedContact);
      setChatHistory(history);
    } catch (error) {
      toast({
        title: 'Error sending message',
        description: (error as Error).message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="flex h-full">
      {/* Contact List */}
      <div className="w-1/3 border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Chats</h2>
        </div>
        
        {loadingContacts ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-md" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No contacts found</div>
        ) : (
          <ul>
            {contacts.map((contact) => (
              <li key={contact.phone_number}>
                <button
                  className={`w-full text-left p-4 hover:bg-gray-100 transition ${
                    selectedContact === contact.phone_number ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedContact(contact.phone_number)}
                >
                  <div className="flex items-center">
                    <Avatar className="mr-3">
                      <AvatarFallback>
                        {contact.phone_number.slice(-2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">+{contact.phone_number}</div>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Chat Area */}
      <div className="w-2/3 flex flex-col h-full">
        {selectedContact ? (
          <>
            {/* Profile Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center">
                {loadingProfile ? (
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ) : profile ? (
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      {profile.profile_image ? (
                        <AvatarImage src={`${profile.profile_image}`} />
                      ) : (
                        <AvatarFallback>
                          {profile.contact_name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="font-bold">{profile.contact_name}</div>
                      <div className="text-sm text-gray-500">{profile.description}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-500">Failed to load profile</div>
                )}
              </div>
              
              <button
                onClick={handleToggleBot}
                disabled={loadingBotStatus}
                className={`px-4 py-2 rounded-lg ${
                  botDisabled 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                } ${loadingBotStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loadingBotStatus ? 'Loading...' : botDisabled ? 'Turn On Bot' : 'Turn Off Bot'}
              </button>
            </div>

            {/* Chat History */}
            <div className="h-[calc(100vh-200px)] overflow-y-auto p-4 bg-gray-50">
              {loadingChat ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-end">
                      <Skeleton className="h-16 w-64 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No messages found
                </div>
              ) : (
                chatHistory.map((item, index) => {
                  if (item.role === 'session') {
                    return (
                      <div key={`session-${index}`} className="my-6 flex items-center">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <div className="mx-4 text-xs text-gray-500 font-mono">
                          Session: {item.content}
                        </div>
                        <div className="flex-grow border-t border-gray-300"></div>
                      </div>
                    );
                  }
                  
                  return (
                    <div
                      key={index}
                      className={`mb-4 flex ${
                        item.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                          item.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border'
                        }`}
                      >
                        <div dangerouslySetInnerHTML={{
                          __html: item.content
                            .replace(/&/g, '&')
                            .replace(/</g, '<')
                            .replace(/>/g, '>')
                            .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
                            .replace(/_([^_]+)_/g, '<em>$1</em>')
                            .replace(/`([^`]+)`/g, '<code>$1</code>')
                            .replace(/\n/g, '<br />')
                        }} />
                        {item.timestamp && (
                          <div
                            className={`text-xs mt-1 ${
                              item.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {formatTimestamp(item.timestamp)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t flex items-center">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="bg-blue-500 text-white px-6 py-3 rounded-r-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a contact to view chat history
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;