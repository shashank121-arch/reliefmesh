"use client"
import React, { useState, useEffect } from 'react';
import { Send, Smartphone, Wifi, Battery, Check, ChevronLeft, Zap } from 'lucide-react';

interface Message {
  text: string;
  sender: 'victim' | 'reliefmesh';
  timestamp: string;
}

export default function SMSSimulator() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const script: Message[] = [
    { text: "CASH SHOP001 45", sender: 'victim', timestamp: "11:02 AM" },
    { text: "✓ ReliefMesh: Authentication successful. Processing your cash-out at Rahul's Store.", sender: 'reliefmesh', timestamp: "11:02 AM" },
    { text: "✓ ReliefMesh: Payment complete! Shopkeeper SHOP001 has released $45.00 USDC. Your remaining balance is $23.00 USDC. Ref: RM-2025-4821", sender: 'reliefmesh', timestamp: "11:03 AM" }
  ];

  useEffect(() => {
    if (currentStep < script.length) {
      const timer = setTimeout(() => {
        setMessages(prev => [...prev, script[currentStep]]);
        setCurrentStep(prev => prev + 1);
      }, currentStep === 0 ? 1500 : 2500);
      return () => clearTimeout(timer);
    } else {
      // Loop after 10 seconds
      const reset = setTimeout(() => {
        setMessages([]);
        setCurrentStep(0);
      }, 10000);
      return () => clearTimeout(reset);
    }
  }, [currentStep]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
      {/* SMS Reference Card */}
      <div className="flex-1 space-y-4 max-w-md order-2 lg:order-1">
        <div className="label-text text-[var(--gold)] mb-2">Omnichannel Accessibility</div>
        <h2 className="text-3xl font-display italic text-white mb-4">Offline Victim Access</h2>
        <p className="text-gray-400 text-sm mb-6">Victims without smartphones or internet can access their aid via encrypted SMS shortcodes. Our Twilio gateway bridges the analog-to-digital gap.</p>
        
        <div className="grid grid-cols-1 gap-3">
          <CommandCard cmd="BAL" desc="Check your available balance" />
          <CommandCard cmd="CASH [ID] [AMT]" desc="Instant cash-out at local shopkeeper" />
          <CommandCard cmd="HIST" desc="Get last 5 transactions" />
        </div>
      </div>

      {/* Phone Mockup */}
      <div className="relative order-1 lg:order-2">
        <div className="w-[300px] h-[600px] bg-[#1a1a1a] rounded-[3rem] border-8 border-[#333] shadow-2xl overflow-hidden relative flex flex-col">
          {/* Status Bar */}
          <div className="h-8 flex justify-between items-center px-6 pt-2 text-[10px] text-gray-500 font-bold">
            <span>Stellar Mobile</span>
            <div className="flex gap-1 items-center">
              <Wifi size={10} />
              <Battery size={10} />
            </div>
          </div>

          {/* Chat Header */}
          <div className="bg-[#222] border-b border-[#333] p-4 flex items-center gap-3">
            <ChevronLeft size={16} className="text-[var(--gold)]" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A78B71] to-[#D4AF37] flex items-center justify-center text-black font-bold text-xs">RM</div>
            <div>
              <div className="text-[10px] text-white font-bold leading-tight">ReliefMesh Hub</div>
              <div className="text-[8px] text-[var(--emerald)] leading-tight">Secured Gateway</div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#111]">
            <div className="text-center">
                <span className="text-[8px] px-2 py-1 bg-[#222] rounded-full text-gray-500 uppercase tracking-widest font-bold">Today</span>
            </div>

            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.sender === 'victim' ? 'items-end' : 'items-start'} animate-fade-in-up`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-[10px] leading-relaxed ${
                  msg.sender === 'victim' 
                    ? 'bg-[#333] text-white rounded-tr-none' 
                    : 'bg-black border border-[var(--border-gold)] text-gray-200 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[8px] text-gray-600 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#222] border-t border-[#333] flex gap-2">
             <div className="flex-1 h-8 bg-[#111] rounded-full border border-[#333] px-3 flex items-center text-[10px] text-gray-500">
               Message...
             </div>
             <div className="w-8 h-8 rounded-full bg-[var(--gold)] flex items-center justify-center text-black">
               <Send size={14} />
             </div>
          </div>

          {/* Bottom Bar */}
          <div className="h-6 flex justify-center items-end pb-1">
            <div className="w-20 h-1 bg-gray-700 rounded-full"></div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute -top-4 -right-4 glass-card p-3 rounded-2xl border-[var(--emerald)] animate-bounce-slow">
           <Zap size={20} className="text-[var(--emerald)]" />
        </div>
      </div>
    </div>
  );
}

function CommandCard({ cmd, desc }: { cmd: string, desc: string }) {
  return (
    <div className="glass-card p-3 border-l-2 border-l-[var(--gold)] hover:translate-x-1 transition-transform cursor-pointer">
      <div className="flex justify-between items-center">
        <span className="text-xs font-mono font-bold text-white tracking-widest">{cmd}</span>
        <span className="text-[10px] text-gray-500">{desc}</span>
      </div>
    </div>
  );
}
