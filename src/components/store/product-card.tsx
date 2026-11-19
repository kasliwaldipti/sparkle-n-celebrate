import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatPaise } from "@/lib/money";

export interface ProductCardData {
  slug: string;
  name: string;
  pricePaise: number;
  imagePublicId: string | null;
  imageAlt: string | null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="overflow-hidden pt-0 transition hover:shadow-md">
        <div className="relative aspect-square bg-muted">
          {product.imagePublicId && (
            <Image
              src={product.imagePublicId}
              alt={product.imageAlt ?? product.name}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover"
            />
          )}
        </div>
        <CardContent className="space-y-1">
          <p className="font-medium">{product.name}</p>
          <p className="text-sm text-muted-foreground">{formatPaise(product.pricePaise)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
