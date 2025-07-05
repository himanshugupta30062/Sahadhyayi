export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  isMe: boolean;
}

export interface ChatConversation {
  id: string;
  name: string;
  avatar?: string;
  isGroup: boolean;
  lastMessage: string;
  unreadCount: number;
  isOnline?: boolean;
  messages: ChatMessage[];
}

export const sampleConversations: ChatConversation[] = [
  {
    id: '1',
    name: 'Alice Reader',
    isGroup: false,
    lastMessage: 'Have you read The Great Gatsby?',
    unreadCount: 2,
    isOnline: true,
    messages: [
      {
        id: '1',
        sender: 'Alice Reader',
        message: 'Hey! How are you doing?',
        timestamp: '10:30 AM',
        isMe: false,
      },
      {
        id: '2',
        sender: 'You',
        message: 'Great! Just finished reading Atomic Habits',
        timestamp: '10:32 AM',
        isMe: true,
      },
      {
        id: '3',
        sender: 'Alice Reader',
        message: 'Have you read The Great Gatsby?',
        timestamp: '10:35 AM',
        isMe: false,
      },
    ],
  },
  {
    id: '2',
    name: 'Classic Literature Club',
    isGroup: true,
    lastMessage: 'Sarah: What did everyone think of chapter 5?',
    unreadCount: 5,
    messages: [
      {
        id: '1',
        sender: 'Mike Johnson',
        message: 'The symbolism in this chapter is incredible',
        timestamp: '9:15 AM',
        isMe: false,
      },
      {
        id: '2',
        sender: 'Sarah Wilson',
        message: 'What did everyone think of chapter 5?',
        timestamp: '9:45 AM',
        isMe: false,
      },
    ],
  },
  {
    id: '3',
    name: 'Bob Bookworm',
    isGroup: false,
    lastMessage: 'Thanks for the book recommendation!',
    unreadCount: 0,
    isOnline: false,
    messages: [
      {
        id: '1',
        sender: 'Bob Bookworm',
        message: 'Thanks for the book recommendation!',
        timestamp: 'Yesterday',
        isMe: false,
      },
    ],
  },
];
