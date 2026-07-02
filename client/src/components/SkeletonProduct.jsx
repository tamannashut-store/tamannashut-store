import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

function SkeletonProduct() {
    return (
        <div className="bg-white rounded-3xl shadow-xl p-5">

            <Skeleton
                height={280}
                className="rounded-2xl"
            />

            <Skeleton
                height={28}
                className="mt-5"
            />

            <Skeleton
                width={120}
                className="mt-3"
            />

            <Skeleton
                width={90}
                height={30}
                className="mt-4"
            />

        </div>
    );
}

export default SkeletonProduct;