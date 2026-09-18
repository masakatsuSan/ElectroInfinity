import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Play, FileText, Download, FolderOpen,
} from 'lucide-react'
import { getFolders, getFolder } from '../api/folders'
import { downloadResource } from '../api/resources'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'
import ResourcePreviewDrawer from '../components/ResourcePreviewDrawer'

const SEM_LABELS = { 0: 'General', 1: 'Semester 1', 2: 'Semester 2', 3: 'Semester 3', 4: 'Semester 4', 5: 'Semester 5', 6: 'Semester 6', 7: 'Semester 7', 8: 'Semester 8' }

export default function ResourceFolders() {
  const { id } = useParams()
  const { user } = useAuth()
  const [previewResource, setPreviewResource] = useState(null)

  const { data: foldersData, isLoading: listLoading } = useQuery({
    queryKey: ['folders', 'public'],
    queryFn: () => getFolders().then(r => r.data),
    staleTime: 60000,
  })
  const folders = foldersData?.data || []

  const { data: folderData, isLoading: detailLoading } = useQuery({
    queryKey: ['folder', id, 'public'],
    queryFn: () => getFolder(id),
    enabled: !!id,
    staleTime: 60000,
  })

  const bySem = {}
  folders.forEach(f => {
    const key = f.semester || 0
    ;(bySem[key] = bySem[key] || []).push(f)
  })
  const semesters = Object.keys(bySem).map(Number).sort((a, b) => a - b)

  const folder = id ? folderData : null

  return (
    <div className="min-h-screen bg-white text-ink pt-36 pb-28">
      <SEO
        title="Study Folders &amp; Series | Electro Infinity"
        description="Semester-wise, subject-wise curated folders of notes, PDFs, and YouTube lecture series."
        path="/resources/folders"
      />
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {id ? (
          <>
            {detailLoading ? (
              <p className="font-[Inter,system-ui,sans-serif] text-ink-muted-80 text-[15px]">Loading folder…</p>
            ) : !folder ? (
              <p className="font-[Inter,system-ui,sans-serif] text-ink-muted-80 text-[15px]">Folder not found.</p>
            ) : (
              <FolderDetail key={id} folder={folder} onPreview={setPreviewResource} />
            )}
          </>
        ) : (
          <>
            <div className="max-w-2xl mb-12">
              <span className="font-mono text-[12px] uppercase tracking-wider text-signature-coral font-medium block mb-2">
                Study Vault
              </span>
              <h1 className="font-display text-[40px] md:text-[56px] font-normal tracking-tight text-ink mb-4">
                Resource Folders
              </h1>
              <p className="font-sans text-[17px] text-body leading-relaxed">
                Curated, semester-wise folders of notes, previous-year papers, and official YouTube lecture series for your courses.
              </p>
              {!user && (
                <p className="font-sans text-[14px] text-muted mt-3">
                  Sign in to see folders published for your batch.
                </p>
              )}
            </div>

            {listLoading ? (
              <div className="space-y-8">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="w-40 h-6 rounded bg-soft-stone/40 animate-pulse" />
                ))}
              </div>
            ) : semesters.length === 0 ? (
              <div className="py-16 text-center border border-hairline bg-soft-stone rounded-xl">
                <FolderOpen size={32} className="mx-auto mb-3 text-muted" />
                <p className="font-sans text-[16px] text-body-muted">No folders published yet.</p>
              </div>
            ) : (
              semesters.map(sem => (
                <div key={sem} className="mb-8">
                  <h2 className="font-[Inter,system-ui,sans-serif] font-semibold text-[18px] text-ink mb-4">{SEM_LABELS[sem]}</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {bySem[sem].map(f => (
                      <FolderCard key={f._id} folder={f} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
      <ResourcePreviewDrawer
        resource={previewResource}
        onClose={() => setPreviewResource(null)}
      />
    </div>
  )
}

function FolderCard({ folder }) {
  const itemCount = (folder.items || []).length
  return (
    <Link
      to={`/resources/folders/${folder._id}`}
      className="block p-5 transition-colors bg-white border group border-hairline rounded-xl hover:bg-soft-stone/30"
    >
      <div className="flex items-start gap-3">
        <FolderOpen size={20} className="text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-sans text-[15px] font-medium text-ink leading-snug truncate">
            {folder.title}
          </h3>
          {folder.subject && (
            <p className="font-sans text-[13px] text-muted mt-1 truncate">{folder.subject}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {folder.semester && (
              <span className="font-mono text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-full bg-soft-stone text-ink">
                Sem {folder.semester}
              </span>
            )}
            <span className="font-mono text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-full bg-soft-stone text-ink">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
            <span className={'font-mono text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-full ' + (
              folder.visibility === 'GLOBAL'
                ? 'bg-deep-green/10 text-deep-green'
                : 'bg-soft-stone text-ink'
            )}>
              {folder.visibility}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function FolderDetail({ folder, onPreview }) {
  const items = folder.items || []
  const resources = items.filter(item => item.type === 'resource')
  const lectures = items.filter(item => item.type === 'lecture')
  const [activeType, setActiveType] = useState('resource')
  const activeItems = activeType === 'resource' ? resources : lectures

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 font-sans text-[13px] text-muted">
          <li>
            <Link to="/resources" className="transition-colors hover:text-ink">Resources</Link>
          </li>
          <li><ChevronRight size={14} /></li>
          <li>
            <Link to="/resources/folders" className="transition-colors hover:text-ink">Folders</Link>
          </li>
          <li><ChevronRight size={14} /></li>
          <li aria-current="page" className="font-medium truncate text-ink">{folder.title}</li>
        </ol>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <FolderOpen size={24} className="text-primary" />
        <h1 className="font-display text-[36px] md:text-[44px] font-normal tracking-tight text-ink">{folder.title}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 mb-6">
        {folder.subject && (
          <span className="font-mono text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-full bg-soft-stone text-ink">
            {folder.subject}
          </span>
        )}
        {folder.semester && (
          <span className="font-mono text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-full bg-soft-stone text-ink">
            Semester {folder.semester}
          </span>
        )}
        <span className="font-mono text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-full bg-soft-stone text-ink">
          {folder.visibility}
        </span>
        {folder.description && (
          <p className="font-sans text-[14px] text-body mt-2 w-full">{folder.description}</p>
        )}
      </div>

      {items.length === 0 ? (
        <p className="font-sans text-[16px] text-body-muted py-16 text-center border border-hairline bg-soft-stone rounded-xl">
          This folder has no items yet.
        </p>
      ) : (
        <div>
          <div className="flex gap-2 pb-4 mb-6 overflow-x-auto border-b border-hairline" role="tablist" aria-label="Folder content">
            <button
              type="button"
              role="tab"
              aria-selected={activeType === 'resource'}
              onClick={() => setActiveType('resource')}
              className={'font-sans text-[14px] font-medium px-5 py-2 rounded-full transition-all whitespace-nowrap ' + (
                activeType === 'resource'
                  ? 'bg-primary text-white'
                  : 'bg-soft-stone text-muted hover:text-ink'
              )}
            >
              PDFs <span className="opacity-80">({resources.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeType === 'lecture'}
              onClick={() => setActiveType('lecture')}
              className={'font-sans text-[14px] font-medium px-5 py-2 rounded-full transition-all whitespace-nowrap ' + (
                activeType === 'lecture'
                  ? 'bg-primary text-white'
                  : 'bg-soft-stone text-muted hover:text-ink'
              )}
            >
              YT Lectures <span className="opacity-80">({lectures.length})</span>
            </button>
          </div>

          <div className="space-y-3">
            {activeItems.length === 0 ? (
              <p className="font-sans text-[16px] text-body-muted py-16 text-center border border-hairline bg-soft-stone rounded-xl">
                No {activeType === 'resource' ? 'PDFs' : 'lectures'} in this folder yet.
              </p>
            ) : (
              activeItems.map((item, i) => (
                <div
                  key={item.ref + '-' + item.type}
                  className="flex items-center gap-4 p-4 transition-colors bg-white border border-hairline rounded-xl hover:bg-soft-stone/30"
                >
                  <span className="font-mono text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-md bg-soft-stone text-ink flex-shrink-0">
                    {i + 1}
                  </span>
                  {item.type === 'resource' ? (
                    <FileText size={18} className="flex-shrink-0 text-primary" />
                  ) : (
                    <img
                      src={item.thumbnail || `https://img.youtube.com/vi/${item.data?.youtubeVideoId}/hqdefault.jpg`}
                      alt={item.title}
                      className="flex-shrink-0 object-cover w-12 rounded h-7"
                      onError={(e) => {
                        if (item.data?.youtubeVideoId) e.target.src = `https://img.youtube.com/vi/${item.data.youtubeVideoId}/hqdefault.jpg`
                      }}
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[15px] font-medium text-ink leading-snug truncate">
                      {item.title}
                    </p>
                    {item.type === 'resource' && item.data?.fileName ? (
                      <p className="font-mono text-[11px] text-muted mt-1 truncate">{item.data.fileName}</p>
                    ) : null}
                    {item.type === 'lecture' && item.data?.lectureNumber ? (
                      <p className="font-mono text-[11px] font-medium uppercase px-2 py-0.5 rounded-md bg-soft-stone text-ink inline-block mt-1">
                        Lecture {item.data.lectureNumber}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center flex-shrink-0 gap-1">
                    {item.type === 'resource' && item.data?._id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onPreview(item.data)}
                          className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-blue-500/70 hover:text-blue-500 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-md flex items-center gap-1"
                        >
                          <FileText size={12} /> Preview
                        </button>
                        <a
                          href={downloadResource(item.data._id)}
                          className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-ink-muted-80 hover:text-ink transition-colors bg-soft-stone hover:bg-soft-stone/50 px-3 py-1.5 rounded-md flex items-center gap-1"
                        >
                          <Download size={12} /> Download
                        </a>
                      </>
                    ) : null}
                    {item.type === 'lecture' && item.data?.youtubeVideoId ? (
                      <a
                        href={`https://www.youtube.com/watch?v=${item.data.youtubeVideoId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-[Inter,system-ui,sans-serif] text-[13px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-md flex items-center gap-1"
                      >
                        <Play size={12} /> Watch
                      </a>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
