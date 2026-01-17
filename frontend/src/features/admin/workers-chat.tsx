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
  const [chatView, setChatView] = React.useState<ChatView | null>(null); // null = show list on mobile
  const [message, setMessage] = React.useState("");
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Detect screen size and handle responsive behavior
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true); // Auto-open на tablet/desktop
        // On desktop, default to general channel
        if (!chatView) {
          setChatView({ type: "channel", id: "general" });
        }
      } else {
        setIsSidebarOpen(false); // Auto-close на mobile
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [chatView]);

  const activeChannel = chatView?.type === "channel"
    ? MOCK_CHANNELS.find((c) => c.id === chatView.id)
    : null;

  const activeDmUser = chatView?.type === "dm"
    ? MOCK_USERS.find((u) => u.id === chatView.odId)
    : null;

  const channelMessages = chatView?.type === "channel"
    ? MOCK_CHANNEL_MESSAGES.filter((m) => m.channelId === chatView.id)
    : [];

  const dmMessages = chatView?.type === "dm"
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
    <div className={cn(
      "flex flex-col min-h-[500px]",
      "h-[calc(100vh-64px)] md:h-[calc(100vh-120px)]"
    )}>
      {/* "В розробці" Banner - compact */}
      <div className="flex justify-center py-2 bg-amber-50/50 border-b border-amber-100">
        <div className="inline-flex items-center gap-2 text-amber-700">
          <Construction className="w-4 h-4" />
          <span className="text-sm font-medium">Чат в розробці</span>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex flex-1 overflow-hidden border-x border-b rounded-b-xl bg-background relative">
        {/* Mobile Drawer Backdrop */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Channels Sidebar / Drawer */}
        <aside className={cn(
          "border-r flex flex-col bg-white transition-transform duration-300 ease-out",
          "fixed inset-y-0 left-0 z-50 md:relative",
          "w-[85vw] max-w-[320px] md:w-56 lg:w-64",
          "shadow-2xl md:shadow-none",
          // Default: hidden on mobile
          "-translate-x-full md:translate-x-0",
          // Override with JS state when sidebar should be open on mobile
          isMobile && isSidebarOpen && "translate-x-0"
        )}>
          {/* Drawer Header - Mobile */}
          <div className={cn(
            "px-4 py-4 border-b bg-gradient-to-b from-slate-50 to-white",
            "md:px-3 md:py-3"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm md:hidden">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <Users className="h-5 w-5 text-muted-foreground hidden md:block" />
                <div>
                  <h3 className="font-bold text-base md:text-sm md:font-semibold">
                    Командний чат
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {onlineCount} з {MOCK_USERS.length} онлайн
                  </p>
                </div>
              </div>
              {/* Close button - Mobile only */}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl md:hidden"
                onClick={() => setIsSidebarOpen(false)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Channels List */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-3">
              <p className="px-2 py-2 text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Канали
              </p>
              <div className="space-y-1">
                {MOCK_CHANNELS.map((channel) => {
                  const Icon = channel.icon;
                  const isActive = chatView?.type === "channel" && chatView.id === channel.id;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => {
                        openChannel(channel.id);
                        if (isMobile) setIsSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-xl text-sm transition-all touch-feedback active:scale-[0.98]",
                        isActive
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 md:w-7 md:h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                        isActive ? "bg-blue-100" : "bg-slate-100"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4 transition-colors",
                          isActive ? "text-blue-600" : "text-slate-500"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <span className="truncate block">{channel.name}</span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 md:hidden">{channel.description}</span>
                      </div>
                      {channel.unread > 0 && (
                        <span className="bg-blue-500 text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-full min-w-[22px] text-center">
                          {channel.unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Team Members */}
              <p className="px-2 py-2 mt-5 text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Особисті повідомлення
              </p>
              <div className="space-y-1">
                {MOCK_USERS.map((user) => {
                  const isActive = chatView?.type === "dm" && chatView.odId === user.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        openDm(user.id);
                        if (isMobile) setIsSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 md:py-2 rounded-xl text-sm transition-all touch-feedback active:scale-[0.98]",
                        isActive
                          ? "bg-blue-50"
                          : "hover:bg-slate-50"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <div className={cn(
                          "w-9 h-9 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs md:text-[10px] font-semibold text-white",
                          ROLE_COLORS[user.role] || "bg-gray-500"
                        )}>
                          {user.initials}
                        </div>
                        <Circle
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-3 w-3 md:h-2.5 md:w-2.5 fill-current stroke-background stroke-2",
                            STATUS_COLORS[user.status]
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className={cn(
                          "text-sm md:text-xs truncate font-medium",
                          user.status === "offline" ? "text-slate-400" : "text-slate-700"
                        )}>
                          {user.name}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 md:hidden">
                          {ROLE_LABELS[user.role]}
                        </p>
                      </div>
                      {user.dmUnread > 0 && (
                        <span className="bg-blue-500 text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-full min-w-[22px] text-center">
                          {user.dmUnread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Messages Area / Mobile List View */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile List View - Show channels/DMs list on mobile when no chat selected */}
          {isMobile && !chatView ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-4 py-4 border-b">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  Командний чат
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {onlineCount} з {MOCK_USERS.length} онлайн
                </p>
              </div>

              {/* Channels & DMs List */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-3 py-2">
                  <p className="px-2 py-2 text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Канали
                  </p>
                  <div className="space-y-0.5">
                    {MOCK_CHANNELS.map((channel) => {
                      const Icon = channel.icon;
                      return (
                        <button
                          key={channel.id}
                          onClick={() => setChatView({ type: "channel", id: channel.id })}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all hover:bg-foreground/5 active:bg-foreground/10"
                        >
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted flex-shrink-0">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="font-medium truncate">{channel.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{channel.description}</p>
                          </div>
                          {channel.unread > 0 && (
                            <span className="bg-blue-500 text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
                              {channel.unread}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p className="px-2 py-2 mt-4 text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Особисті повідомлення
                  </p>
                  <div className="space-y-0.5">
                    {MOCK_USERS.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => setChatView({ type: "dm", odId: user.id })}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors hover:bg-foreground/5 active:bg-foreground/10"
                      >
                        <div className="relative flex-shrink-0">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white",
                            ROLE_COLORS[user.role] || "bg-gray-500"
                          )}>
                            {user.initials}
                          </div>
                          <Circle
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-current stroke-background stroke-2",
                              STATUS_COLORS[user.status]
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className={cn(
                            "font-medium truncate",
                            user.status === "offline" ? "text-muted-foreground" : "text-foreground"
                          )}>
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{ROLE_LABELS[user.role]}</p>
                        </div>
                        {user.dmUnread > 0 && (
                          <span className="bg-blue-500 text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
                            {user.dmUnread}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-3 md:px-6 py-3 md:py-4 border-b flex items-center justify-between bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  {/* Mobile Back Button - navigates to chat list */}
                  {isMobile && chatView && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 flex-shrink-0 rounded-xl"
                      onClick={() => setChatView(null)}
                      aria-label="Назад до списку чатів"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}

                  {/* Channel/DM Info */}
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    {chatView?.type === "channel" && activeChannel && (
                      <>
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center bg-muted flex-shrink-0">
                          <activeChannel.icon className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="font-semibold text-sm md:text-base truncate">{activeChannel.name}</h2>
                          <p className="text-xs text-muted-foreground truncate hidden sm:block">{activeChannel.description}</p>
                        </div>
                      </>
                    )}
                    {chatView?.type === "dm" && activeDmUser && (
                      <>
                        <div className="relative flex-shrink-0">
                          <div className={cn(
                            "w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold text-white",
                            ROLE_COLORS[activeDmUser.role] || "bg-gray-500"
                          )}>
                            {activeDmUser.initials}
                          </div>
                          <Circle
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 md:h-3 md:w-3 fill-current stroke-background stroke-2",
                              STATUS_COLORS[activeDmUser.status]
                            )}
                          />
                        </div>
                        <div className="min-w-0">
                          <h2 className="font-semibold text-sm md:text-base truncate">{activeDmUser.name}</h2>
                          <p className="text-xs text-muted-foreground truncate">{ROLE_LABELS[activeDmUser.role]}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="relative hidden sm:block">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Пошук..."
                      className="pl-8 h-8 w-32 md:w-40 text-sm"
                      disabled
                    />
                  </div>
                </div>
              </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-2 md:px-4 py-3 md:py-4">
            <div className="space-y-1 max-w-3xl mx-auto">
              {/* Date separator */}
              <div className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium px-2 py-1 bg-muted/50 rounded-full">
                  Сьогодні
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Channel Messages */}
              {chatView?.type === "channel" && channelMessages.map((msg, index) => {
                const prevMsg = channelMessages[index - 1];
                const isSameAuthor = prevMsg?.author.id === msg.author.id;
                const showAvatar = !isSameAuthor;

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "group flex gap-2 md:gap-3 hover:bg-muted/40 -mx-2 px-2 md:-mx-3 md:px-3 py-1.5 md:py-1 rounded-lg transition-colors",
                      showAvatar && "mt-3 pt-2"
                    )}
                  >
                    {showAvatar ? (
                      <Avatar className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0 mt-0.5">
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
                      <div className="w-8 md:w-9 flex-shrink-0 flex items-center justify-center">
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {msg.timestamp}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {showAvatar && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span
                            className="font-medium md:font-semibold text-sm md:text-base hover:underline cursor-pointer truncate"
                            onClick={() => openDm(msg.author.id)}
                          >
                            {msg.author.name}
                          </span>
                          <span className="text-[10px] sm:text-[11px] text-muted-foreground flex-shrink-0">
                            {msg.timestamp}
                          </span>
                        </div>
                      )}
                      <p className="text-xs md:text-sm text-foreground/90 leading-relaxed break-words">
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
              {chatView?.type === "dm" && dmMessages.map((msg, index) => {
                const isMe = msg.senderId === "me";
                const sender = isMe ? null : MOCK_USERS.find(u => u.id === msg.senderId);
                const prevMsg = dmMessages[index - 1];
                const isSameSender = prevMsg?.senderId === msg.senderId;
                const showAvatar = !isSameSender;

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "group flex gap-2 md:gap-3 hover:bg-muted/40 -mx-2 px-2 md:-mx-3 md:px-3 py-1.5 md:py-1 rounded-lg transition-colors",
                      showAvatar && "mt-3 pt-2"
                    )}
                  >
                    {showAvatar ? (
                      <Avatar className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0 mt-0.5">
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
                      <div className="w-8 md:w-9 flex-shrink-0 flex items-center justify-center">
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {msg.timestamp}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {showAvatar && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="font-medium md:font-semibold text-sm md:text-base truncate">
                            {isMe ? "Ви" : sender?.name}
                          </span>
                          <span className="text-[10px] sm:text-[11px] text-muted-foreground flex-shrink-0">
                            {msg.timestamp}
                          </span>
                        </div>
                      )}
                      <p className="text-xs md:text-sm text-foreground/90 leading-relaxed break-words">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                );
              })}

              {chatView?.type === "dm" && dmMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                    <MessageCircle className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-base font-medium text-foreground mb-1">Немає повідомлень</p>
                  <p className="text-sm text-muted-foreground">
                    Почніть розмову з {activeDmUser?.name}
                  </p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="p-3 md:p-4 border-t bg-background">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-2 bg-muted/40 rounded-xl px-2 md:px-3 py-2 border border-transparent focus-within:border-border focus-within:bg-background transition-all">
                <div className="flex gap-1 pb-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 md:h-8 md:w-8 text-muted-foreground hover:text-foreground rounded-lg"
                    disabled
                  >
                    <Paperclip className="h-5 w-5 md:h-4 md:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 md:h-8 md:w-8 text-muted-foreground hover:text-foreground rounded-lg"
                    disabled
                  >
                    <ImageIcon className="h-5 w-5 md:h-4 md:w-4" />
                  </Button>
                </div>
                <div className="flex-1 min-w-0">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      chatView?.type === "channel"
                        ? `Написати в #${activeChannel?.name.toLowerCase()}...`
                        : `Написати ${activeDmUser?.shortName}...`
                    }
                    className="border-0 bg-transparent focus-visible:ring-0 px-0 h-10 md:h-9 text-sm"
                    disabled
                  />
                </div>
                <div className="flex gap-1 pb-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 md:h-8 md:w-8 text-muted-foreground hover:text-foreground rounded-lg"
                    disabled
                  >
                    <AtSign className="h-5 w-5 md:h-4 md:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 md:h-8 md:w-8 text-muted-foreground hover:text-foreground rounded-lg"
                    disabled
                  >
                    <Smile className="h-5 w-5 md:h-4 md:w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-10 w-10 md:h-8 md:w-8 rounded-lg"
                    disabled
                  >
                    <Send className="h-5 w-5 md:h-4 md:w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
