"use client";

import { useQuery } from "@tanstack/react-query";
import { getRecipes, type Recipe } from "@/lib/api";
import { ImageSlot } from "@/components/ImageSlot";

export default function CookPage() {
  const { data: recipes, isLoading } = useQuery({ queryKey: ["recipes"], queryFn: getRecipes });

  const [featured, ...rest] = recipes ?? [];

  return (
    <div className="min-h-[100dvh] bg-fresco-sheet">
      <div className="px-[22px] pb-3.5 pt-[max(60px,calc(env(safe-area-inset-top)+24px))]">
        <div className="font-display text-[34px] font-extrabold leading-none tracking-tight text-fresco-ink">
          Cook it up
        </div>
        <div className="mt-1.5 text-sm text-fresco-muted">Ranked by what&apos;s expiring first</div>
      </div>

      <div className="px-[22px] pb-8">
        {isLoading && <div className="font-mono text-sm text-fresco-faint">Loading recipes…</div>}

        {featured && <FeaturedRecipe recipe={featured} />}

        {rest.map((recipe) => (
          <RecipeRow key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}

function FeaturedRecipe({ recipe }: { recipe: Recipe }) {
  return (
    <div className="mb-3.5 overflow-hidden rounded-[22px] bg-white shadow-sm">
      <div className="relative h-[150px]">
        <ImageSlot src={recipe.image_url} placeholder={recipe.placeholder} className="absolute inset-0 h-full w-full" />
        {recipe.badge && (
          <div className="absolute left-3 top-3 rounded-lg bg-fresco-now px-2.5 py-1.5 font-mono text-[11px] font-extrabold text-white">
            {recipe.badge}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="font-display text-xl font-bold tracking-tight text-fresco-ink">{recipe.title}</div>
        <div className="mt-1.5 text-[13px] text-fresco-muted">{recipe.subtitle}</div>
        <div className="mt-3 flex gap-2">
          <span className="rounded-md bg-fresco-fresh/15 px-2.5 py-1.5 font-mono text-[11px] text-fresco-green">
            {recipe.minutes} MIN
          </span>
        </div>
      </div>
    </div>
  );
}

function RecipeRow({ recipe }: { recipe: Recipe }) {
  return (
    <div className="mb-2.5 flex items-center gap-3.5 rounded-card bg-white p-3 shadow-sm">
      <ImageSlot
        src={recipe.image_url}
        placeholder={recipe.placeholder}
        rounded
        className="h-16 w-16 shrink-0 bg-[#F3F1E9]"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-base font-bold text-fresco-ink">{recipe.title}</div>
        <div className="truncate text-[13px] text-fresco-muted">{recipe.subtitle}</div>
        <div className="mt-1 font-mono text-[11px] text-fresco-soonDeep">
          {recipe.minutes} MIN{recipe.uses_expiring > 0 ? ` · USES ${recipe.uses_expiring} EXPIRING` : ""}
        </div>
      </div>
    </div>
  );
}
