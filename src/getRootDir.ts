import path from "path"

export function getRootDir() {
  return path.dirname(import.meta.filename)
}
