export interface TaxonomyCategory {
  id: string;
  name: string;
  bnName: string;
  sector: 'personal_care' | 'health_wellness' | 'gadgets' | 'fashion_men' | 'fashion_women' | 'jewelry_watches' | 'beauty' | 'groceries' | 'home' | 'kids' | 'sports' | 'automotive' | 'books_stationery' | 'pets' | 'general';
  suggestedCategoryId: string;
  tags: string[];
}

export const SECTOR_TABS = [
  {
    id: "all",
    label: "🌐 All Categories (সকল ক্যাটাগরি)"
  },
  {
    id: "personal_care",
    label: "🧴 Personal Care & Intimate (ব্যক্তিগত যত্ন ও হাইজিন)"
  },
  {
    id: "health_wellness",
    label: "💊 Health & First Aid (স্বাস্থ্য ও ফার্স্ট এইড)"
  },
  {
    id: "gadgets",
    label: "⚡ Gadgets & Tech (গ্যাজেট ও টেক)"
  },
  {
    id: "fashion_men",
    label: "👔 Men's Fashion (পুরুষদের ফ্যাশন)"
  },
  {
    id: "fashion_women",
    label: "👗 Women's Fashion (নারীদের ফ্যাশন)"
  },
  {
    id: "jewelry_watches",
    label: "⌚ Watches & Jewelry (ঘড়ি ও গহনা)"
  },
  {
    id: "beauty",
    label: "✨ Beauty & Cosmetics (প্রসাধন)"
  },
  {
    id: "groceries",
    label: "🍃 Groceries & Food (খাবার ও মুদি)"
  },
  {
    id: "home",
    label: "🏠 Home & Kitchen (গৃহস্থালি ও কিচেন)"
  },
  {
    id: "kids",
    label: "👶 Baby & Kids (বাচ্চাদের পণ্য)"
  },
  {
    id: "sports",
    label: "⚽ Sports & Fitness (খেলাধুলা ও ফিটনেস)"
  },
  {
    id: "automotive",
    label: "🏍️ Bike & Car (বাইক ও গাড়ি)"
  },
  {
    id: "books_stationery",
    label: "📚 Books & Stationery (বই ও স্টেশনারি)"
  },
  {
    id: "pets",
    label: "🐾 Pet Care (পোষা প্রাণী)"
  }
] as const;
