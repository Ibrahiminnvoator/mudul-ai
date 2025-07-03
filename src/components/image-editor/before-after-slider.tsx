"use client"

import { ReactCompareSlider } from "react-compare-slider"

/**
 * @description
 * A wrapper component for the `react-compare-slider` library. It provides a
 * simple interface for creating a before-and-after image comparison view.
 *
 * Key features:
 * - Accepts any React nodes for the 'before' and 'after' views.
 * - The slider direction is fixed to LTR for intuitive dragging, regardless of page direction.
 * - Styled for consistency with the application's design.
 *
 * @dependencies
 * - react-compare-slider: The core library for the comparison slider functionality.
 *
 * @notes
 * - This component should be used with `ReactCompareSliderImage` components as children
 *   to ensure proper functionality and accessibility.
 */
interface BeforeAfterSliderProps {
  before: React.ReactNode
  after: React.ReactNode
}

export function BeforeAfterSlider({ before, after }: BeforeAfterSliderProps) {
  return (
    <ReactCompareSlider
      itemOne={before}
      itemTwo={after}
      className="w-full h-auto max-h-[70vh] rounded-lg" // Removed shadow-lg
      dir="ltr" // Slider handle should always be LTR for intuitive dragging
    />
  )
}