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
    label: "🌐 All Categories",
    bnLabel: "🌐 সকল ক্যাটাগরি"
  },
  {
    id: "personal_care",
    label: "🧴 Personal Care & Intimate",
    bnLabel: "🧴 ব্যক্তিগত যত্ন ও হাইজিন"
  },
  {
    id: "health_wellness",
    label: "💊 Health & Wellness",
    bnLabel: "💊 স্বাস্থ্য ও ওয়েলনেস"
  },
  {
    id: "gadgets",
    label: "⚡ Gadgets & Tech",
    bnLabel: "⚡ গ্যাজেট ও প্রযুক্তি"
  },
  {
    id: "fashion_men",
    label: "👔 Men's Fashion",
    bnLabel: "👔 পুরুষদের ফ্যাশন"
  },
  {
    id: "fashion_women",
    label: "👗 Women's Fashion",
    bnLabel: "👗 নারীদের ফ্যাশন"
  },
  {
    id: "jewelry_watches",
    label: "⌚ Watches & Jewelry",
    bnLabel: "⌚ ঘড়ি ও গহনা"
  },
  {
    id: "beauty",
    label: "✨ Beauty & Cosmetics",
    bnLabel: "✨ রূপচর্চা ও প্রসাধন"
  },
  {
    id: "groceries",
    label: "🍃 Groceries & Food",
    bnLabel: "🍃 খাদ্য ও মুদি"
  },
  {
    id: "home",
    label: "🏠 Home & Kitchen",
    bnLabel: "🏠 গৃহস্থালি ও কিচেন"
  },
  {
    id: "kids",
    label: "👶 Baby & Kids",
    bnLabel: "👶 শিশুদের পণ্য"
  },
  {
    id: "sports",
    label: "⚽ Sports & Fitness",
    bnLabel: "⚽ খেলাধুলা ও ফিটনেস"
  },
  {
    id: "automotive",
    label: "🏍️ Automotive & Bike",
    bnLabel: "🏍️ গাড়ি ও বাইক"
  },
  {
    id: "books_stationery",
    label: "📚 Books & Stationery",
    bnLabel: "📚 বই ও স্টেশনারি"
  },
  {
    id: "pets",
    label: "🐾 Pet Care",
    bnLabel: "🐾 পোষা প্রাণী"
  }
] as const;
