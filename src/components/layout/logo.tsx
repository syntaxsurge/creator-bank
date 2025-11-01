import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
}

export const Logo = ({ className }: LogoProps) => (
  <span
    className={cn(
      'text-lg font-semibold uppercase tracking-wide text-foreground sm:text-xl',
      className
    )}
  >
    <span className='text-foreground'>Creator</span>
    <span className='text-primary'>Bank</span>
  </span>
)
