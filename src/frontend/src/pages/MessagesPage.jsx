import React, { useEffect, useRef, useState } from "react";
import {
  Send,
  Image,
  Search,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
} from "lucide-react";

const MessagesPage = () => {
  const [conversations] = useState([
    {
      id: 1,
      name: "Nguyễn Hưng Thịnh",
      avatar: "https://i.pravatar.cc/150?u=thinh",
      lastMessage: "Code xong phần Backend chưa ông?",
      time: "5 phút",
      unread: 2,
      isOnline: true,
    },
    {
      id: 2,
      name: "Lê Thành Công",
      avatar: "https://i.pravatar.cc/150?u=cong",
      lastMessage: "Tui mới update cái API, check nha.",
      time: "1 giờ",
      unread: 0,
      isOnline: false,
    },
    {
      id: 3,
      name: "Phan Khắc Trường",
      avatar: "https://i.pravatar.cc/150?u=truong",
      lastMessage: "Gửi tui cái link Figma với.",
      time: "3 giờ",
      unread: 0,
      isOnline: true,
    },
  ]);

  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "other",
      text: "Alo, tiến độ Frontend sao rồi?",
      time: "10:30",
    },
    {
      id: 2,
      sender: "me",
      text: "Đang làm giao diện Chat nè ông.",
      time: "10:31",
    },
    {
      id: 3,
      sender: "me",
      text: "Tí nữa xong tui push lên git nha.",
      time: "10:32",
    },
    {
      id: 4,
      sender: "other",
      text: "Oke, nhớ check conflict nha.",
      time: "10:35",
    },
    {
      id: 5,
      sender: "other",
      text: "Code xong phần Backend chưa ông?",
      time: "10:40",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!activeChat && conversations.length) {
      setActiveChat(conversations[0]);
    }
  }, [activeChat, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: "me",
      text: inputMessage,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
  };

  if (!activeChat) {
    return null;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden rounded-3xl border border-gray-200 shadow-sm">
      <div className="flex w-80 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-4">
          <h1 className="mb-4 text-xl font-bold text-gray-800">Đoạn chat</h1>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm"
              className="w-full rounded-full bg-gray-100 py-2 pl-10 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((chat) => (
            <button
              type="button"
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`mx-2 mb-2 flex items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                activeChat.id === chat.id ? "bg-blue-50" : "hover:bg-gray-100"
              }`}
            >
              <div className="relative">
                <img
                  src={chat.avatar}
                  alt={chat.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
                {chat.isOnline && (
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500"></span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between">
                  <h3
                    className={`truncate text-sm font-semibold ${
                      activeChat.id === chat.id
                        ? "text-blue-700"
                        : "text-gray-900"
                    }`}
                  >
                    {chat.name}
                  </h3>
                  <span className="text-xs text-gray-400">{chat.time}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between">
                  <p
                    className={`max-w-[140px] truncate text-xs ${
                      chat.unread ? "font-bold text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {chat.lastMessage}
                  </p>
                  {chat.unread > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-white">
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={activeChat.avatar}
                alt={activeChat.name}
                className="h-10 w-10 rounded-full object-cover"
              />
              {activeChat.isOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {activeChat.name}
              </p>
              <p className="text-xs text-gray-500">
                {activeChat.isOnline ? "Đang hoạt động" : "Hoạt động gần đây"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-blue-600">
            <button
              type="button"
              className="rounded-full p-2 transition-colors hover:bg-blue-50"
            >
              <Phone className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-full p-2 transition-colors hover:bg-blue-50"
            >
              <Video className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-full p-2 transition-colors hover:bg-blue-50"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-white p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "me" ? "justify-end" : "justify-start"
              }`}
            >
              {message.sender === "other" && (
                <img
                  src={activeChat.avatar}
                  alt={activeChat.name}
                  className="mr-2 h-8 w-8 rounded-full object-cover self-end"
                />
              )}
              <div
                className={`group relative max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                  message.sender === "me"
                    ? "rounded-br-none bg-blue-600 text-white"
                    : "rounded-bl-none bg-gray-100 text-gray-800"
                }`}
              >
                {message.text}
                <span
                  className={`pointer-events-none absolute bottom-full mb-1 text-[10px] text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 ${
                    message.sender === "me" ? "right-0" : "left-0"
                  }`}
                >
                  {message.time}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-100 p-4">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              className="rounded-full p-2 text-blue-600 transition-colors hover:bg-blue-50"
            >
              <Image className="h-6 w-6" />
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-blue-600 transition-colors hover:bg-blue-50"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <div className="relative flex-1">
              <input
                type="text"
                value={inputMessage}
                onChange={(event) => setInputMessage(event.target.value)}
                placeholder="Nhập tin nhắn..."
                className="w-full rounded-full bg-gray-100 py-2.5 pl-4 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-blue-600"
              >
                <Smile className="h-5 w-5" />
              </button>
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="rounded-full bg-blue-600 p-3 text-white shadow-md transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
