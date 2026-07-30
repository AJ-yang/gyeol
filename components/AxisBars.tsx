import { AXIS_LABELS, type Axes } from '@/lib/types'

export function AxisBars({ norm }: { norm: Axes }) {
  return (
    <div className="flex flex-col gap-4">
      {norm.map((value, axis) => {
        const label = AXIS_LABELS[axis]
        const percent = Math.abs(value) * 50
        return (
          <div key={axis}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span className={value < 0 ? 'font-bold text-white' : 'text-neutral-500'}>{label.neg}</span>
              <span className={value >= 0 ? 'font-bold text-white' : 'text-neutral-500'}>{label.pos}</span>
            </div>
            <div className="relative h-2 w-full rounded-full bg-neutral-800">
              <div className="absolute left-1/2 top-0 h-full w-px bg-neutral-600" />
              <div
                className="absolute top-0 h-full rounded-full bg-white"
                style={value < 0 ? { right: '50%', width: `${percent}%` } : { left: '50%', width: `${percent}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
