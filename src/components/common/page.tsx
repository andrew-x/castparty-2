import Link from "next/link"
import { Fragment } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage as BreadcrumbPagePrimitive,
  BreadcrumbSeparator,
} from "@/components/common/breadcrumb"
import { cn } from "@/lib/util"

interface PageBreadcrumb {
  label: string
  href?: string
}

function Page({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-1 flex-col gap-block px-page", className)}>
      {children}
    </div>
  )
}

function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  tabs,
}: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  breadcrumbs?: PageBreadcrumb[]
  tabs?: React.ReactNode
}) {
  return (
    <header
      className={cn(
        "-mx-page flex flex-col gap-tight px-page pt-block",
        tabs ? "pb-0" : "border-border border-b pb-block",
      )}
      data-slot="page-header"
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, i) => (
              <Fragment key={crumb.label}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPagePrimitive>
                      {crumb.label}
                    </BreadcrumbPagePrimitive>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-title">{title}</h1>
          {actions && (
            <div className="flex items-center gap-element">{actions}</div>
          )}
        </div>
        {description &&
          (typeof description === "string" ? (
            <p className="mt-2 text-body text-muted-foreground">
              {description}
            </p>
          ) : (
            <div className="mt-2 text-body text-muted-foreground">
              {description}
            </div>
          ))}
      </div>
      {tabs && (
        <div className="-mb-px border-border border-b [&>nav>div]:pb-0">
          {tabs}
        </div>
      )}
    </header>
  )
}

function PageContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn("flex flex-1 flex-col pt-group pb-section", className)}
      data-slot="page-content"
    >
      {children}
    </div>
  )
}

export { Page, PageHeader, PageContent }
export type { PageBreadcrumb }
