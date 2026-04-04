import { useEffect, useState, useRef } from "react";
import { getContacts, getChatHistory, toggleHumanTakeover } from "@/services/siorinApi";
import type { ContactItem, ChatMessageItem } from "@/types/siorin";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  MessageSquare,
  Search,
  RefreshCw,
  User,
  MapPin,
  Car,
  Package,
  Loader2,
  Bot,
} from "lucide-react";

export default function SiorinChatHistory() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactItem[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [togglingContactId, setTogglingContactId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load contacts on component mount
  useEffect(() => {
    loadContacts();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadContacts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Filter contacts based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = contacts.filter(
        (contact) =>
          (contact.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          contact.phone_number.includes(searchTerm) ||
          (contact.domicile?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchTerm, contacts]);

  // Load messages when contact is selected
  useEffect(() => {
    if (selectedContact) {
      loadChatHistory(selectedContact.id);
    } else {
      setMessages([]);
    }
  }, [selectedContact]);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadContacts = async () => {
    try {
      setContactsLoading(true);
      setError(null);
      const data = await getContacts();
      setContacts(data);
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      toast.error(`Failed to load contacts: ${message}`);
    } finally {
      setContactsLoading(false);
    }
  };

  const loadChatHistory = async (customerId: number) => {
    try {
      setMessagesLoading(true);
      setError(null);
      const data = await getChatHistory(customerId);
      setMessages(data);
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      toast.error(`Failed to load chat history: ${message}`);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleToggleHumanTakeover = async (customerId: number) => {
    try {
      setTogglingContactId(customerId);
      const result = await toggleHumanTakeover(customerId);

      // Update local state
      setContacts((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? { ...c, human_takeover: result.human_takeover }
            : c
        )
      );

      // Update selected contact if it's the same one
      if (selectedContact?.id === customerId) {
        setSelectedContact((prev) =>
          prev ? { ...prev, human_takeover: result.human_takeover } : null
        );
      }

      toast.success(result.message);
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      toast.error(`Failed to toggle human takeover: ${message}`);
    } finally {
      setTogglingContactId(null);
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "No messages yet";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDisplayName = (contact: ContactItem): string => {
    return contact.name || contact.phone_number || "Unknown";
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Error Banner */}
      {error && (
        <div className="fixed top-20 right-4 z-50 max-w-md rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex items-start justify-between gap-2">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-destructive"
              onClick={() => setError(null)}
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Contacts Sidebar */}
      <Card className="w-80 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Contacts
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadContacts}
              disabled={contactsLoading}
            >
              <RefreshCw className={`h-4 w-4 ${contactsLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {filteredContacts.length} of {contacts.length} contacts
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {contactsLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="p-3 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {searchTerm ? "No contacts found" : "No contacts yet"}
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors relative ${
                    selectedContact?.id === contact.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {getDisplayName(contact)}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs opacity-80">
                        {contact.vehicle && (
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {contact.vehicle}
                          </span>
                        )}
                        {contact.unit_qty !== null && (
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {contact.unit_qty}
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-1 opacity-60 truncate">
                        {formatDate(contact.last_message_time)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 px-2 shrink-0 ${
                        contact.human_takeover
                          ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleHumanTakeover(contact.id);
                      }}
                      disabled={togglingContactId === contact.id}
                      title={contact.human_takeover ? "Disable human takeover" : "Enable human takeover"}
                    >
                      {togglingContactId === contact.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : contact.human_takeover ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <Bot className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Messages Area */}
      <Card className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">
                      {getDisplayName(selectedContact)}
                    </h3>
                    <Badge
                      variant="outline"
                      className={selectedContact.human_takeover ? "bg-orange-50 text-orange-700 border-orange-300" : ""}
                    >
                      {selectedContact.human_takeover ? (
                        <>
                          <User className="h-3 w-3 mr-1" />
                          Human Mode
                        </>
                      ) : (
                        <>
                          <Bot className="h-3 w-3 mr-1" />
                          AI Mode
                        </>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {selectedContact.phone_number}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {messages.length} messages
                  </Badge>
                  <Button
                    variant={selectedContact.human_takeover ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleHumanTakeover(selectedContact.id)}
                    disabled={togglingContactId === selectedContact.id}
                    className={selectedContact.human_takeover ? "bg-orange-600 hover:bg-orange-700" : ""}
                  >
                    {togglingContactId === selectedContact.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : selectedContact.human_takeover ? (
                      <>
                        <User className="h-4 w-4 mr-2" />
                        Switch to AI
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4 mr-2" />
                        Switch to Human
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                {selectedContact.domicile && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedContact.domicile}
                  </span>
                )}
                {selectedContact.vehicle && (
                  <span className="flex items-center gap-1">
                    <Car className="h-4 w-4" />
                    {selectedContact.vehicle}
                  </span>
                )}
                {selectedContact.unit_qty !== null && (
                  <span className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {selectedContact.unit_qty} unit{selectedContact.unit_qty !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Messages List */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messagesLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-16 w-3/4" />
                      </div>
                    </div>
                  ))
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No messages yet</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            message.role === "user"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatMessageTime(message.timestamp)}
                        </p>
                      </div>
                      {message.role === "user" && (
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a contact</p>
              <p className="text-sm">Choose a contact from the sidebar to view their chat history</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
