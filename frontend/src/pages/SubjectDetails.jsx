import { useParams, useNavigate } from 'react-router-dom';
import { getCourseDetails } from '../data/syllabus';

export default function SubjectDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = getCourseDetails(courseId);

  return (
    <div className="container pt-32 pb-20 min-h-screen bg-canvas text-ink">
      <button 
        onClick={() => navigate('/courses')}
        className="inline-flex items-center gap-2 font-sans text-[14px] font-medium text-ink-muted-80 hover:text-ink transition-colors mb-8"
      >
        ← Back to Curriculum
      </button>

      <div className="mb-12">
        <h2 className="font-display font-medium text-[20px] text-primary tracking-wide mb-2 uppercase">
          {course.code}
        </h2>
        <h1 className="font-display font-semibold text-[clamp(32px,6vw,56px)] leading-tight tracking-tight text-ink mb-6">
          {course.title}
        </h1>
        
        {/* Structure overview */}
        <div className="flex flex-wrap gap-4">
          <div className="bg-surface-pearl border border-divider-soft rounded-[20px] px-6 py-4 flex items-center gap-4 shadow-sm">
            <span className="font-sans text-[13px] font-bold uppercase tracking-widest text-[#696969]">Credits</span>
            <span className="font-display font-medium text-[24px] text-ink">{course.credits}</span>
          </div>
          <div className="bg-surface-pearl border border-divider-soft rounded-[20px] px-6 py-4 flex gap-6 shadow-sm">
            <div className="flex flex-col items-center">
              <span className="font-sans text-[13px] font-bold uppercase tracking-widest text-[#696969]">L</span>
              <span className="font-display font-medium text-[24px] text-ink">{course.l}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-sans text-[13px] font-bold uppercase tracking-widest text-[#696969]">T</span>
              <span className="font-display font-medium text-[24px] text-ink">{course.t}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-sans text-[13px] font-bold uppercase tracking-widest text-[#696969]">P</span>
              <span className="font-display font-medium text-[24px] text-ink">{course.p}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-12 items-start">
        <div className="space-y-12">
          {/* Objectives */}
          {course.objectives && course.objectives.length > 0 && (
            <section>
              <h3 className="font-display font-semibold text-[28px] text-ink mb-6">Course Objectives</h3>
              <ul className="space-y-4">
                {course.objectives.map((obj, i) => (
                  <li key={i} className="flex gap-4 font-sans text-[17px] font-[450] leading-relaxed text-ink-muted-80">
                    <span className="text-primary font-semibold">{i + 1}.</span>
                    {obj}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Modules */}
          {course.modules && course.modules.length > 0 && (
            <section>
              <h3 className="font-display font-semibold text-[28px] text-ink mb-6">Detailed Syllabus</h3>
              <div className="space-y-6">
                {course.modules.map((mod, i) => (
                  <div key={i} className="bg-surface-pearl border border-divider-soft rounded-[24px] p-8 shadow-sm">
                    <h4 className="font-display font-medium text-[20px] text-ink tracking-tight mb-4">{mod.title}</h4>
                    <ul className="list-disc pl-5 space-y-2 marker:text-primary">
                      {mod.topics.map((topic, j) => (
                        <li key={j} className="font-sans text-[16px] font-[450] leading-relaxed text-ink-muted-80">
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar / Recommended Books */}
        {course.books && course.books.length > 0 && (
          <aside className="bg-canvas-parchment rounded-[24px] p-8">
            <h3 className="font-display font-semibold text-[22px] text-ink mb-6">Reference Books</h3>
            <ul className="space-y-4">
              {course.books.map((book, i) => (
                <li key={i} className="font-sans text-[15px] font-[450] leading-relaxed text-ink border-b border-divider-soft pb-4 last:border-b-0 last:pb-0">
                  {book}
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
