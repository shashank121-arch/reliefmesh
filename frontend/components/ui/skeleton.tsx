import React from 'react'

export function StatSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="h-3 w-24 bg-white/10 rounded mb-4"/>
      <div className="h-8 w-32 bg-white/10 rounded mb-2"/>
      <div className="h-3 w-20 bg-white/10 rounded"/>
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="flex gap-4 p-4 border-b border-white/5 animate-pulse">
      <div className="h-4 w-24 bg-white/10 rounded"/>
      <div className="h-4 w-32 bg-white/10 rounded"/>
      <div className="h-4 w-20 bg-white/10 rounded"/>
      <div className="h-4 w-16 bg-white/10 rounded"/>
    </div>
  )
}

export function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex-shrink-0"/>
          <div className="flex-1">
            <div className="h-4 w-32 bg-white/10 rounded mb-2"/>
            <div className="h-3 w-24 bg-white/10 rounded"/>
          </div>
          <div className="w-16 h-4 bg-white/10 rounded flex-shrink-0"/>
        </div>
      ))}
    </div>
  )
}
