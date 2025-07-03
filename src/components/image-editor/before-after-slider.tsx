"use client"

import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

interface BeforeAfterSliderProps {
    before: string;
    after: string;
}

export function BeforeAfterSlider({ before, after }: BeforeAfterSliderProps) {
    return (
        <ReactCompareSlider
            itemOne={<ReactCompareSliderImage src={before} alt="Image before edit" />}
            itemTwo={<ReactCompareSliderImage src={after} alt="Image after edit" />}
            className="w-full h-auto rounded-lg shadow-lg"
            dir='ltr' // Slider should always be LTR
        />
    );
}