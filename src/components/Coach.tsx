import React, { useState, useRef, useEffect } from "react";
import type { Message } from "../types";

interface CoachProps {
  messages: Message[];
  onSend: (text: string) => void;
}



export function Coach({ messages, onSend }: CoachProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-[70vh]">
      <div className="mb-4">
        <h2 className="font-headline font-extrabold text-2xl text-on-surface">Nutrition Coach</h2>
        <p className="text-sm text-on-surface-variant">Your personal AI health assistant</p>
      </div>

      <div
        ref={scrollRef}
        className="flex-grow overflow-y-auto space-y-4 mb-4 pr-2"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${m.role === "user"
                  ? "bg-primary-container text-on-primary-container rounded-tr-none"
                  : "bg-surface-container-high text-on-surface rounded-tl-none border border-outline-variant/10"
                }`}
            >
              <p className="text-sm leading-relaxed">{m.text}</p>
              <span className="text-[10px] opacity-50 mt-1 block text-right">{m.time}</span>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="relative mt-auto">
        <div className="obsidian-inset rounded-2xl p-1 flex items-center">
          <input
            className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-stone-600 px-4 py-3 font-body text-sm"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="p-3 bg-primary-container text-on-primary-container rounded-xl mr-1 hover:brightness-110 active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-xl">send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
