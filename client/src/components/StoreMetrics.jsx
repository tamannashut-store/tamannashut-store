import { useEffect, useState } from "react";
import { FiStar, FiUsers } from "react-icons/fi";
export default function StoreMetrics({ store }) {
  const ratings = Number(store.ratingCount || 0);
  const [updatedFollowers, setUpdatedFollowers] = useState(null);
  useEffect(() => {
    const changed = event => { if (event.detail?.id === store.id && Number.isFinite(event.detail.followerCount)) setUpdatedFollowers(event.detail.followerCount); };
    window.addEventListener("store-follow-changed", changed);
    return () => window.removeEventListener("store-follow-changed", changed);
  }, [store.id]);
  const followers = updatedFollowers ?? Number(store.followerCount || 0);
  return <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600" aria-label="Store ratings and followers"><span className="inline-flex items-center gap-1"><FiStar aria-hidden="true" className={ratings ? "text-amber-600" : "text-slate-400"} />{ratings ? `${Number(store.averageRating).toFixed(1)} · ${ratings.toLocaleString("en-IN")} ${ratings === 1 ? "rating" : "ratings"}` : "No ratings yet"}</span><span className="inline-flex items-center gap-1"><FiUsers aria-hidden="true" />{followers.toLocaleString("en-IN")} {followers === 1 ? "follower" : "followers"}</span></div>;
}
