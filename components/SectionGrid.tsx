'use client'

import { WorkTile } from './WorkTile'
import { workKey, type CatalogEntry } from '@/lib/gyeol/types'
import type { Section } from '@/lib/gyeol/sections'

export function SectionGrid({
  sections,
  selected,
  onToggle,
}: {
  sections: Section[]
  selected: ReadonlySet<string>
  onToggle: (work: CatalogEntry) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <section key={section.name}>
          <h2 className="mb-2 text-sm font-bold text-neutral-400">{section.name}</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {section.works.map((work) => (
              <WorkTile
                key={workKey(work)}
                work={work}
                selected={selected.has(workKey(work))}
                onToggle={() => onToggle(work)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
