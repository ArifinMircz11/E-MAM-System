export interface AppUser {
  idUnik: string;
  uid: string; // auth uid
  displayName: string;
  role: string;
  photoURL?: string;
}

export interface Chat {
  id: string; // Combined sorted idUniks
  participants: string[];
  participantDetails: Record<
    string,
    { displayName: string; photoURL?: string; role: string; unreadCount?: number; authUid?: string }
  >;
  lastMessage: string;
  lastMessageTimestamp: any;
  updatedAt: any;
}

export interface Message {
  id: string;
  senderId: string; // idUnik
  text: string;
  createdAt: any;
  status?: 'sent' | 'delivered' | 'read';
}

export interface MessagesProps {
  onBack: () => void;
  userRole: any; // UserRole from '@/types'
  onChatSelect?: (chat: Chat | null) => void;
  onOpenSidebar?: () => void;
}
