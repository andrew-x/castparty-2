import { useEffect, useState } from "react"

let cachedPromise: Promise<string[]> | null = null

function fetchCities(): Promise<string[]> {
  if (!cachedPromise) {
    cachedPromise = Promise.all([
      fetch("/us-cities.json").then((r) => r.json() as Promise<string[]>),
      fetch("/can-cities.json").then((r) => r.json() as Promise<string[]>),
    ]).then(([us, can]) => [...us, ...can])
  }
  return cachedPromise
}

export function useCityOptions(): string[] {
  const [cities, setCities] = useState<string[]>([])

  useEffect(() => {
    fetchCities().then(setCities)
  }, [])

  return cities
}
