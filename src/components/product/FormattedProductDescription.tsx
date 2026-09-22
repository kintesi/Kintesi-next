import React, { useMemo } from 'react';
import {
  CheckCircle2,
  Sparkles,
  Zap,
  Package,
  Info,
  ShieldCheck,
  Cpu,
  Layers,
  Star,
  Check,
} from 'lucide-react';

interface FormattedProductDescriptionProps {
  description: string;
}

interface FeatureItem {
  id: string;
  title: string;
  desc: string;
  icon?: string;
}

interface SpecItem {
  key: string;
  val: string;
}

export const FormattedProductDescription: React.FC<FormattedProductDescriptionProps> = ({ description }) => {
  const parsed = useMemo(() => {
    if (!description || !description.trim()) {
      return { intro: [], features: [], specs: [], packageItems: [], notes: [] };
    }

    // 1. Clean and normalize string, inserting breaks before key sections & bullets
    let text = description
      .replace(/([^\n])([✔✅⚡✨🔥🌟📦🔸🔹⭐💡🎯💎🛡️📌•])/g, '$1\n$2')
      .replace(/([^\n])(মূল বৈশিষ্ট্যসমূহ ও সুবিধাসমূহ|মূল বৈশিষ্ট্য ও সুবিধাসমূহ|প্রধান বৈশিষ্ট্যসমূহ|মূল বৈশিষ্ট্যসমূহ|মূল বৈশিষ্ট্য|Key Features|বৈশিষ্ট্যসমূহ|কেন .*? আপনার বেস্ট চয়েস)/gi, '$1\n\n[SECTION_FEATURES]\n$2')
      .replace(/([^\n])(প্রযুক্তিগত স্পেসিফিকেশন হাইলাইট|প্রযুক্তিগত স্পেসিফিকেশন|টেকনিক্যাল স্পেসিফিকেশন হাইলাইট|টেকনিক্যাল স্পেসিফিকেশন|Technical Specifications?|Specification Highlight)/gi, '$1\n\n[SECTION_SPECS]\n$2')
      .replace(/([^\n])(বক্সে যা যা থাকছে|বক্সে যা থাকছে|প্যাকেজে যা যা থাকছে|প্যাকেজে যা থাকছে|প্যাকেজ অন্তর্ভুক্ত|What’s in the Box|What is in the box|What's in the Box)/gi, '$1\n\n[SECTION_BOX]\n$2')
      .replace(/([^\n])(নোট\s*[:：]|বিশেষ দ্রষ্টব্য\s*[:：]|Note\s*[:：]|সতর্কতা\s*[:：])/gi, '$1\n\n[SECTION_NOTE]\n$2')
      .replace(/([।!?.\n])(?=[^\n:।!?]{2,40}[:：])/g, '$1\n');

    // Filter out internal supplier / dropshipping terms if any
    text = text.replace(/https?:\/\/(?:mohasagor|dropshipping)\S+/gi, '');

    const lines = text.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);

    let currentSection: 'intro' | 'features' | 'specs' | 'box' | 'note' = 'intro';
    const intro: string[] = [];
    const featureLines: string[] = [];
    const specLines: string[] = [];
    const boxLines: string[] = [];
    const notes: string[] = [];

    for (let line of lines) {
      if (line === '[SECTION_FEATURES]') { currentSection = 'features'; continue; }
      if (line === '[SECTION_SPECS]') { currentSection = 'specs'; continue; }
      if (line === '[SECTION_BOX]') { currentSection = 'box'; continue; }
      if (line === '[SECTION_NOTE]') { currentSection = 'note'; continue; }

      // Section trigger detectors inside lines
      if (/^(?:মূল বৈশিষ্ট্য|প্রধান বৈশিষ্ট্য|Key Features|বৈশিষ্ট্যসমূহ|কেন\s+)/i.test(line)) {
        currentSection = 'features';
        continue;
      }
      if (/^(?:প্রযুক্তিগত স্পেসিফিকেশন|Technical Specification|টেকনিক্যাল স্পেসিফিকেশন)/i.test(line)) {
        currentSection = 'specs';
        continue;
      }
      if (/^(?:বক্সে যা|প্যাকেজে যা|প্যাকেজ অন্তর্ভুক্ত|What’s in the Box|What's in the Box)/i.test(line)) {
        currentSection = 'box';
        continue;
      }
      if (/^(?:নোট|Note|বিশেষ দ্রষ্টব্য|সতর্কতা)/i.test(line)) {
        currentSection = 'note';
        continue;
      }

      if (currentSection === 'intro') {
        // If line starts with a bullet symbol, switch to features
        if (/^[✔✅•🔸🔹-]/.test(line)) {
          featureLines.push(line);
          currentSection = 'features';
        } else {
          intro.push(line);
        }
      } else if (currentSection === 'features') {
        // If line is a key-value spec like 'ইনপুট: AC100-240V', send to specs
        if (/^(?:ইনপুট|আউটপুট|মডেল|ব্যাটারি|পাওয়ার|ভোল্টেজ|ডাইমেনশন|ওজন|রোটেশন|ডিসপ্লে|ম্যাটেরিয়াল|Movement|Dial|Water Resistance|Input|Output|Battery|Model)\s*[:：]/i.test(line)) {
          specLines.push(line);
        } else {
          featureLines.push(line);
        }
      } else if (currentSection === 'specs') {
        specLines.push(line);
      } else if (currentSection === 'box') {
        boxLines.push(line);
      } else if (currentSection === 'note') {
        notes.push(line);
      }
    }

    // Process structured features
    const parsedFeatures: FeatureItem[] = [];
    featureLines.forEach((fl, idx) => {
      let clean = fl.replace(/^[✔✅⚡✨🔥🌟📦🔸🔹⭐💡🎯💎🛡️📌•\s-]+/, '').trim();
      if (!clean) return;

      const colonIdx = clean.indexOf(':');
      const bengaliColonIdx = clean.indexOf('：');
      const splitIdx = colonIdx !== -1 ? colonIdx : bengaliColonIdx;

      if (splitIdx > 1 && splitIdx < 45) {
        const title = clean.slice(0, splitIdx).trim();
        const desc = clean.slice(splitIdx + 1).trim();
        parsedFeatures.push({
          id: `feat-${idx}`,
          title,
          desc: desc || title,
        });
      } else if (clean.includes(' — ')) {
        const parts = clean.split(' — ');
        parsedFeatures.push({
          id: `feat-${idx}`,
          title: parts[0].trim(),
          desc: parts.slice(1).join(' — ').trim(),
        });
      } else {
        parsedFeatures.push({
          id: `feat-${idx}`,
          title: clean,
          desc: '',
        });
      }
    });

    // Process structured specs (key: val)
    const parsedSpecs: SpecItem[] = [];
    specLines.forEach((sl) => {
      let clean = sl.replace(/^[✔✅⚡✨🔥🌟📦🔸🔹⭐💡🎯💎🛡️📌•\s-]+/, '').trim();
      if (!clean) return;

      const colonIdx = clean.indexOf(':');
      const bengaliColonIdx = clean.indexOf('：');
      const splitIdx = colonIdx !== -1 ? colonIdx : bengaliColonIdx;

      if (splitIdx > 1 && splitIdx < 40) {
        const k = clean.slice(0, splitIdx).trim();
        const v = clean.slice(splitIdx + 1).trim();
        if (k && v) {
          parsedSpecs.push({ key: k, val: v });
        }
      } else {
        // If multiple specs combined on one line like "ইনপুট: 5V আউটপুট: 2A"
        const matches = clean.matchAll(/([^:：\s]{2,25})\s*[:：]\s*([^:：]+?)(?=(?:[^:：\s]{2,25}[:：])|$)/g);
        let foundAny = false;
        for (const m of matches) {
          if (m[1] && m[2]) {
            parsedSpecs.push({ key: m[1].trim(), val: m[2].trim() });
            foundAny = true;
          }
        }
        if (!foundAny) {
          parsedSpecs.push({ key: 'Specification', val: clean });
        }
      }
    });

    // Clean package items
    const parsedPackageItems: string[] = [];
    boxLines.forEach((bl) => {
      let clean = bl.replace(/^[✔✅⚡✨🔥🌟📦🔸🔹⭐💡🎯💎🛡️📌•\s-]+/, '').trim();
      clean = clean.replace(/^(?:বক্সে যা থাকছে|বক্সে যা যা থাকছে|প্যাকেজে যা থাকছে|What’s in the Box|What is in the box)\s*[:：]?/i, '').trim();
      if (!clean) return;
      // If comma separated items
      if (clean.includes(',')) {
        clean.split(',').forEach((p) => {
          const trimmed = p.trim();
          if (trimmed) parsedPackageItems.push(trimmed);
        });
      } else {
        parsedPackageItems.push(clean);
      }
    });

    return {
      intro,
      features: parsedFeatures,
      specs: parsedSpecs,
      packageItems: parsedPackageItems,
      notes,
    };
  }, [description]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Overview / Introduction Paragraphs */}
      {parsed.intro.length > 0 && (
        <div className="space-y-3.5 text-gray-800 text-xs sm:text-sm leading-relaxed sm:leading-7">
          {parsed.intro.map((p, idx) => (
            <p key={idx} className="bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-100/90 font-medium">
              {p}
            </p>
          ))}
        </div>
      )}

      {/* 2. Structured Key Features (মূল বৈশিষ্ট্যসমূহ ও সুবিধাসমূহ) */}
      {parsed.features.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <h3 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
              মূল বৈশিষ্ট্য ও সুবিধাসমূহ (Key Features)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5">
            {parsed.features.map((feat) => (
              <div
                key={feat.id}
                className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all duration-200 shadow-2xs flex items-start gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/60">
                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                    {feat.title}
                  </h4>
                  {feat.desc && feat.desc !== feat.title && (
                    <p className="text-[11px] sm:text-xs text-gray-600 mt-1 leading-relaxed">
                      {feat.desc}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Detailed Specifications Grid (প্রযুক্তিগত স্পেসিফিকেশন) */}
      {parsed.specs.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-100/80 text-cyan-700 flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5 text-cyan-600" />
            </div>
            <h3 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
              প্রযুক্তিগত স্পেসিফিকেশন (Technical Specifications)
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
            {parsed.specs.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 sm:p-3 bg-gray-50/90 rounded-xl border border-gray-100 space-y-0.5"
              >
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400 block truncate">
                  {item.key}
                </span>
                <p className="text-xs sm:text-sm font-bold text-gray-900 break-words leading-tight">
                  {item.val}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. What's in the Box (প্যাকেজে যা যা থাকছে) */}
      {parsed.packageItems.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <h3 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
              প্যাকেজে যা যা থাকছে (What’s in the Box)
            </h3>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100/70">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-indigo-950 font-medium">
              {parsed.packageItems.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 bg-white/80 p-2 sm:p-2.5 rounded-xl border border-indigo-100/60 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 5. Special Notes / Warnings */}
      {parsed.notes.length > 0 && (
        <div className="p-4 sm:p-5 bg-amber-50/80 border border-amber-200/80 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs sm:text-sm">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>বিশেষ দ্রষ্টব্য (Important Note):</span>
          </div>
          {parsed.notes.map((note, idx) => (
            <p key={idx} className="text-xs sm:text-sm text-amber-950 font-medium leading-relaxed pl-6">
              {note}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
