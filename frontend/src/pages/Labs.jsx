import { useQuery } from '@tanstack/react-query'
import { getLabs } from '../api/labs'

export default function Laboratory() {
  const { data, isLoading } = useQuery({
    queryKey: ['labs'],
    queryFn: () => getLabs().then(r => r.data),
  })

  const LABS = data?.data || []

  return (
    <div className="container pt-32 pb-20 min-h-screen bg-canvas text-ink">
      <h2 className="font-sans text-[14px] font-semibold tracking-widest uppercase text-ink-muted-48 mb-2">
        Hands-on Facilities
      </h2>
      <h1 className="font-display font-semibold text-[clamp(40px,8vw,64px)] leading-tight tracking-normal mb-6 text-ink">
        Laboratories
      </h1>
      <p className="font-sans text-[21px] font-normal leading-relaxed text-ink-muted-80 max-w-[640px] mb-12">
        Five fully equipped labs where theory meets circuit — the core of the Electro Infinity experience.
      </p>

      {/* Labs list */}
      <div className="flex flex-col border-t border-divider-soft">
        {LABS.map((lab, i) => (
          <div key={lab.name} className="grid grid-cols-[auto_1fr] gap-6 sm:gap-8 py-8 border-b border-divider-soft">
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-surface-pearl flex items-center justify-center text-[24px] border border-divider-soft flex-shrink-0 shadow-sm">
              {lab.icon}
            </div>

            {/* Info */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-sans text-[14px] font-semibold text-primary">0{i + 1}</span>
                <h3 className="font-display font-semibold text-[24px] tracking-tight text-ink">
                  {lab.name}
                </h3>
              </div>
              <p className="font-sans text-[17px] font-normal text-ink-muted-80 leading-relaxed mb-6 max-w-[700px]">
                {lab.desc}
              </p>
              <div className="flex flex-wrap gap-2">
                {lab.equip.map(eq => (
                  <span
                    key={eq}
                    className="font-sans text-[12px] font-medium text-ink-muted-80 border border-divider-soft px-3 py-1.5 rounded-full bg-surface-pearl uppercase tracking-widest"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gallery placeholder */}
      <div className="mt-20">
        <h2 className="font-sans text-[14px] font-semibold tracking-widest uppercase text-ink-muted-48 mb-2">
          Gallery
        </h2>
        <h3 className="font-display font-semibold text-[32px] tracking-tight mb-8 text-ink">Lab Photos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-video bg-surface-pearl rounded-lg flex items-center justify-center border border-divider-soft"
            >
              <span className="font-sans text-[12px] font-medium uppercase tracking-widest text-ink-muted-48">
                Add photo
              </span>
            </div>
          ))}
        </div>
        <p className="font-sans text-[12px] font-medium uppercase tracking-widest text-ink-muted-48 mt-6">
          Upload real lab photos via the admin panel → Gallery
        </p>
      </div>
    </div>
  )
}
