"use client"

import Lightbox from "yet-another-react-lightbox"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import "yet-another-react-lightbox/styles.css"

interface Props {
  slides: { src: string; alt: string }[]
  open: boolean
  index: number
  onClose: () => void
}

export function HeadshotLightbox({ slides, open, index, onClose }: Props) {
  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      plugins={[Zoom]}
      animation={{ fade: 0, swipe: 0, navigation: 0 }}
    />
  )
}
