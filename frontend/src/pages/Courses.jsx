import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'

const SEMESTERS = [
  { sem: 3, subjects: [
      { code: 'PC-EE 301', name: 'Electric Circuit Theory', credits: 4 },
      { code: 'PC-EE 302', name: 'Analog Electronics', credits: 3 },
      { code: 'PC-EE 303', name: 'Electromagnetic Field Theory', credits: 3 },
      { code: 'ES-ME 301', name: 'Engineering Mechanics', credits: 3 },
      { code: 'BS-M 301', name: 'Mathematics-III', credits: 3 },
      { code: 'BS-EE301', name: 'Biology for Engineers', credits: 3 },
      { code: 'MC-EE 301', name: 'Indian Constitution', credits: 0 },
      { code: 'PC-EE 391', name: 'Electric Circuit Theory Lab', credits: 1 },
      { code: 'PC-EE 392', name: 'Analog Electronics Lab', credits: 1 },
      { code: 'PC-CS 391', name: 'Numerical Methods Lab', credits: 1 },
  ]},
  { sem: 4, subjects: [
      { code: 'PC-EE 401', name: 'Electric Machine-I', credits: 3 },
      { code: 'PC-EE 402', name: 'Digital Electronics', credits: 3 },
      { code: 'PC-EE 403', name: 'Electrical & Electronics Measurement', credits: 3 },
      { code: 'ES-EE 401', name: 'Thermal Power Engineering', credits: 3 },
      { code: 'HM-EE401', name: 'Values and Ethics in Profession', credits: 3 },
      { code: 'MC-EE401', name: 'Environmental Science', credits: 0 },
      { code: 'PC-EE 491', name: 'Electric Machine-I Lab', credits: 1 },
      { code: 'PC-EE 492', name: 'Digital Electronics Lab', credits: 1 },
      { code: 'PC-EE 493', name: 'Electrical & Electronic Measurement Lab', credits: 1 },
      { code: 'ES-ME 491', name: 'Thermal Power Engineering Lab', credits: 1 },
  ]},
  { sem: 5, subjects: [
      { code: 'PC-EE 501', name: 'Electric Machine-II', credits: 3 },
      { code: 'PC-EE 502', name: 'Power System-I', credits: 3 },
      { code: 'PC-EE 503', name: 'Control System', credits: 3 },
      { code: 'PC-EE 504', name: 'Power Electronics', credits: 3 },
      { code: 'PE-EE 501', name: 'Professional Elective I', credits: 3 },
      { code: 'OE-EE 501', name: 'Open Elective I', credits: 3 },
      { code: 'PC-EE 591', name: 'Electric Machine-II Lab', credits: 1 },
      { code: 'PC-EE 592', name: 'Power System-I Lab', credits: 1 },
      { code: 'PC-EE 593', name: 'Control System Lab', credits: 1 },
      { code: 'PC-EE 594', name: 'Power Electronics Lab', credits: 1 },
  ]},
  { sem: 6, subjects: [
      { code: 'PC-EE 601', name: 'Power System-II', credits: 3 },
      { code: 'PC-EE 602', name: 'Microprocessor & Microcontroller', credits: 3 },
      { code: 'PE-EE 601', name: 'Professional Elective II', credits: 3 },
      { code: 'PE-EE 602', name: 'Professional Elective III', credits: 3 },
      { code: 'OE-EE 601', name: 'Open Elective II', credits: 3 },
      { code: 'HM-EE 601', name: 'Economics for Engineers', credits: 3 },
      { code: 'PC-EE 691', name: 'Power System-II Lab', credits: 1 },
      { code: 'PC-EE 692', name: 'Microprocessor & Microcontroller Lab', credits: 1 },
      { code: 'PC-EE 681', name: 'Electrical & Electronic Design Lab', credits: 3 },
  ]},
  { sem: 7, subjects: [
      { code: 'PC-EE 701', name: 'Electric Drive', credits: 3 },
      { code: 'PE-EE 701', name: 'Professional Elective IV', credits: 3 },
      { code: 'OE-EE 701', name: 'Open Elective III', credits: 3 },
      { code: 'OE-EE 702', name: 'Open Elective IV', credits: 3 },
      { code: 'HM-EE 701', name: 'Principles of Management', credits: 3 },
      { code: 'PC-EE 791', name: 'Electric Drive Lab', credits: 1 },
      { code: 'PW-EE 781', name: 'Project Stage-I', credits: 2 },
      { code: 'PW-EE 782', name: 'Seminar', credits: 1 },
  ]},
  { sem: 8, subjects: [
      { code: 'PC-EE 801', name: 'Utilization of Electric Power', credits: 3 },
      { code: 'PE-EE 801', name: 'Professional Elective V', credits: 3 },
      { code: 'OE-EE 801', name: 'Open Elective V', credits: 3 },
      { code: 'PW-EE 881', name: 'Project Stage-II', credits: 8 },
  ]}
]

export default function Courses() {
  const [selectedSem, setSelectedSem] = useState(3)
  const navigate = useNavigate()

  const currentData = SEMESTERS.find(s => s.sem === selectedSem) || SEMESTERS[0]

  return (
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <SEO
        title="Curriculum & Courses | Electro Infinity"
        description="Semester-wise subjects under the MAKAUT-affiliated B.Tech Electrical Engineering curriculum."
      />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <span className="font-mono text-[12px] uppercase tracking-wider text-coral font-semibold block mb-2">
            Academic Curriculum
          </span>
          <h1 className="font-display text-[40px] md:text-[56px] font-normal tracking-tight text-ink mb-4">
            B.Tech Electrical Engineering
          </h1>
          <p className="font-sans text-[17px] text-body-muted leading-relaxed">
            MAKAUT-affiliated 4-year degree roadmap spanning power systems, circuits, electronics, and lab practicums.
          </p>
        </div>

        {/* Semester selector pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none border-b border-hairline">
          {SEMESTERS.map(({ sem }) => (
            <button
              key={sem}
              onClick={() => setSelectedSem(sem)}
              className={`font-sans text-[14px] font-semibold px-5 py-2 rounded-full transition-all whitespace-nowrap ${
                selectedSem === sem
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-soft-stone text-body-muted hover:text-ink'
              }`}
            >
              Semester {sem}
            </button>
          ))}
        </div>

        {/* Course Table (Research-Table style) */}
        <div className="border border-hairline bg-canvas rounded-2xl overflow-hidden shadow-card">
          <div className="p-6 bg-soft-stone border-b border-hairline flex items-center justify-between">
            <h2 className="font-display text-[20px] font-bold text-ink">
              Semester {selectedSem} Course List
            </h2>
            <span className="font-mono text-[12px] text-slate">
              {currentData.subjects.length} Subjects · Total {currentData.subjects.reduce((a, b) => a + b.credits, 0)} Credits
            </span>
          </div>

          <div className="divide-y divide-hairline">
            {currentData.subjects.map((sub) => (
              <div
                key={sub.code}
                onClick={() => navigate(`/courses/${encodeURIComponent(sub.code.toLowerCase().replace(/\s+/g, '-'))}`)}
                className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-soft-stone/40 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-mono text-[12px] font-bold uppercase tracking-wider px-3 py-1 rounded-md bg-pale-blue text-action-blue border border-blue-200 flex-shrink-0">
                    {sub.code}
                  </span>
                  <div>
                    <h3 className="font-sans text-[16px] font-semibold text-ink">{sub.name}</h3>
                    <p className="font-sans text-[12px] text-body-muted">
                      {sub.code.startsWith('PC') ? 'Program Core' : sub.code.startsWith('PE') ? 'Professional Elective' : sub.code.startsWith('BS') ? 'Basic Science' : 'Engineering Core'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 flex-shrink-0">
                  <span className="font-mono text-[13px] font-semibold text-ink bg-soft-stone px-3 py-1 rounded-full">
                    {sub.credits} {sub.credits === 1 ? 'Credit' : 'Credits'}
                  </span>
                  <span className="text-[13px] font-medium text-action-blue">
                    Syllabus Details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
