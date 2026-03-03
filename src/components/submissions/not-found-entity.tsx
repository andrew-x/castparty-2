import { BuildingIcon, ClapperboardIcon, UserIcon } from "lucide-react"

const config = {
  organization: { label: "Organization", icon: BuildingIcon },
  production: { label: "Production", icon: ClapperboardIcon },
  role: { label: "Role", icon: UserIcon },
}

export function NotFoundEntity({
  entity,
}: {
  entity: "organization" | "production" | "role"
}) {
  const { label, icon: Icon } = config[entity]

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-group text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <Icon className="size-6 text-foreground" />
      </div>
      <div className="flex flex-col items-center gap-element">
        <h1 className="font-serif text-foreground text-title">
          {label} not found
        </h1>
        <p className="text-muted-foreground">
          This {entity} can&apos;t be found or is no longer public.
        </p>
      </div>
    </div>
  )
}
