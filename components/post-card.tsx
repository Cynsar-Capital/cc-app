"use client"
import BlurImage from "@/components/blur-image";
import { placeholderBlurhash, random } from "@/lib/utils";
import { Post, Site } from "@prisma/client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useState } from "react";
const DropdownMenu = dynamic(() => import('./dropdown'), {
  suspense: true,
});

export default function PostCard({
  data,
}: {
  data: Post & { site: Site | null };
}) {
  const url = `${data.site?.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/${data.slug}`;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleMenuSelect = (option: string) => {
    console.log(`Selected Option in PostCard: ${option}`);
    // Implement your redirection logic here based on the option
    // For example, redirect to a different component or page
    if (option == 'Add Details'){
      
    }
};

  return (
    <div className="relative rounded-lg border border-stone-200 pb-10 shadow-md transition-all hover:shadow-xl dark:border-stone-700 dark:hover:border-white">
      <Link
        href={`/post/${data.id}`}
        className="flex flex-col overflow-hidden rounded-lg"
      >
        <div className="relative h-44 overflow-hidden">
          <BlurImage
            alt={data.title ?? "Card thumbnail"}
            width={500}
            height={400}
            className="h-full object-cover"
            src={data.image ?? "/placeholder.png"}
            placeholder="blur"
            blurDataURL={data.imageBlurhash ?? placeholderBlurhash}
          />
          {!data.published && (
            <span className="absolute bottom-2 right-2 rounded-md border border-stone-200 bg-white px-3 py-0.5 text-sm font-medium text-stone-600 shadow-md">
              Draft
            </span>
          )}
        </div>
        <div className="border-t border-stone-200 p-4 dark:border-stone-700">
          <h3 className="my-0 truncate font-cal text-xl font-bold tracking-wide dark:text-white dark:text-white">
            {data.title}
          </h3>
          <p className="mt-2 line-clamp-1 text-sm font-normal leading-snug text-stone-500 dark:text-stone-400">
            {data.description}
          </p>
        </div>
      </Link>
      <div className="absolute bottom-4 flex w-full px-4">
        <a
          href={
            process.env.NEXT_PUBLIC_VERCEL_ENV
              ? `https://${url}`
              : `http://${data.site?.subdomain}.localhost:3000/${data.slug}`
          }
          target="_blank"
          rel="noreferrer"
          className="truncate rounded-md bg-stone-100 px-2 py-1 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
        >
          {url} ↗
        </a>
        <Suspense fallback={<div>Loading...</div>}>
                <DropdownMenu isDropdownOpen={isDropdownOpen} 
                toggleDropdown={toggleDropdown} 
                onMenuSelect={handleMenuSelect} data={data.siteId} />
            </Suspense>
      </div>
    </div>
  );
}
