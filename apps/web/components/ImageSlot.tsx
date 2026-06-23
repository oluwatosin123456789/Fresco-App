type Props = {
  src?: string | null;
  alt?: string;
  placeholder: string;
  className?: string;
  rounded?: boolean;
};

export function ImageSlot({ src, alt = "", placeholder, className = "", rounded = false }: Props) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        className={`object-cover ${rounded ? "rounded-2xl" : ""} ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center bg-[#E9E6DA] text-center text-[11px] font-medium text-[#9AA39A] ${
        rounded ? "rounded-2xl" : ""
      } ${className}`}
    >
      {placeholder}
    </div>
  );
}
