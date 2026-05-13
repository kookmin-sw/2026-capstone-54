import { NavPill } from "./NavPill";
import { MobileNav } from "./MobileNav";

export function Navbar() {
  return (
    <>
      {/* 데스크톱: md 이상 */}
      <div className="hidden md:flex">
        <NavPill />
      </div>
      {/* 모바일: md 미만 */}
      <div className="flex md:hidden">
        <MobileNav />
      </div>
    </>
  );
}
