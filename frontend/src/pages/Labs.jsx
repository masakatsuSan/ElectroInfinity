import { useQuery } from '@tanstack/react-query'
import { getLabs } from '../api/labs'
import SEO from '../components/SEO'

export default function Laboratory() {
  const { data, isLoading } = useQuery({
    queryKey: ['labs'],
    queryFn: () => getLabs().then(r => r.data),
  })

  const LABS = data?.data || []

  return (
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <SEO
        title="Laboratories & Facilities | Electro Infinity"
        description="State-of-the-art power electronics, machines, and circuit simulation testbeds at AGEMC."
      />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
            Hands-on Infrastructure
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal tracking-tight text-ink mb-4">
            Department Laboratories
          </h1>
          <p className="font-sans text-[17px] text-body-muted leading-relaxed">
            Five specialized engineering laboratories where students bridge academic theory with circuit hardware, instrumentation, and power testbeds.
          </p>
        </div>

        {/* Labs rule-separated cards */}
        <div className="border border-hairline bg-canvas rounded-2xl overflow-hidden shadow-card divide-y divide-hairline">
          {isLoading ? (
            <div className="p-12 text-center text-slate">Loading laboratory facilities…</div>
          ) : LABS.length > 0 ? (
            LABS.map((lab, i) => (
              <div key={lab.name || i} className="flex flex-col sm:flex-row gap-6 p-6 md:p-8 hover:bg-soft-stone/30 transition-colors">
                {lab.image && (
                  <img
                    src={lab.image}
                    alt={lab.name}
                    className="w-full sm:w-48 h-48 sm:h-auto object-cover rounded-2xl border border-hairline flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-[13px] font-bold text-coral">0{i + 1}.</span>
                    <h3 className="font-display font-bold text-[22px] text-ink">{lab.name}</h3>
                  </div>

                  <p className="font-sans text-[15px] text-body-muted leading-relaxed mb-4 max-w-3xl">
                    {lab.desc}
                  </p>

                  {lab.equip && lab.equip.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {lab.equip.map(eq => (
                        <span
                          key={eq}
                          className="font-mono text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-soft-stone text-ink border border-hairline"
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
            <div className="p-12 text-center text-body-muted">No laboratory descriptions added yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
