import { cn } from '../utils/cn'

function Skeleton({ className = '' }) {
  return <div className={cn('bg-soft-stone rounded animate-pulse', className)} />
}

function SkeletonText({ className = '', width = 'w-full' }) {
  return <Skeleton className={cn('h-4', width, className)} />
}

function SkeletonTitle({ className = '', width = 'w-40' }) {
  return <Skeleton className={cn('h-8', width, className)} />
}

function SkeletonAvatar({ size = 'md' }) {
  const sizeClass = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-28 h-28',
  }[size]
  return <Skeleton className={cn(sizeClass, 'rounded-full')} />
}

function SkeletonButton({ className = '' }) {
  return <Skeleton className={cn('h-10 w-28 rounded-full', className)} />
}

function SkeletonCard({ className = '' }) {
  return (
    <div className={cn('bg-white border border-hairline rounded-xl p-5', className)}>
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

function SkeletonCardGrid({ count = 4, className = '' }) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

function SkeletonStat({ className = '' }) {
  return (
    <div className={cn('bg-white border border-hairline rounded-xl p-6', className)}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-12" />
    </div>
  )
}

function SkeletonStatGrid({ count = 2, className = '' }) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStat key={i} />
      ))}
    </div>
  )
}

function SkeletonRow({ className = '' }) {
  return (
    <div className={cn('p-5 md:p-6 flex items-center justify-between gap-4', className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-7 rounded" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  )
}

function SkeletonRowList({ count = 6, className = '' }) {
  return (
    <div className={cn('border border-hairline bg-white rounded-2xl overflow-hidden shadow-card divide-y divide-hairline', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

function SkeletonAnnouncement({ className = '' }) {
  return (
    <div className={cn('bg-white border border-hairline rounded-xl p-5 animate-pulse', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-3 w-full mb-1.5" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  )
}

function SkeletonAnnouncementList({ count = 6, className = '' }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonAnnouncement key={i} />
      ))}
    </div>
  )
}

function SkeletonFaculty({ className = '' }) {
  return (
    <div className={cn('p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6', className)}>
      <div className="flex items-center gap-5">
        <SkeletonAvatar size="lg" />
        <div>
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-3 w-28 mb-1" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <SkeletonButton />
    </div>
  )
}

function SkeletonFacultyList({ count = 4, className = '' }) {
  return (
    <div className={cn('border border-hairline bg-white rounded-2xl overflow-hidden shadow-card divide-y divide-hairline', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonFaculty key={i} />
      ))}
    </div>
  )
}

function SkeletonPost({ className = '' }) {
  return (
    <div className={cn('bg-white border border-hairline rounded-xl p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-1.5" />
      <Skeleton className="h-4 w-3/4 mb-3" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
    </div>
  )
}

function SkeletonPostList({ count = 3, className = '' }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPost key={i} />
      ))}
    </div>
  )
}

function SkeletonResource({ className = '' }) {
  return (
    <div className={cn('border border-hairline bg-white rounded-2xl p-6', className)}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <div className="flex items-center justify-between pt-4 border-t border-hairline">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

function SkeletonResourceGrid({ count = 6, className = '' }) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonResource key={i} />
      ))}
    </div>
  )
}

function SkeletonImage({ className = '' }) {
  return <Skeleton className={cn('aspect-video rounded-2xl', className)} />
}

function SkeletonImageGrid({ count = 6, className = '' }) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonImage key={i} />
      ))}
    </div>
  )
}

function SkeletonTable({ rows = 5, cols = 5, className = '' }) {
  return (
    <div className={cn('border border-hairline bg-white rounded-2xl overflow-hidden shadow-card', className)}>
      <div className="p-4 border-b border-hairline flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="p-4 border-b border-hairline last:border-b-0 flex gap-4">
          {Array.from({ length: cols }).map((_, col) => (
            <Skeleton key={col} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonDashboard({ className = '' }) {
  return (
    <div className={cn('min-h-screen bg-canvas text-ink pt-28 pb-24', className)}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="mb-8">
          <SkeletonTitle width="w-40" className="mb-2" />
          <SkeletonText width="w-64" />
        </div>
        <SkeletonStatGrid count={2} className="mb-10" />
        <SkeletonCardGrid count={4} />
      </div>
    </div>
  )
}

function SkeletonLab({ className = '' }) {
  return (
    <div className={cn('p-6 md:p-8 flex flex-col sm:flex-row gap-6', className)}>
      <Skeleton className="w-full sm:w-48 h-48 rounded-2xl" />
      <div className="flex-1">
        <Skeleton className="h-6 w-48 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function SkeletonLabList({ count = 3, className = '' }) {
  return (
    <div className={cn('border border-hairline bg-white rounded-2xl overflow-hidden shadow-card divide-y divide-hairline', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLab key={i} />
      ))}
    </div>
  )
}

function SkeletonProfile({ className = '' }) {
  return (
    <div className={cn('flex flex-col items-center gap-8 pb-12 mb-12 border-b md:flex-row md:items-start border-divider-soft', className)}>
      <SkeletonAvatar size="xl" />
      <div className="flex-1">
        <Skeleton className="h-10 w-48 mb-3" />
        <Skeleton className="h-5 w-64 mb-4" />
        <div className="flex gap-3">
          <SkeletonButton />
          <SkeletonButton />
        </div>
      </div>
    </div>
  )
}

function SkeletonBatchMates({ count = 4, className = '' }) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-2xl border-divider-soft bg-white animate-pulse">
          <SkeletonAvatar size="md" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonCalendar({ className = '' }) {
  return (
    <div className={cn('bg-white border border-hairline rounded-2xl overflow-hidden shadow-card', className)}>
      <div className="p-6 border-b border-hairline">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 p-4">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}

export {
  Skeleton,
  SkeletonText,
  SkeletonTitle,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  SkeletonCardGrid,
  SkeletonStat,
  SkeletonStatGrid,
  SkeletonRow,
  SkeletonRowList,
  SkeletonAnnouncement,
  SkeletonAnnouncementList,
  SkeletonFaculty,
  SkeletonFacultyList,
  SkeletonPost,
  SkeletonPostList,
  SkeletonResource,
  SkeletonResourceGrid,
  SkeletonImage,
  SkeletonImageGrid,
  SkeletonTable,
  SkeletonDashboard,
  SkeletonLab,
  SkeletonLabList,
  SkeletonProfile,
  SkeletonBatchMates,
  SkeletonCalendar,
}
