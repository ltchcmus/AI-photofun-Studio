import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Minimize2 } from "lucide-react";
import { useAuthContext } from "../../context/AuthContext";
import { chatBotApi } from "../../api/chatBotApi";
import ImageLightbox from "./ImageLightbox";

const ChatBot = () => {
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI Assistant. How can I help you?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const messagesEndRef = useRef(null);

  // Listen for dark mode changes
  useEffect(() => {
    const checkDarkMode = () => {
      const darkModeStorage = localStorage.getItem("darkMode") === "true";
      const bodyHasDark = document.body.classList.contains("dark");
      setIsDarkMode(darkModeStorage || bodyHasDark);
    };

    checkDarkMode();
    window.addEventListener("storage", checkDarkMode);
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener("storage", checkDarkMode);
      observer.disconnect();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage("");
    setIsTyping(true);
    setError(null);

    try {
      // Call real API
      const response = await chatBotApi.sendMessage(currentMessage);

      // Extract bot response from API
      // Response format: { code: 1000, message: "Chat successfully", result: { imageUrl, answer } }
      let botText = "Sorry, I didn't receive a response from the server.";
      let imageUrl = null;

      if (response && response.result) {
        botText = response.result.answer || botText;
        imageUrl = response.result.imageUrl || null;
      }

      const botResponse = {
        id: messages.length + 2,
        text: botText,
        imageUrl: imageUrl,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Unable to connect to chatbot. Please try again.");

      // Fallback response
      const errorResponse = {
        id: messages.length + 2,
        text: "Sorry, I'm having connection issues. Please try again later.",
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`group/bubble fixed bottom-6 right-6 z-50 ${
            isDarkMode
              ? "bg-slate-800 text-white border-2 border-slate-700 hover:border-slate-500 shadow-lg shadow-slate-900/50 hover:shadow-xl hover:shadow-slate-900/60"
              : "bg-white text-slate-900 border-2 border-slate-200 hover:border-slate-400 shadow-lg shadow-slate-900/10 hover:shadow-xl hover:shadow-slate-900/20"
          } p-4 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer`}
          aria-label="Open chat"
        >
          <div className="relative">
            <MessageCircle className="w-6 h-6 group-hover/bubble:rotate-12 transition-transform duration-300" />
            {/* Notification dot */}
            <span
              className={`absolute -top-1 -right-1 w-3 h-3 ${
                isDarkMode ? "bg-emerald-400" : "bg-emerald-500"
              } rounded-full animate-pulse-subtle`}
            ></span>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-96 h-[600px] ${
            isDarkMode
              ? "bg-slate-900 border-slate-700"
              : "bg-white border-slate-200"
          } rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 animate-fade-in`}
        >
          {/* Header */}
          <div
            className={`${
              isDarkMode
                ? "bg-slate-800 border-b border-slate-700"
                : "bg-slate-50 border-b border-slate-200"
            } p-4 flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`relative w-10 h-10 ${
                  isDarkMode ? "bg-slate-700" : "bg-white"
                } rounded-xl flex items-center justify-center shadow-sm group/icon`}
              >
                <Sparkles
                  className={`w-5 h-5 ${
                    isDarkMode ? "text-slate-100" : "text-slate-900"
                  } group-hover/icon:rotate-12 transition-transform duration-300`}
                />
                <span
                  className={`absolute inset-0 rounded-xl opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300 ${
                    isDarkMode ? "bg-slate-600/20" : "bg-slate-100"
                  }`}
                ></span>
              </div>
              <div>
                <h3
                  className={`font-semibold ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  AI Assistant
                </h3>
                <p
                  className={`text-xs ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Always ready to help
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={`${
                isDarkMode
                  ? "hover:bg-slate-700 text-slate-400 hover:text-white"
                  : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
              } p-2 rounded-lg transition-all duration-200 cursor-pointer group/close`}
              aria-label="Close chat"
            >
              <X className="w-5 h-5 group-hover/close:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Messages Area */}
          <div
            className={`flex-1 overflow-y-auto p-4 space-y-4 ${
              isDarkMode ? "bg-slate-900" : "bg-slate-50"
            }`}
          >
            {error && (
              <div
                className={`${
                  isDarkMode
                    ? "bg-red-900/20 border-red-800 text-red-400"
                    : "bg-red-50 border-red-200 text-red-700"
                } border px-4 py-3 rounded-xl text-sm animate-fade-in`}
              >
                {error}
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                } animate-fade-in`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`group/message max-w-[80%] rounded-2xl px-4 py-3 transition-all duration-300 ${
                    message.sender === "user"
                      ? isDarkMode
                        ? "bg-slate-100 text-slate-900 rounded-br-md shadow-lg"
                        : "bg-slate-900 text-white rounded-br-md shadow-lg"
                      : isDarkMode
                      ? "bg-slate-800 text-slate-100 rounded-bl-md border border-slate-700 hover:border-slate-600"
                      : "bg-white text-slate-900 rounded-bl-md border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
                  }`}
                >
                  {message.imageUrl && (
                    <div className="relative overflow-hidden rounded-lg mb-2 group/img">
                      <img
                        src={message.imageUrl}
                        alt="Bot response"
                        className="rounded-lg max-w-full h-auto cursor-pointer transition-all duration-300 group-hover/img:scale-105"
                        onClick={() => setLightboxImage(message.imageUrl)}
                        title="Click to view larger image"
                      />
                      {/* Image overlay on hover */}
                      <div className="absolute inset-0 bg-slate-900/0 group-hover/img:bg-slate-900/10 transition-colors duration-300 rounded-lg"></div>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.text}
                  </p>
                  <p
                    className={`text-xs mt-2 ${
                      message.sender === "user"
                        ? isDarkMode
                          ? "text-slate-500"
                          : "text-slate-400"
                        : isDarkMode
                        ? "text-slate-500"
                        : "text-slate-400"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div
                  className={`${
                    isDarkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-white border-slate-200"
                  } rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border`}
                >
                  <div className="flex gap-1.5">
                    <span
                      className={`w-2 h-2 ${
                        isDarkMode ? "bg-slate-500" : "bg-slate-400"
                      } rounded-full animate-bounce`}
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className={`w-2 h-2 ${
                        isDarkMode ? "bg-slate-500" : "bg-slate-400"
                      } rounded-full animate-bounce`}
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className={`w-2 h-2 ${
                        isDarkMode ? "bg-slate-500" : "bg-slate-400"
                      } rounded-full animate-bounce`}
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            className={`p-4 ${
              isDarkMode
                ? "bg-slate-800 border-t border-slate-700"
                : "bg-white border-t border-slate-200"
            }`}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
                className={`flex-1 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isDarkMode
                    ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-slate-500 focus:bg-slate-600"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white"
                } border focus:outline-none focus:ring-2 ${
                  isDarkMode ? "focus:ring-slate-500" : "focus:ring-slate-300"
                }`}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className={`group/send p-3 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer ${
                  isDarkMode
                    ? "bg-slate-100 text-slate-900 hover:bg-white hover:shadow-lg"
                    : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg"
                }`}
                aria-label="Send message"
              >
                <Send className="w-5 h-5 group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5 transition-transform duration-300" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        imageUrl={lightboxImage}
        alt="Bot response image"
      />
    </>
  );
};

export default ChatBot;
