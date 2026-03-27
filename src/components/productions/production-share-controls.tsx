"use client"

import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  QrCodeIcon,
} from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/common/button"
import { ButtonGroup } from "@/components/common/button-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/common/dialog"

interface Props {
  url: string
  href: string
  fileName: string
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function ProductionShareControls({ url, href, fileName }: Props) {
  const qrContainerRef = useRef<HTMLDivElement>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedImage, setCopiedImage] = useState(false)
  const [canCopyImage, setCanCopyImage] = useState(false)

  useEffect(() => {
    setCanCopyImage(
      typeof window !== "undefined" &&
        "ClipboardItem" in window &&
        typeof navigator.clipboard?.write === "function",
    )
  }, [])

  async function handleCopyLink() {
    await navigator.clipboard.writeText(url)
    setCopiedLink(true)
    await wait(2000)
    setCopiedLink(false)
  }

  function getCanvas() {
    return qrContainerRef.current?.querySelector("canvas") ?? null
  }

  function createBlobFromCanvas() {
    const canvas = getCanvas()

    if (!canvas) {
      throw new Error("QR code not ready.")
    }

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Couldn't create QR image."))
          return
        }

        resolve(blob)
      }, "image/png")
    })
  }

  async function handleCopyImage() {
    if (!canCopyImage) return

    const blob = await createBlobFromCanvas()
    await navigator.clipboard.write([
      new window.ClipboardItem({ "image/png": blob }),
    ])
    setCopiedImage(true)
    await wait(2000)
    setCopiedImage(false)
  }

  async function handleDownload() {
    const blob = await createBlobFromCanvas()
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = downloadUrl
    link.download = `${fileName}.png`
    link.click()

    URL.revokeObjectURL(downloadUrl)
  }

  const copyLinkLabel = copiedLink ? "Copied" : "Copy link"
  const copyImageLabel = copiedImage ? "Copied" : "Copy image"

  return (
    <>
      <div className="flex w-full flex-wrap items-center justify-end gap-element sm:w-auto sm:flex-nowrap">
        <div className="flex min-w-0 flex-1 items-center rounded-md border bg-muted px-3 py-2 sm:max-w-md sm:flex-initial">
          <span className="truncate font-mono text-caption text-foreground">
            {url}
          </span>
        </div>

        <ButtonGroup>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleCopyLink}
            aria-label={copyLinkLabel}
            tooltip={copyLinkLabel}
          >
            {copiedLink ? (
              <CheckIcon className="text-success-text" />
            ) : (
              <CopyIcon />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setDialogOpen(true)}
            aria-label="Show QR code"
            tooltip="Show QR code"
          >
            <QrCodeIcon />
          </Button>

          <Button
            href={href}
            target="_blank"
            rel="noreferrer"
            variant="ghost"
            size="icon-xs"
            aria-label="Open public page"
            tooltip="Open public page"
          >
            <ExternalLinkIcon />
          </Button>
        </ButtonGroup>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Share production link</DialogTitle>
            <DialogDescription>
              Scan this code or share the link so candidates can open the public
              production page.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-group">
            <div
              ref={qrContainerRef}
              className="rounded-xl border bg-background p-4 shadow-xs"
            >
              <QRCodeCanvas
                value={url}
                size={240}
                marginSize={4}
                title={`QR code for ${url}`}
                className="size-60 max-w-full"
              />
            </div>

            <div className="w-full rounded-md border bg-muted px-group py-element">
              <p className="break-all font-mono text-caption text-foreground">
                {url}
              </p>
            </div>
          </div>

          <DialogFooter showCloseButton>
            <Button
              variant="outline"
              onClick={handleDownload}
              leftSection={<DownloadIcon />}
            >
              Download
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyImage}
              leftSection={copiedImage ? <CheckIcon /> : <CopyIcon />}
              disabled={!canCopyImage}
              tooltip={
                canCopyImage
                  ? copyImageLabel
                  : "Copy image is not available in this browser"
              }
            >
              {copyImageLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
