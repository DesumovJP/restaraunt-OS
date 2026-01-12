"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Construction,
  Send,
  Users,
  Hash,
  Megaphone,
  ChefHat,
  Wine,
  UtensilsCrossed,
  Circle,
  Smile,
  Paperclip,
  Search,
  AtSign,
  ImageIcon,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
type ChatView = { type: "channel"; id: string } | { type: "dm"; odId: string };

// Mock data for demonstration
const MOCK_CHANNELS = [
  { id: "announcements", name: "Оголошення", icon: Megaphone, unread: 0, description: "Важливі новини" },
  { id: "general", name: "Загальний", icon: Hash, unread: 3, description: "Спілкування команди" },
  { id: "kitchen", name: "Кухня", icon: ChefHat, unread: 0, description: "Кухонний персонал" },
  { id: "service", name: "Зал", icon: UtensilsCrossed, unread: 1, description: "Офіціанти та хостес" },
  { id: "bar", name: "Бар", icon: Wine, unread: 0, description: "Барна команда" },
];

const MOCK_USERS = [
  { id: "1", name: "Віктор Шевченко", shortName: "Віктор Ш.", role: "chef", status: "online", initials: "ВШ", dmUnread: 0 },
  { id: "2", name: "Ірина Мельник", shortName: "Ірина М.", role: "waiter", status: "online", initials: "ІМ", dmUnread: 2 },
  { id: "3", name: "Максим Романенко", shortName: "Максим Р.", role: "bartender", status: "online", initials: "МР", dmUnread: 0 },
  { id: "4", name: "Олена Савченко", shortName: "Олена С.", role: "cook", status: "away", initials: "ОС", dmUnread: 0 },
  { id: "5", name: "Андрій Бондаренко", shortName: "Андрій Б.", role: "cook", status: "offline", initials: "АБ", dmUnread: 0 },
];

const MOCK_CHANNEL_MESSAGES = [
  {
    id: "1",
    channelId: "general",
    author: { id: "1", name: "Віктор Шевченко", role: "chef", initials: "ВШ" },
    content: "Доброго ранку всім! Сьогодні очікуємо велике замовлення на 18:00, будьте готові.",
    timestamp: "09:15",
    reactions: [{ emoji: "👍", count: 3 }],
  },
  {
    id: "2",
    channelId: "general",
    author: { id: "2", name: "Ірина Мельник", role: "waiter", initials: "ІМ" },
    content: "Дякую за інформацію! Скільки гостей очікується?",
    timestamp: "09:18",
    reactions: [],
  },
  {
    id: "3",
    channelId: "general",
    author: { id: "1", name: "Віктор Шевченко", role: "chef", initials: "ВШ" },
    content: "Близько 25 осіб, банкет на день народження. Меню вже узгоджене - класичне святкове.",
    timestamp: "09:20",
    reactions: [],
  },
  {
    id: "4",
    channelId: "general",
    author: { id: "3", name: "Максим Романенко", role: "bartender", initials: "МР" },
    content: "Підготую коктейльну карту для заходу. Є якісь побажання по напоях?",
    timestamp: "09:25",
    reactions: [{ emoji: "🍸", count: 1 }],
  },
  {
    id: "5",
    channelId: "general",
    author: { id: "4", name: "Олена Савченко", role: "cook", initials: "ОС" },
    content: "Треба перевірити запаси на складі перед банкетом. Хтось може допомогти з інвентаризацією?",
    timestamp: "09:30",
    reactions: [],
  },
  {
    id: "6",
    channelId: "general",
    author: { id: "2", name: "Ірина Мельник", role: "waiter", initials: "ІМ" },
    content: "Я можу допомогти після 11:00, якщо підійде.",
    timestamp: "09:32",
    reactions: [{ emoji: "❤️", count: 1 }],
  },
];

const MOCK_DM_MESSAGES: Record<string, Array<{
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}>> = {
  "2": [
    { id: "dm1", senderId: "2", content: "Привіт! Можеш підмінити мене на годину?", timestamp: "10:15" },
    { id: "dm2", senderId: "me", content: "Привіт, звісно. О котрій?", timestamp: "10:18" },
    { id: "dm3", senderId: "2", content: "З 14:00 до 15:00, треба відлучитись", timestamp: "10:20" },
    { id: "dm4", senderId: "me", content: "Добре, без проблем 👍", timestamp: "10:21" },
  ],
  "1": [
    { id: "dm5", senderId: "1", content: "Перевір будь ласка наявність лосося на складі", timestamp: "08:45" },
    { id: "dm6", senderId: "me", content: "Зараз гляну", timestamp: "08:47" },
  ],
};

const ROLE_COLORS: Record<string, string> = {
  chef: "bg-red-500",
  cook: "bg-orange-500",
  waiter: "bg-blue-500",
  bartender: "bg-purple-500",
  host: "bg-pink-500",
  manager: "bg-indigo-500",
};

const ROLE_LABELS: Record<string, string> = {
  chef: "Шеф-кухар",
  cook: "Кухар",
  waiter: "Офіціант",
  bartender: "Бармен",
  host: "Хостес",
  manager: "Менеджер",
};

const STATUS_COLORS: Record<string, string> = {
  online: "text-green-500",
  away: "text-amber-500",
  offline: "text-gray-300",
};

export function WorkersChat() {
  const [chatView, setChatView] = React.useState<ChatView>({ type: "channel", id: "general" });
  const [message, setMessage] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const activeChannel = chatView.type === "channel"
    ? MOCK_CHANNELS.find((c) => c.id === chatView.id)
    : null;

  const activeDmUser = chatView.type === "dm"
    ? MOCK_USERS.find((u) => u.id === chatView.odId)
    : null;

  const channelMessages = chatView.type === "channel"
    ? MOCK_CHANNEL_MESSAGES.filter((m) => m.channelId === chatView.id)
    : [];

  const dmMessages = chatView.type === "dm"
    ? MOCK_DM_MESSAGES[chatView.odId] || []
    : [];

  const onlineCount = MOCK_USERS.filter(u => u.status === "online").length;

  const openDm = (userId: string) => {
    setChatView({ type: "dm", odId: userId });
  };

  const openChannel = (channelId: string) => {
    setChatView({ type: "channel", id: channelId });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] min-h-[500px]">
      {/* "В розробці" Banner - compact */}
      <div className="flex justify-center py-2 bg-amber-50/50 border-b border-amber-100">
        <div className="inline-flex items-center gap-2 text-amber-700">
          <Construction className="w-4 h-4" />
          <span className="text-sm font-medium">Чат в розробці</span>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex flex-1 overflow-hidden border-x border-b rounded-b-xl bg-background">
        {/* Channels Sidebar */}
        <div className="w-60 border-r flex flex-col bg-muted/10">
          {/* Channels Header */}
          <div className="p-3 border-b">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Командний чат
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {onlineCount} з {MOCK_USERS.length} онлайн
            </p>
          </div>

          {/* Channels List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <p className="px-2 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Канали
              </p>
              <div className="space-y-0.5">
                {MOCK_CHANNELS.map((channel) => {
                  const Icon = channel.icon;
                  const isActive = chatView.type === "channel" && chatView.id === channel.id;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => openChannel(channel.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all group",
                        isActive
                          ? "bg-foreground/10 font-medium"
                          : "hover:bg-foreground/5 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4 flex-shrink-0 transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      <span className="truncate flex-1 text-left">{channel.name}</span>
                      {channel.unread > 0 && (
                        <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {channel.unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Team Members */}
              <p className="px-2 py-2 mt-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Особисті повідомлення</span>
              </p>
              <div className="space-y-0.5">
                {MOCK_USERS.map((user) => {
                  const isActive = chatView.type === "dm" && chatView.odId === user.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => openDm(user.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors",
                        isActive
                          ? "bg-foreground/10"
                          : "hover:bg-foreground/5"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white",
                          ROLE_COLORS[user.role] || "bg-gray-500"
                        )}>
                          {user.initials}
                        </div>
                        <Circle
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 fill-current stroke-background stroke-2",
                            STATUS_COLORS[user.status]
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className={cn(
                          "text-xs truncate",
                          user.status === "offline" ? "text-muted-foreground" : "text-foreground"
                        )}>
                          {user.shortName}
                        </p>
                      </div>
                      {user.dmUnread > 0 && (
                        <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {user.dmUnread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center justify-between bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {chatView.type === "channel" && activeChannel && (
                <>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted">
                    <activeChannel.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{activeChannel.name}</h2>
                    <p className="text-xs text-muted-foreground">{activeChannel.description}</p>
                  </div>
                </>
              )}
              {chatView.type === "dm" && activeDmUser && (
                <>
                  <div className="relative">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white",
                      ROLE_COLORS[activeDmUser.role] || "bg-gray-500"
                    )}>
                      {activeDmUser.initials}
                    </div>
                    <Circle
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-current stroke-background stroke-2",
                        STATUS_COLORS[activeDmUser.status]
                      )}
                    />
                  </div>
                  <div>
                    <h2 className="font-semibold">{activeDmUser.name}</h2>
                    <p className="text-xs text-muted-foreground">{ROLE_LABELS[activeDmUser.role]}</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Пошук..."
                  className="pl-8 h-8 w-40 text-sm"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-1 max-w-3xl mx-auto">
              {/* Date separator */}
              <div className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] text-muted-foreground font-medium px-2 py-1 bg-muted/50 rounded-full">
                  Сьогодні
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Channel Messages */}
              {chatView.type === "channel" && channelMessages.map((msg, index) => {
                const prevMsg = channelMessages[index - 1];
                const isSameAuthor = prevMsg?.author.id === msg.author.id;
                const showAvatar = !isSameAuthor;

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "group flex gap-3 hover:bg-muted/40 -mx-3 px-3 py-1 rounded-lg transition-colors",
                      showAvatar && "mt-3 pt-2"
                    )}
                  >
                    {showAvatar ? (
                      <Avatar className="h-9 w-9 flex-shrink-0 mt-0.5">
                        <AvatarFallback
                          className={cn(
                            "text-xs font-semibold text-white",
                            ROLE_COLORS[msg.author.role] || "bg-gray-500"
                          )}
                        >
                          {msg.author.initials}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-9 flex-shrink-0 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {msg.timestamp}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {showAvatar && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span
                            className="font-semibold text-sm hover:underline cursor-pointer"
                            onClick={() => openDm(msg.author.id)}
                          >
                            {msg.author.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {msg.timestamp}
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        {msg.content}
                      </p>
                      {msg.reactions.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {msg.reactions.map((reaction, i) => (
                            <button
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/60 hover:bg-muted rounded-full text-xs transition-colors"
                              disabled
                            >
                              <span>{reaction.emoji}</span>
                              <span className="text-muted-foreground">{reaction.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* DM Messages */}
              {chatView.type === "dm" && dmMessages.map((msg, index) => {
                const isMe = msg.senderId === "me";
                const sender = isMe ? null : MOCK_USERS.find(u => u.id === msg.senderId);
                const prevMsg = dmMessages[index - 1];
                const isSameSender = prevMsg?.senderId === msg.senderId;
                const showAvatar = !isSameSender;

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "group flex gap-3 hover:bg-muted/40 -mx-3 px-3 py-1 rounded-lg transition-colors",
                      showAvatar && "mt-3 pt-2"
                    )}
                  >
                    {showAvatar ? (
                      <Avatar className="h-9 w-9 flex-shrink-0 mt-0.5">
                        <AvatarFallback
                          className={cn(
                            "text-xs font-semibold text-white",
                            isMe ? "bg-blue-600" : ROLE_COLORS[sender?.role || ""] || "bg-gray-500"
                          )}
                        >
                          {isMe ? "Я" : sender?.initials}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-9 flex-shrink-0 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {msg.timestamp}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {showAvatar && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="font-semibold text-sm">
                            {isMe ? "Ви" : sender?.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {msg.timestamp}
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                );
              })}

              {chatView.type === "dm" && dmMessages.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Почніть розмову з {activeDmUser?.name}
                  </p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 border-t bg-background">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-2 bg-muted/40 rounded-xl px-3 py-2 border border-transparent focus-within:border-border focus-within:bg-background transition-all">
                <div className="flex gap-1 pb-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg" disabled>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg" disabled>
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 min-w-0">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      chatView.type === "channel"
                        ? `Написати в #${activeChannel?.name.toLowerCase()}...`
                        : `Написати ${activeDmUser?.shortName}...`
                    }
                    className="border-0 bg-transparent focus-visible:ring-0 px-0 h-9 text-sm"
                    disabled
                  />
                </div>
                <div className="flex gap-1 pb-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg" disabled>
                    <AtSign className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg" disabled>
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button size="icon" className="h-8 w-8 rounded-lg" disabled>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
