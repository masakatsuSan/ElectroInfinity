import { isExternalLink } from '../../utils/blogBlocks'

export default function Spans({ spans = [] }) {
  if (!spans || !spans.length) return null

  return (
    <>
      {spans.map((span, i) => {
        let node = span.t || ''

        const key = `${i}-${span.t.slice(0, 4)}`

        if (span.code) {
          node = <code key={key} className="font-mono text-[13px] bg-surface-soft text-ink/80 rounded px-1.5 py-0.5">{node}</code>
        }

        if (span.bold) {
          node = <strong key={key} className="font-semibold">{node}</strong>
        }

        if (span.italic) {
          node = <em key={key} className="italic">{node}</em>
        }

        if (span.underline) {
          node = <u key={key} className="underline decoration-[1px] underline-offset-3">{node}</u>
        }

        if (span.link) {
          const external = isExternalLink(span.link)
          node = (
            <a
              key={key}
              href={span.link}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className="text-link hover:text-link-active underline decoration-[1px] underline-offset-2"
            >
              {node}
            </a>
          )
        }

        return node
      })}
    </>
  )
}
