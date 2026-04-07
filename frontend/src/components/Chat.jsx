import React, { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { MessageCircle, Send, Smile } from "lucide-react";
import { toast } from "sonner";

const Chat = ({ messages, onSendMessage, currentUser = "You" }) => {
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    onSendMessage(newMessage.trim());
    setNewMessage("");
    toast.success("Message sent!");
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getMessageColor = (type) => {
    switch (type) {
      case "win":
        return "text-emerald-400";
      case "loss":
        return "text-rose-400";
      case "system":
        return "text-yellow-400";
      default:
        return "text-gray-300";
    }
  };

  const getMessageBg = (type) => {
    switch (type) {
      case "win":
        return "bg-emerald-900/20 border-emerald-700/30";
      case "loss":
        return "bg-rose-900/20 border-rose-700/30";
      case "system":
        return "bg-yellow-900/20 border-yellow-700/30";
      default:
        return "bg-gray-800/50 border-gray-700/50";
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Live Chat</h3>
          </div>
          <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
            {messages.length} Messages
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 h-[400px]" ref={scrollRef}>
        <div className="p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No messages yet</p>
              <p className="text-xs mt-1">Be the first to chat!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`${getMessageBg(
                  message.type
                )} p-3 rounded-lg border transition-all duration-300 hover:bg-gray-800/70`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-6 h-6 rounded-full ${
                        message.username === currentUser
                          ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                          : "bg-gradient-to-br from-purple-500 to-pink-600"
                      } flex items-center justify-center text-white font-bold text-xs`}
                    >
                      {message.username.charAt(0)}
                    </div>
                    <span
                      className={`font-semibold text-sm ${
                        message.username === currentUser
                          ? "text-cyan-400"
                          : "text-white"
                      }`}
                    >
                      {message.username}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className={`text-sm ${getMessageColor(message.type)} ml-8`}>
                  {message.text}
                </p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <div className="relative flex-1">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              maxLength={200}
              className="bg-gray-800 border-gray-700 text-white pr-10 focus:border-cyan-500 transition-colors"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <div className="text-xs text-gray-500 mt-2 text-center">
          {newMessage.length}/200 characters
        </div>
      </div>
    </Card>
  );
};

export default Chat;
