const LABS = [
  {
    name: 'Power System Lab',
    icon: '⚡',
    desc: 'Equipped with power system simulator, load flow analysis tools, fault analysis kits and SCADA demo panels. Students conduct experiments on transmission line models and protective relays.',
    equip: ['Power System Simulator', 'Load Flow Kit', 'Fault Analysis Unit', 'SCADA Panel', 'Protective Relay Trainer', 'Transmission Line Model'],
  },
  {
    name: 'Electrical Machines Lab',
    icon: '⚙️',
    desc: 'Houses DC motors, AC motors, transformers, alternators and special machines. All machines are wired for standard speed-torque characteristic experiments and efficiency tests.',
    equip: ['DC Motor-Generator Set', '3-Phase Induction Motor', 'Single-Phase Transformer', 'Alternator', 'Servo Motor', 'Universal Motor'],
  },
  {
    name: 'Power Electronics Lab',
    icon: '🔋',
    desc: 'SCRs, MOSFETs, IGBTs and complete converter/inverter kits for hands-on power electronics. Includes firing circuit trainers and DC drive experiment panels.',
    equip: ['SCR/TRIAC Trainer', 'Buck-Boost Converter', 'Single/Three Phase Inverter', 'DC Drive Panel', 'IGBT Module', 'Gate Drive Circuit Trainer'],
  },
  {
    name: 'Control System Lab',
    icon: '🎛️',
    desc: 'PID controllers, analog and digital control system trainers, servo systems and MATLAB-based simulations. Students design and test closed-loop control systems.',
    equip: ['PID Controller Trainer', 'Servo System Trainer', 'Process Control Simulator', 'MATLAB/Simulink Station', 'Root Locus Plotter', 'Digital Controller Kit'],
  },
  {
    name: 'Measurement Lab',
    icon: '📏',
    desc: 'Precision measurement instruments including CROs, function generators, LCR meters, energy meters and calibration equipment for electrical measurements and instrumentation.',
    equip: ['Cathode Ray Oscilloscope', 'Digital LCR Meter', 'Energy Meter Calibration Kit', 'Function Generator', 'Digital Multimeter', 'Kelvin Double Bridge'],
  },
]

export default function Laboratory() {
  return (
    <div className="page-wrap pt-32 pb-20 min-h-screen bg-canvas text-ink">
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
