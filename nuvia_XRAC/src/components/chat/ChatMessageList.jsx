import React, { useEffect, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import OptionList from './OptionList.jsx'
import DateChips from './DateChips.jsx'
import TimeSlotGrid from './TimeSlotGrid.jsx'
import AppointmentCard from './AppointmentCard.jsx'

function BotAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-nuvia-500 to-sky-500 text-white shadow-sm">
      <Sparkles size={15} strokeWidth={2.25} />
    </div>
  )
}

function BubbleShell({ role, children, bare }) {
  const isBot = role === 'bot'
  return (
    <div className={`flex items-end gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && <BotAvatar />}
      <div
        className={`animate-rise max-w-[82%] sm:max-w-[70%] ${
          bare
            ? ''
            : isBot
            ? 'rounded-2xl rounded-bl-sm bg-white border border-ink-100 px-4 py-3'
            : 'rounded-2xl rounded-br-sm bg-nuvia-500 px-4 py-3 text-white'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-2.5">
      <BotAvatar />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-ink-100 bg-white px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function ChatMessageList({ messages, isTyping }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, isTyping])

  return (
    <div className="flex flex-col gap-3 px-4 py-5 sm:px-6">
      {messages.map((msg) => {
        if (msg.kind === 'text') {
          return (
            <BubbleShell key={msg.id} role={msg.role}>
              <p className="whitespace-pre-line text-sm leading-relaxed">{msg.text}</p>
            </BubbleShell>
          )
        }
        if (msg.kind === 'options') {
          return (
            <BubbleShell key={msg.id} role="bot">
              {msg.text && <p className="mb-3 text-sm leading-relaxed">{msg.text}</p>}
              <OptionList
                options={msg.options}
                selected={msg.selected}
                columns={msg.columns}
                onSelect={(value) => msg.onSelect(value)}
              />
            </BubbleShell>
          )
        }
        if (msg.kind === 'dates') {
          return (
            <BubbleShell key={msg.id} role="bot">
              {msg.text && <p className="mb-3 text-sm leading-relaxed">{msg.text}</p>}
              <DateChips selected={msg.selected} onSelect={(value) => msg.onSelect(value)} />
            </BubbleShell>
          )
        }
        if (msg.kind === 'slots') {
          return (
            <BubbleShell key={msg.id} role="bot">
              {msg.text && <p className="mb-3 text-sm leading-relaxed">{msg.text}</p>}
              <TimeSlotGrid slots={msg.slots} selected={msg.selected} onSelect={(value) => msg.onSelect(value)} />
            </BubbleShell>
          )
        }
        if (msg.kind === 'card') {
          return (
            <BubbleShell key={msg.id} role="bot" bare>
              <AppointmentCard {...msg.card} />
            </BubbleShell>
          )
        }
        return null
      })}
      {isTyping && <TypingBubble />}
      <div ref={endRef} />
    </div>
  )
}
