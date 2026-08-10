import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { imageSrcSet, optimizedImage } from "../utils/image";

function ProductImageSlider({ product, className = "h-72" }) {
  const images = product.images?.length
    ? product.images
    : [{ url: "/placeholder.png", public_id: "placeholder" }];
  const hasGallery = images.length > 1;

  return (
    <div
      className="relative"
      onClick={(event) => event.stopPropagation()}
    >
      <Swiper
        modules={[Navigation, Pagination]}
        navigation={hasGallery}
        pagination={hasGallery ? { clickable: true } : false}
        loop={hasGallery}
        nested
        className={`commerce-slider product-card-slider w-full ${className}`}
      >
        {images.map((image, index) => (
          <SwiperSlide key={image.public_id || `${image.url}-${index}`}>
            <img
              src={optimizedImage(image.url, 520)}
              srcSet={imageSrcSet(image.url, [260, 390, 520])}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              alt={`${product.name} view ${index + 1}`}
              loading="lazy"
              decoding="async"
              width="520"
              height="650"
              className="h-full w-full object-cover"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {hasGallery && (
        <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-black/65 px-2.5 py-1 text-xs font-medium text-white">
          {images.length} photos
        </span>
      )}
    </div>
  );
}

export default ProductImageSlider;
