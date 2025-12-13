import { HomeClient } from "./home-client";

export const metadata = {
    title: "CINETIER | Film ve Dizi Tier Listeleri",
    description: "Film ve dizi tier listeleri oluştur, VS modunda favorilerini karşılaştır, topluluğun zevkini keşfet.",
};

export default function HomePage() {
    return <HomeClient />;
}
