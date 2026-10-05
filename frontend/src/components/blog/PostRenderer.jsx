import Spans from './Spans'

const ALIGN_CLASSES = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

const LEVEL_CLASSES = {
  1: 'font-display font-normal text-section-heading text-ink mb-6',
  2: 'font-display font-normal text-card-heading text-ink mb-5',
  3: 'font-display font-normal text-feature-heading text-ink mb-4',
}

export default function PostRenderer({ blocks = [] }) {
  if (!blocks || !blocks.length) {
    return <p className="font-sans text-body text-body text-center py-12 text-muted">This post has no content yet.</p>
  }

  return (
    <div className="post-renderer space-y-8">
      {blocks.map((block, idx) => (
        <Block key={block.id || idx} block={block} idx={idx} />
      ))}
    </div>
  )
}

function Block({ block, idx }) {
  const alignClass = ALIGN_CLASSES[block.align] || 'text-left'

  switch (block.type) {
    case 'heading':
      return (
        <h2
          className={`${LEVEL_CLASSES[block.level || 1]} ${alignClass}`}
          data-block="heading"
        >
          <Spans spans={block.text || []} />
        </h2>
      )

    case 'paragraph':
      return (
        <p
          className={`font-sans text-body-large text-ink leading-relaxed ${alignClass}`}
          data-block="paragraph"
        >
          <Spans spans={block.text || []} />
        </p>
      )

    case 'image':
      return (
        <figure
          key={`img-${idx}`}
          className={`mx-auto ${alignClass}`}
        >
          <img
            src={block.src}
            alt={block.alt || ''}
            loading="lazy"
            width={1200}
            height={800}
            className="max-w-full h-auto rounded-lg border border-hairline bg-surface-soft object-cover"
          />
          {block.caption && (
            <figcaption className="font-sans text-caption text-muted text-center mt-2">
              {block.caption}
            </figcaption>
          )}
        </figure>
      )

    case 'quote':
      return (
        <blockquote
          className={`border-l-4 border-border-strong bg-surface-soft py-4 px-6 rounded-lg ${alignClass}`}
          data-block="quote"
        >
          <Spans spans={block.text || []} />
        </blockquote>
      )

    case 'list':
      return (
        <ListBlock block={block} alignClass={alignClass} idx={idx} />
      )

    case 'code':
      return (
        <pre
          className="overflow-x-auto rounded-lg bg-surface-soft p-4 text-sm"
          data-block="code"
        >
          <code className={`font-mono text-[13px] text-ink whitespace-pre-wrap break-words ${alignClass}`}>
            <Spans spans={block.text || []} />
          </code>
        </pre>
      )

    case 'divider':
      return <div className="border-t border-hairline" data-block="divider" />

    default:
      return null
  }
}

function ListBlock({ block, alignClass, idx }) {
  const items = block.items || []
  const isNumbered = block.listStyle === 'number'

  const listItemClass = alignClass === 'text-center'
    ? 'text-center'
    : alignClass === 'text-right'
      ? 'text-right'
      : 'text-left'

  if (isNumbered) {
    return (
      <ol className={`ml-6 space-y-1 text-ink ${alignClass}`} data-block="list">
        {items.map((item, i) => (
          <li key={item.id || `${idx}-${i}`} className={listItemClass}>
            <span className={`font-sans text-body-large text-ink leading-relaxed inline-block`}>
              <Spans spans={item.spans || item || []} />
            </span>
          </li>
        ))}
      </ol>
    )
  }

  return (
    <ul className={`ml-6 space-y-1 list-disc text-ink ${alignClass}`} data-block="list">
      {items.map((item, i) => (
        <li key={item.id || `${idx}-${i}`} className={listItemClass}>
          <span className={`font-sans text-body-large text-ink leading-relaxed inline-block`}>
            <Spans spans={item.spans || item || []} />
          </span>
        </li>
      ))}
    </ul>
  )
}
