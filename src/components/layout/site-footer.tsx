import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto grid max-w-6xl gap-2 px-4 py-8 text-sm text-muted-foreground sm:grid-cols-2">
        <div>
          <p className="font-medium text-foreground">{siteConfig.name}</p>
          <p>{siteConfig.tagline}</p>
        </div>
        <div className="sm:text-right">
          <p>{siteConfig.contact.email}</p>
          <p>{siteConfig.contact.phone}</p>
          <p>
            © {siteConfig.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
