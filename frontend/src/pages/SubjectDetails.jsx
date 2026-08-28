import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSubject } from '../api/subjects';
import SEO from '../components/SEO';

export default function SubjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ['subject', id],
    queryFn: () => getSubject(id).then(r => r.data),
    enabled: !!id,
  });

  const course = data?.data || {};

  if (isLoading) return (
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <div className="h-4 w-32 bg-soft-stone rounded animate-pulse mb-8" />
        <div className="mb-12">
          <div className="h-5 w-24 bg-soft-stone rounded animate-pulse mb-2" />
          <div className="h-12 w-full max-w-lg bg-soft-stone rounded animate-pulse mb-6" />
          <div className="flex flex-wrap gap-4">
            <div className="h-16 w-32 bg-soft-stone rounded-2xl animate-pulse" />
            <div className="h-16 w-40 bg-soft-stone rounded-2xl animate-pulse" />
          </div>
        </div>
        <div className="grid lg:grid-cols-[1fr_350px] gap-12">
          <div className="space-y-12">
            <div>
              <div className="h-8 w-48 bg-soft-stone rounded animate-pulse mb-6" />
              <div className="space-y-4">
                <div className="h-5 w-full bg-soft-stone rounded animate-pulse" />
                <div className="h-5 w-full bg-soft-stone rounded animate-pulse" />
                <div className="h-5 w-3/4 bg-soft-stone rounded animate-pulse" />
              </div>
            </div>
            <div>
              <div className="h-8 w-40 bg-soft-stone rounded animate-pulse mb-6" />
              <div className="space-y-6">
                <div className="h-40 bg-soft-stone rounded-3xl animate-pulse" />
                <div className="h-40 bg-soft-stone rounded-3xl animate-pulse" />
              </div>
            </div>
          </div>
          <aside className="h-64 bg-soft-stone rounded-3xl animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (error || !course.code) return (
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <p className="font-sans text-coral">Course not found.</p>
        <button onClick={() => navigate('/courses')} className="button-secondary mt-4">Back to Courses</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas text-ink pt-36 pb-28">
      <SEO
        title={'Syllabus | ' + course.code + ' - ' + course.name}
        description={'Detailed syllabus, modules, and reference books for ' + course.name}
      />
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <button onClick={() => navigate('/courses')} className="inline-flex items-center gap-2 font-sans text-[14px] font-medium text-ink-muted-80 hover:text-ink transition-colors mb-8">
          ← Back to Curriculum
        </button>

        <div className="mb-12">
          <h2 className="font-display font-medium text-[20px] text-primary tracking-wide mb-2 uppercase">{course.code}</h2>
          <h1 className="font-display font-semibold text-[32px] md:text-[56px] leading-tight tracking-tight text-ink mb-6">{course.name}</h1>
          <div className="flex flex-wrap gap-4">
            <div className="bg-surface-pearl border border-divider-soft rounded-[20px] px-6 py-4 flex items-center gap-4 shadow-sm">
              <span className="font-sans text-[13px] font-bold uppercase tracking-widest text-[#696969]">Credits</span>
              <span className="font-display font-medium text-[24px] text-ink">{course.credits}</span>
            </div>
            <div className="bg-surface-pearl border border-divider-soft rounded-[20px] px-6 py-4 flex gap-6 shadow-sm">
              <div className="flex flex-col items-center">
                <span className="font-sans text-[13px] font-bold uppercase tracking-widest text-[#696969]">L</span>
                <span className="font-display font-medium text-[24px] text-ink">{course.l || 0}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-sans text-[13px] font-bold uppercase tracking-widest text-[#696969]">T</span>
                <span className="font-display font-medium text-[24px] text-ink">{course.t || 0}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-sans text-[13px] font-bold uppercase tracking-widest text-[#696969]">P</span>
                <span className="font-display font-medium text-[24px] text-ink">{course.p || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_350px] gap-12 items-start">
          <div className="space-y-12">
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

            {course.syllabus && (
              <section>
                <h3 className="font-display font-semibold text-[28px] text-ink mb-6">Detailed Syllabus</h3>
                <p className="font-sans text-[16px] text-ink-muted-80 leading-relaxed whitespace-pre-wrap">{course.syllabus}</p>
              </section>
            )}

            {course.modules && course.modules.length > 0 && (
              <section>
                <h3 className="font-display font-semibold text-[28px] text-ink mb-6">Modules</h3>
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

          {course.referenceBooks && course.referenceBooks.length > 0 && (
            <aside className="bg-canvas-parchment rounded-[24px] p-8">
              <h3 className="font-display font-semibold text-[22px] text-ink mb-6">Reference Books</h3>
              <ul className="space-y-4">
                {course.referenceBooks.map((book, i) => (
                  <li key={i} className="font-sans text-[15px] font-[450] leading-relaxed text-ink border-b border-divider-soft pb-4 last:border-b-0 last:pb-0">
                    {book}
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
