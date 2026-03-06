import {
  CopyObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { generateId, IS_DEV } from "@/lib/util"

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? ""
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? ""
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? ""
const R2_BUCKET = process.env.R2_BUCKET ?? ""
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? ""

const root = IS_DEV ? "dev" : "prod"

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".")
  return dot === -1 ? "" : filename.slice(dot + 1)
}

export function getKeyFromUrl(fileUrl: string): string {
  return fileUrl.replace(`${R2_PUBLIC_URL}/`, "")
}

export async function uploadFile(file: File, folder: string): Promise<string> {
  const ext = getExtension(file.name)
  const key = `${root}/${folder}/${generateId("file")}${ext ? `.${ext}` : ""}`

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: new Uint8Array(await file.arrayBuffer()),
      ContentType: file.type,
    }),
  )

  return `${R2_PUBLIC_URL}/${key}`
}

export async function deleteFile(fileUrl: string): Promise<void> {
  if (!fileUrl.startsWith(R2_PUBLIC_URL)) {
    throw new Error("Invalid file URL")
  }

  await s3.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: getKeyFromUrl(fileUrl),
    }),
  )
}

export async function moveFile(
  sourceUrl: string,
  destFolder: string,
): Promise<string> {
  if (!sourceUrl.startsWith(R2_PUBLIC_URL)) {
    throw new Error("Invalid source URL")
  }

  const sourceKey = getKeyFromUrl(sourceUrl)
  const ext = getExtension(sourceKey)
  const destKey = `${root}/${destFolder}/${generateId("file")}${ext ? `.${ext}` : ""}`

  await s3.send(
    new CopyObjectCommand({
      Bucket: R2_BUCKET,
      CopySource: `${R2_BUCKET}/${sourceKey}`,
      Key: destKey,
    }),
  )

  await s3.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: sourceKey,
    }),
  )

  return `${R2_PUBLIC_URL}/${destKey}`
}
