import React from 'react'

const STUDENT_ACH = [
  { name:'Ankita Barman',   desc:'GATE 2026 qualified — score 618, EE branch topper from AGEMC.', year:'2026', photo: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800' },
  { name:'Rajesh Mondal',   desc:'Selected as Junior Engineer at WBSEDCL. Top ranker in written exam.', year:'2025', photo: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800' },
  { name:'Suman Karmakar',  desc:'1st Prize, Circuit Design Competition — MAKAUT Tech Fest 2025.', year:'2025', photo: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=800' },
  { name:'Priti Dey',       desc:'Internship at ABB India. Published paper on power factor correction.', year:'2025', photo: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=800' },
]

const FACULTY_ACH = [
  { name:'Dr. Placeholder', desc:'Published research paper in IEEE Transactions on Power Systems.', year:'2026', photo: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=800' },
  { name:'Prof. Placeholder',desc:'Best Teacher Award — MAKAUT 2025.', year:'2025', photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800' },
]

const AWARDS = [
  { name:'Best EE Department',        desc:'MAKAUT Regional Assessment 2025 — ranked top 5 EE departments.',    year:'2025', photo: 'https://images.unsplash.com/photo-1561489422-45e3d2ce350f?auto=format&fit=crop&q=80&w=800' },
  { name:'Lab Infrastructure Award',  desc:'State Technical Education Board recognition for lab upgrade.',       year:'2024', photo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800' },
]

function AchCard({ item, badgeText }) {
  return (
    <div className="flex flex-col overflow-hidden transition-all duration-300 transform border group bg-surface-pearl border-divider-soft rounded-2xl hover:shadow-xl hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden sm:h-56 bg-canvas">
        {item.photo ? (
          <img 
            src={item.photo} 
            alt={item.name} 
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-canvas-parchment">
            <span className="font-sans text-ink-muted-48">No Photo</span>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-canvas/90 backdrop-blur-sm border border-divider-soft px-2.5 py-1 rounded-md shadow-sm">
          <span className="font-sans text-[11px] font-bold text-primary uppercase tracking-widest">{item.year}</span>
        </div>
        {badgeText && (
          <div className="absolute bottom-3 left-3 bg-primary text-white px-2.5 py-1 rounded-md shadow-md">
            <span className="font-sans text-[11px] font-bold uppercase tracking-widest">{badgeText}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col flex-grow p-5">
        <h3 className="font-display font-semibold text-[18px] text-ink mb-2 line-clamp-1">{item.name}</h3>
        <p className="font-sans text-[14px] text-ink-muted-80 leading-relaxed flex-grow line-clamp-3">
          {item.desc}
        </p>
      </div>
    </div>
  )
}

export default function Achievements() {
  return (
    <div className="min-h-screen pb-20 bg-canvas pt-28">
      <div className="px-6 mx-auto max-w-7xl">
        <div className="max-w-2xl mx-auto mb-16 text-center">
          <span className="font-sans text-[13px] font-semibold text-primary uppercase tracking-[0.2em] mb-3 block">Pride of the Department</span>
          <h1 className="font-display font-semibold text-[40px] md:text-[56px] text-ink leading-[1.1] tracking-tight">
            Achievements
          </h1>
          <p className="font-sans text-[16px] text-ink-muted-80 mt-6 leading-relaxed">
            Celebrating the outstanding accomplishments of our students, faculty, and the electrical engineering department.
          </p>
        </div>

        <div className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-display font-semibold text-[28px] text-ink tracking-tight">Student Achievements</h2>
            <div className="flex-grow h-px mt-2 bg-divider-soft"></div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {STUDENT_ACH.map(a => <AchCard key={a.name} item={a} badgeText="Student" />)}
          </div>
        </div>

        <div className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-display font-semibold text-[28px] text-ink tracking-tight">Faculty Achievements</h2>
            <div className="flex-grow h-px mt-2 bg-divider-soft"></div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {FACULTY_ACH.map(a => <AchCard key={a.name} item={a} badgeText="Faculty" />)}
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-display font-semibold text-[28px] text-ink tracking-tight">Awards & Certificates</h2>
            <div className="flex-grow h-px mt-2 bg-divider-soft"></div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {AWARDS.map(a => <AchCard key={a.name} item={a} badgeText="Award" />)}
          </div>
        </div>

        <div className="pt-8 mt-16 text-center border-t border-divider-soft">
          <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-ink-muted-48">
            Replace placeholder data with real achievements — or connect to MongoDB in Phase 4 admin panel
          </p>
        </div>
      </div>
    </div>
  )
}
