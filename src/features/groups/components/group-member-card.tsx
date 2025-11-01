'use client'

import { format } from 'date-fns'
import { Calendar } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Doc } from '@/convex/_generated/dataModel'

import { useGroupContext } from '../context/group-context'

type GroupMemberCardProps = {
  member: Doc<'users'>
}

function getInitials(member: Doc<'users'>) {
  if (member.displayName) {
    return member.displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(token => token[0]?.toUpperCase() ?? '')
      .join('')
  }

  return member.walletAddress.slice(2, 4).toUpperCase()
}

export function GroupMemberCard({ member }: GroupMemberCardProps) {
  const { group } = useGroupContext()
  const joinedAt = format(member._creationTime, 'MMM dd, yyyy')
  const isOwner = group.ownerId === member._id
  const initials = getInitials(member)

  return (
    <article className='flex items-start gap-4 rounded-xl border border-border bg-card p-5'>
      <Avatar className='h-14 w-14 border border-border/60'>
        <AvatarFallback className='bg-primary/10 text-base font-semibold uppercase text-primary'>
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className='flex-1 space-y-2'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <p className='text-base font-bold text-foreground'>
              {member.displayName ?? member.walletAddress}
            </p>
            {isOwner && (
              <span className='mt-1 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground'>
                Owner
              </span>
            )}
          </div>
        </div>

        {member.about && (
          <p className='text-sm leading-relaxed text-foreground'>
            {member.about}
          </p>
        )}

        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <Calendar className='h-3.5 w-3.5' aria-hidden='true' />
          <span>Joined {joinedAt}</span>
        </div>
      </div>
    </article>
  )
}
