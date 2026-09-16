import { useQuery } from '@tanstack/react-query'
import { getLabs } from '../api/labs'
import SEO from '../components/SEO'
import ImageGuard from '../components/ImageGuard'
import { Skeleton } from '../components/Skeleton'

const NO_GRADIENTS = '[*]:bg-none [*]:before:bg-none'

export default function Laboratory() {
  const { data, isLoading } = useQuery({
    queryKey: ['labs'],
    queryFn: () => getLabs().then(r => r.data),
  })

  const LABS = data?.data || []

  return (
    <div className="min-h-screen bg-white text-ink pt-24 pb-24">
      <SEO
        title="Laboratories & Facilities | Electro Infinity"
        description="State-of-the-art power electronics, machines, and circuit simulation testbeds at AGEMC."
      />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <span className="font-mono text-[12px] font-medium uppercase tracking-[0.16px] text-signature-coral block mb-3">
            Hands-on Infrastructure
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal leading-[1.2] text-ink mb-4">
            Department Laboratories
          </h1>
          <p className="font-sans text-[14px] text-body leading-[1.25] max-w-2xl">
            Five specialized engineering laboratories where students bridge academic theory with circuit hardware, instrumentation, and power testbeds.
          </p>
        </div>

        {/* Labs rule-separated cards */}
        <div className="border border-hairline bg-white rounded-lg overflow-hidden">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-6 p-6 md:p-8 animate-pulse">
                <div className="w-full sm:w-48 h-48 rounded-md bg-surface-soft" />
                <div className="flex-1">
                  <div className="h-6 w-48 bg-surface-soft rounded-sm mb-3" />
                  <div className="h-4 w-full bg-surface-soft rounded-sm mb-2" />
                  <div className="h-4 w-full bg-surface-soft rounded-sm mb-2" />
                  <div className="h-4 w-3/4 bg-surface-soft rounded-sm mb-4" />
                  <div className="flex flex-wrap gap-2">
                    <div className="h-6 w-20 bg-surface-soft rounded-sm" />
                    <div className="h-6 w-24 bg-surface-soft rounded-sm" />
                    <div className="h-6 w-16 bg-surface-soft rounded-sm" />
                  </div>
                </div>
              </div>
            ))
          ) : LABS.length > 0 ? (
            LABS.map((lab, i) => (
              <div key={lab.name || i} className={`flex flex-col sm:flex-row gap-6 p-6 md:p-8 border-b border-hairline last:border-b-0 ${i % 2 ? 'bg-surface-soft' : 'bg-white'}`}>
                <ImageGuard className={`w-full sm:w-48 h-48 sm:h-auto rounded-md border border-hairline flex-shrink-0 overflow-hidden ${NO_GRADIENTS} ${i % 3 === 0 ? 'bg-signature-peach' : i % 3 === 1 ? 'bg-signature-mint' : 'bg-signature-cream'}`}>
                  {lab.image && (
                    <img
                      src={lab.image}
                      alt={lab.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </ImageGuard>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[13px] font-medium text-signature-coral">0{i + 1}.</span>
                    <h3 className="font-display font-normal text-[22px] text-ink leading-[1.35]">{lab.name}</h3>
                  </div>

                  <p className="font-sans text-[14px] text-body leading-[1.25] mb-4 max-w-3xl">
                    {lab.desc}
                  </p>

                  {lab.equip && lab.equip.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {lab.equip.map(eq => (
                        <span
                          key={eq}
                          className="font-mono text-[11px] font-medium uppercase tracking-[0.16px] px-3 py-1 rounded-sm bg-white text-ink border border-hairline"
                        >
                          {eq}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center font-sans text-[14px] text-muted">No laboratory descriptions added yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
