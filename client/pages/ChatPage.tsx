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
  user_name: string;
  last_activity: string;
}

interface Message {
  role: string;
  content: string;
  timestamp?: number;
}

interface Profile {
  profile_image: string;
  contact_name: string;
  push_name: string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactList, setShowContactList] = useState(true);
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
    return format(new Date(timestamp * 1000), 'HH:mm', { locale: id });
  };

  // Check if content is a base64 encoded image
  const isBase64Image = (content: string): boolean => {
    // Check if content looks like base64 image data
    // Common image magic numbers in base64:
    // /9j/ = JPEG
    // iVBORw0KGgo = PNG
    // R0lGODlh = GIF
    // Qk0 = BMP
    // UklGR = WebP
    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent.length < 10) return false;

    // Check for common image magic numbers
    const imageMagicNumbers = ['/9j/', 'iVBORw0KGgo', 'R0lGODlh', 'Qk0', 'UklGR'];
    return imageMagicNumbers.some(magic => trimmedContent.startsWith(magic));
  };

  // Get image MIME type from base64 content
  const getImageMimeType = (content: string): string => {
    const trimmedContent = content.trim();
    if (trimmedContent.startsWith('/9j/')) return 'image/jpeg';
    if (trimmedContent.startsWith('iVBORw0KGgo')) return 'image/png';
    if (trimmedContent.startsWith('R0lGODlh')) return 'image/gif';
    if (trimmedContent.startsWith('Qk0')) return 'image/bmp';
    if (trimmedContent.startsWith('UklGR')) return 'image/webp';
    return 'image/jpeg'; // default to jpeg
  };

  const renderMessageContent = (item: Message) => {
    if (isBase64Image(item.content)) {
      // It's a base64 image, render as img tag
      const mimeType = getImageMimeType(item.content);
      return (
        <img
          src={`data:${mimeType};base64,${item.content}`}
          alt="Shared image"
          className="max-w-full h-auto rounded-lg"
          loading="lazy"
        />
      );
    }

    // It's text, render with markdown-like formatting
    return (
      <div
        className="text-sm leading-relaxed whitespace-pre-wrap"
        dangerouslySetInnerHTML={{
          __html: item.content
            .replace(/&/g, '&')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
            .replace(/_([^_]+)_/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code class="bg-black/20 px-1 rounded">$1</code>')
            .replace(/\n/g, '<br />')
        }}
      />
    );
  };

  const handleContactSelect = (phoneNumber: string) => {
    setSelectedContact(phoneNumber);
    setShowContactList(false);
  };

  const handleBackToContacts = () => {
    setShowContactList(true);
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
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Contact List */}
      <div className={`w-full md:w-[400px] min-w-0 border-r border-gray-200 flex flex-col h-full bg-white flex-shrink-0 ${!showContactList && selectedContact ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Chats</h2>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-white">
          <div className="relative">
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {loadingContacts ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No contacts found</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {contacts
                .filter((contact) => {
                  const query = searchQuery.toLowerCase();
                  return (
                    contact.user_name?.toLowerCase().includes(query) ||
                    contact.phone_number.includes(query)
                  );
                })
                .map((contact) => (
                  <li key={contact.phone_number}>
                    <button
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                        selectedContact === contact.phone_number ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleContactSelect(contact.phone_number)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-medium">
                            {contact.user_name?.charAt(0)?.toUpperCase() || contact.phone_number.slice(-2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{contact.user_name}</div>
                          <div className="text-xs text-gray-500 truncate">+{contact.phone_number}</div>
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                          {contact.last_activity}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              {contacts.filter((contact) => {
                const query = searchQuery.toLowerCase();
                return (
                  contact.user_name?.toLowerCase().includes(query) ||
                  contact.phone_number.includes(query)
                );
              }).length === 0 && searchQuery !== '' && (
                <li className="p-8 text-center text-gray-500 text-sm">No contacts match your search</li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col h-full bg-[#efeae2] min-w-0 overflow-hidden ${showContactList && !selectedContact ? 'hidden md:flex' : 'flex'}`}>
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="px-3 py-2 md:px-4 md:py-3 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center">
                {/* Back Button - Mobile Only */}
                <button
                  onClick={handleBackToContacts}
                  className="md:hidden mr-2 p-1 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {loadingProfile ? (
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <Skeleton className="h-9 w-9 md:h-10 md:w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 md:w-32 mb-1" />
                      <Skeleton className="h-3 w-32 md:w-48" />
                    </div>
                  </div>
                ) : profile ? (
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <Avatar className="h-9 w-9 md:h-10 md:w-10">
                      {profile.profile_image ? (
                        <AvatarImage src={`${profile.profile_image}`} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-medium">
                          {profile.push_name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 text-sm md:text-base truncate">{profile.push_name}</div>
                      <div className="text-xs text-gray-500 truncate hidden sm:block">{profile.description}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-500 text-sm">Failed to load profile</div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleBot}
                  disabled={loadingBotStatus}
                  className={`px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                    botDisabled
                      ? 'bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow'
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow'
                  } ${loadingBotStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loadingBotStatus ? '...' : botDisabled ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-2 md:px-4 py-2 md:py-4 overflow-x-hidden">
              {loadingChat ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-end">
                      <Skeleton className="h-16 w-48 md:w-64 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-500 px-4">
                    <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs text-gray-400 mt-1">Start a conversation</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {chatHistory.map((item, index) => {
                    if (item.role === 'session') {
                      return (
                        <div key={`session-${index}`} className="my-6 md:my-8 flex items-center">
                          <div className="flex-grow border-t border-gray-300"></div>
                          <div className="mx-2 md:mx-4 text-xs text-gray-500 font-medium bg-white px-2 md:px-3 py-1 rounded-full shadow-sm">
                            {item.content}
                          </div>
                          <div className="flex-grow border-t border-gray-300"></div>
                        </div>
                      );
                    }

                    const isUser = item.role === 'user';

                    return (
                      <div
                        key={index}
                        className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[85%] md:max-w-[65%] rounded-lg shadow-sm px-2.5 md:px-3 py-2 break-words overflow-wrap-anywhere ${
                            isUser
                              ? 'bg-white text-gray-900 rounded-tl-none'
                              : 'bg-blue-500 text-white rounded-tr-none'
                          }`}
                        >
                          {renderMessageContent(item)}
                          <div
                            className={`text-[10px] mt-1 text-right ${
                              isUser ? 'text-gray-400' : 'text-blue-100'
                            }`}
                          >
                            {formatTimestamp(item.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="px-2 md:px-4 py-2 md:py-3 bg-white border-t border-gray-200">
              <div className="flex items-center gap-2">
                <button className="hidden md:block p-2 text-gray-400 hover:text-gray-600 transition">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message"
                    className="w-full bg-gray-100 rounded-lg py-2 md:py-2.5 px-3 md:px-4 pr-10 md:pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className={`p-2 md:p-2.5 rounded-lg transition-all ${
                    messageInput.trim()
                      ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center bg-[#efeae2] hidden md:flex">
            <div className="text-center text-gray-500 px-4">
              <svg className="mx-auto h-20 w-20 md:h-24 md:w-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-base md:text-lg font-medium text-gray-700 mb-1">OrinAI Web</h3>
              <p className="text-sm text-gray-500">Select a contact to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
