/**
 * This is purely AI generated, so if something breaks... ¯\_(ツ)_/¯
 */

import dayjs from "./dayjs"
import { IS_DEV } from "./util"

type LogLevel = "info" | "error"
type LogInput = string | number | boolean | object | Error | unknown

const formatLogMessage = (
  input: LogInput,
  isFirst: boolean = false,
): string => {
  if (input instanceof Error) {
    const errorMsg = `${input.name}: ${input.message}`
    if (input.stack && isFirst) {
      // Only show stack trace for the first error in the message
      return `${errorMsg}\n${input.stack}`
    }
    return errorMsg
  }

  if (typeof input === "object" && input !== null) {
    try {
      return JSON.stringify(input, null, 2)
    } catch {
      return String(input)
    }
  }

  return String(input)
}

const createLogger = () => {
  const log = (level: LogLevel, ...inputs: LogInput[]) => {
    if (!IS_DEV) return

    const timestamp = dayjs().format("HH:mm:ss.SSS")
    const levelUpper = level.toUpperCase()

    // Format each input with proper spacing and indentation
    const formattedInputs = inputs.map((input, index) => {
      const isFirst = index === 0
      const formatted = formatLogMessage(input, isFirst)

      // Handle multi-line content (objects, errors with stack traces)
      if (formatted.includes("\n")) {
        const lines = formatted.split("\n")
        const firstLine = lines[0]
        const remainingLines = lines.slice(1)

        if (remainingLines.length > 0) {
          const indentedLines = remainingLines
            .map((line) => (line ? `  ${line}` : line))
            .join("\n")
          return `${firstLine}\n${indentedLines}`
        }
      }

      return formatted
    })

    // Join inputs with proper spacing
    const messageBody = formattedInputs.join(" ")

    // Stack prefix vertically to save horizontal space
    const stackedPrefix = `[${timestamp}]\n[${levelUpper}]`

    // Format the final message with stacked prefix
    const lines = messageBody.split("\n")
    const firstLine = lines[0]
    const remainingLines = lines.slice(1)

    let finalMessage: string
    if (remainingLines.length > 0) {
      const indentedLines = remainingLines
        .map((line) => (line ? `       ${line}` : line)) // 7-space indent to align with message content
        .join("\n")
      finalMessage = `${stackedPrefix} ${firstLine}\n${indentedLines}`
    } else {
      finalMessage = `${stackedPrefix} ${firstLine}`
    }

    switch (level) {
      case "error":
        // biome-ignore lint/suspicious/noConsole: logging
        console.error(finalMessage)
        break
      default:
        // biome-ignore lint/suspicious/noConsole: logging
        console.log(finalMessage)
    }
  }

  return {
    info: (...inputs: LogInput[]) => log("info", ...inputs),
    error: (...inputs: LogInput[]) => log("error", ...inputs),
  }
}

const logger = createLogger()

export default logger
