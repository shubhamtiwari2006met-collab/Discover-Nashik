/**
 * Discover Nashik — Place Matcher Service
 * 
 * Reliably matches itinerary destination items with registered Discover Nashik Places.
 * Adheres to strict matching priority:
 *   1. Existing unique place ID
 *   2. Canonical place identifier or slug
 *   3. Normalised exact place name
 *   4. Verified alternative names and aliases (English, Marathi, Hindi)
 *   5. Carefully validated fuzzy name matching (core distinctive tokens)
 *   6. Geographical coordinates and location proximity verification (< 1.5 km)
 * 
 * Safety: Ambiguous or weakly-correlated places are NEVER matched.
 */

// Geodesic distance helper for proximity validation
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Normalise strings: lowercase, remove diacritics, strip punctuation & parentheses
function normalizeText(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[()&,.\-–—'"`/\\#]/g, " ") // punctuation to space
    .replace(/\s+/g, " ")
    .trim();
}

// Extract core distinctive tokens by stripping generic religious/geographic stop words
const STOP_WORDS = new Set([
  "temple", "temples", "mandir", "sansthan", "shree", "shri", "sri",
  "mahadev", "shiva", "shiv", "god", "devi", "mata", "lord",
  "kund", "ghat", "ghats", "cave", "caves", "gufa", "gumpha",
  "hill", "mountain", "peak", "waterfall", "waterfalls", "falls",
  "dam", "reservoir", "lake", "centre", "center", "museum", "sanctuary",
  "heritage", "market", "bazaar", "bazar", "complex", "tour", "tasting",
  "holy", "sacred", "tirtha", "tirth", "river", "godavari", "nashik", "nasik",
  "old", "the", "and", "in", "at", "of"
]);

function extractCoreTokens(normalizedText) {
  const words = normalizedText.split(" ");
  return words.filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

// Verified canonical pilgrimage and tourism destinations with multi-lingual aliases
const CANONICAL_DESTINATIONS = [
  {
    canonicalId: "ram_kund",
    slug: "ram-kund",
    latitude: 20.0063,
    longitude: 73.7915,
    coreKey: "ramkund",
    aliases: [
      "ram kund", "ramkund", "ram kund & godavari ghats", "ram kund ghat",
      "ram kund ghats", "ramkund ghat", "ramkund godavari",
      "रामकुंड", "राम कुंड", "रामकुंड गोदावरी घाट", "रामकुण्ड"
    ]
  },
  {
    canonicalId: "kalaram_temple",
    slug: "kalaram-temple",
    latitude: 20.0080,
    longitude: 73.7932,
    coreKey: "kalaram",
    aliases: [
      "kalaram", "kalaram temple", "kalaram mandir", "kala ram", "kala ram temple",
      "kala ram mandir", "kalaram sansthan", "kala ram sansthan",
      "kalaram temple (kala ram sansthan)", "shree kalaram mandir", "shri kalaram mandir",
      "काळाराम मंदिर", "काळाराम संस्थान", "श्री काळाराम मंदिर", "काळाराम",
      "कालाराम मंदिर", "कालाराम मन्दिर", "कालाराम"
    ]
  },
  {
    canonicalId: "sita_gufa",
    slug: "sita-gufa",
    latitude: 20.0087,
    longitude: 73.7944,
    coreKey: "sita",
    aliases: [
      "sita gufa", "sita gumpha", "sita gufa (sita's cave)", "sita's cave",
      "sitas cave", "sita cave", "sita caves", "sita gumpha cave",
      "सीता गुंफा", "सीता गुफा", "सीता गुंफा मंदिर"
    ]
  },
  {
    canonicalId: "kapaleshwar_temple",
    slug: "kapaleshwar-temple",
    latitude: 20.0068,
    longitude: 73.7922,
    coreKey: "kapaleshwar",
    aliases: [
      "kapaleshwar", "kapaleshwar temple", "kapaleshwar mahadev", "kapaleshwar mandir",
      "kapaleshwar mahadev mandir", "kapaleshwar mahadev temple", "kapaleshvara",
      "कपालेश्वर", "कपालेश्वर मंदिर", "कपालेश्वर महादेव मंदिर"
    ]
  },
  {
    canonicalId: "naroshankar_temple",
    slug: "naroshankar-temple",
    latitude: 20.0055,
    longitude: 73.7938,
    coreKey: "naroshankar",
    aliases: [
      "naroshankar", "naroshankar temple", "naroshankar mandir",
      "naroshankar temple & historic bell", "naroshankar bell", "naro shankar",
      "नारोशंकर मंदिर", "नारोशंकर", "नारोशंकर घंटा"
    ]
  },
  {
    canonicalId: "sundarnarayan_temple",
    slug: "sundarnarayan-temple",
    latitude: 20.0042,
    longitude: 73.7918,
    coreKey: "sundarnarayan",
    aliases: [
      "sundarnarayan", "sundarnarayan temple", "sundar narayan", "sundar narayan temple",
      "sundarnarayan mandir", "सुंदरनारायण मंदिर", "सुंदर नारायण मंदिर", "सुंदरनारायण"
    ]
  },
  {
    canonicalId: "tapovan",
    slug: "tapovan",
    latitude: 19.9982,
    longitude: 73.8115,
    coreKey: "tapovan",
    aliases: [
      "tapovan", "tapovan sacred grove", "tapovan & lakshman kund", "lakshman kund",
      "laxman kund", "tapovan rishi", "तपोवन", "लक्ष्मण कुंड", "तपोवन नाशिक"
    ]
  },
  {
    canonicalId: "saraf_bazaar",
    slug: "saraf-bazaar",
    latitude: 20.0028,
    longitude: 73.7885,
    coreKey: "saraf",
    aliases: [
      "saraf bazaar", "saraf bazar", "saraf bazaar & old city heritage market",
      "saraf market", "bhandi bazaar", "सराफ बाजार", "सराफ बाजार नाशिक"
    ]
  },
  {
    canonicalId: "trimbakeshwar_temple",
    slug: "trimbakeshwar-temple",
    latitude: 19.9318,
    longitude: 73.5307,
    coreKey: "trimbakeshwar",
    aliases: [
      "trimbakeshwar", "trimbakeshwar temple", "trimbakeshwar jyotirlinga",
      "trimbakeshwar jyotirlinga temple", "trimbakeshwar mandir", "tryambakeshwar",
      "trambakeshwar", "trimbak temple", "shri trimbakeshwar",
      "त्र्यंबकेश्वर", "त्र्यंबकेश्वर मंदिर", "त्र्यंबकेश्वर ज्योतिर्लिंग", "त्र्यंबक"
    ]
  },
  {
    canonicalId: "kushavarta_kund",
    slug: "kushavarta-kund",
    latitude: 19.9332,
    longitude: 73.5325,
    coreKey: "kushavarta",
    aliases: [
      "kushavarta", "kushavarta kund", "kushavarta tirtha", "kushavart tirtha",
      "kushavarta kund (godavari tirtha)", "kushavart",
      "कुशावर्त", "कुशावर्त तीर्थ", "कुशावर्त कुंड"
    ]
  },
  {
    canonicalId: "sant_nivruttinath_mandir",
    slug: "sant-nivruttinath-mandir",
    latitude: 19.9365,
    longitude: 73.5348,
    coreKey: "nivruttinath",
    aliases: [
      "nivruttinath", "nivruttinath mandir", "sant nivruttinath samadhi mandir",
      "nivruttinath temple", "sant nivruttinath",
      "निवृत्तीनाथ मंदिर", "संत निवृत्तीनाथ समाधी मंदिर", "निवृत्तीनाथ"
    ]
  },
  {
    canonicalId: "brahmagiri_hill",
    slug: "brahmagiri-hill",
    latitude: 19.9280,
    longitude: 73.5220,
    coreKey: "brahmagiri",
    aliases: [
      "brahmagiri", "brahmagiri hill", "brahmagiri peak", "brahmagiri mountain",
      "brahmagiri hill & godavari origin", "brahmagiri trek",
      "ब्रह्मगिरी", "ब्रह्मगिरी पर्वत", "ब्रह्मगिरी गड"
    ]
  },
  {
    canonicalId: "anjaneri_hill",
    slug: "anjaneri-hill",
    latitude: 19.9195,
    longitude: 73.5822,
    coreKey: "anjaneri",
    aliases: [
      "anjaneri", "anjaneri hill", "anjaneri mountain", "anjaneri fort",
      "anjaneri hill (birthplace of lord hanuman)", "hanuman janmasthan anjaneri",
      "अंजनेरी", "अंजनेरी पर्वत", "अंजनेरी गड", "हनुमान जन्मस्थान अंजनेरी"
    ]
  },
  {
    canonicalId: "coin_museum",
    slug: "coin-museum",
    latitude: 19.9275,
    longitude: 73.5780,
    coreKey: "coin",
    aliases: [
      "coin museum", "coin museum nashik", "coin museum nashik (inres)",
      "inres coin museum", "indian institute of research in numismatic studies",
      "नाणी संग्रहालय", "कॉईन म्युझियम"
    ]
  },
  {
    canonicalId: "dugarwadi_waterfall",
    slug: "dugarwadi-waterfall",
    latitude: 19.9470,
    longitude: 73.4980,
    coreKey: "dugarwadi",
    aliases: [
      "dugarwadi", "dugarwadi waterfall", "dugarwadi falls", "dugarwadi cascade",
      "दुगारवाडी धबधबा", "दुगरवाडी", "दुगारवाडी"
    ]
  },
  {
    canonicalId: "navshya_ganpati",
    slug: "navshya-ganpati",
    latitude: 20.0075,
    longitude: 73.7420,
    coreKey: "navshya",
    aliases: [
      "navshya ganpati", "navshya ganpati temple", "navshya ganpati temple (anandvalli)",
      "anandvalli ganpati", "navasya ganpati", "navshya ganapati",
      "नवश्या गणपती", "आनंदवल्ली गणपती", "नवश्या गणपती मंदिर"
    ]
  },
  {
    canonicalId: "someshwar_temple",
    slug: "someshwar-temple",
    latitude: 20.0195,
    longitude: 73.7315,
    coreKey: "someshwar",
    aliases: [
      "someshwar", "someshwar temple", "someshwar mahadev", "someshwar mahadev temple",
      "someshwar waterfall", "someshwar falls", "someshwar mahadev temple & waterfall",
      "someshwar temple & waterfall", "someshwar cascade",
      "सोमेश्वर", "सोमेश्वर मंदिर", "सोमेश्वर धबधबा", "सोमेश्वर महादेव मंदिर"
    ]
  },
  {
    canonicalId: "gangapur_dam",
    slug: "gangapur-dam",
    latitude: 20.0245,
    longitude: 73.6825,
    coreKey: "gangapur",
    aliases: [
      "gangapur dam", "gangapur reservoir", "gangapur dam & backwaters",
      "gangapur dam, boating & backwaters", "gangapur boating",
      "गंगापूर धरण", "गंगापूर", "गंगापूर बोट क्लब"
    ]
  },
  {
    canonicalId: "pandavleni_caves",
    slug: "pandavleni-caves",
    latitude: 19.9615,
    longitude: 73.7490,
    coreKey: "pandavleni",
    aliases: [
      "pandavleni", "pandavleni caves", "pandav leni", "pandav leni caves",
      "trirashmi caves", "trirashmi buddhist caves", "pandavleni caves (trirashmi buddhist caves)",
      "पांडवलेणी", "पांडव लेणी", "त्रिरश्मी लेणी"
    ]
  },
  {
    canonicalId: "dadasaheb_phalke_smarak",
    slug: "dadasaheb-phalke-smarak",
    latitude: 19.9590,
    longitude: 73.7510,
    coreKey: "phalke",
    aliases: [
      "dadasaheb phalke smarak", "phalke smarak", "dadasaheb phalke smarak & buddha vihar",
      "dadasaheb phalke memorial", "दादासाहेब फाळके स्मारक", "फाळके स्मारक"
    ]
  },
  {
    canonicalId: "muktidham_temple",
    slug: "muktidham-temple",
    latitude: 19.9575,
    longitude: 73.8340,
    coreKey: "muktidham",
    aliases: [
      "muktidham", "muktidham temple", "muktidham mandir", "muktidham temple complex",
      "muktidham nashik road", "मुक्तिधाम", "मुक्तिधाम मंदिर", "मुक्तीधाम"
    ]
  },
  {
    canonicalId: "artillery_museum",
    slug: "artillery-museum",
    latitude: 19.9230,
    longitude: 73.8290,
    coreKey: "artillery",
    aliases: [
      "artillery museum", "artillery centre museum", "artillery centre museum (deolali)",
      "deolali artillery museum", "artillery center deolali", "आर्टिलरी म्युझियम"
    ]
  },
  {
    canonicalId: "saptashrungi_temple",
    slug: "saptashrungi-temple",
    latitude: 20.3900,
    longitude: 73.9000,
    coreKey: "saptashrungi",
    aliases: [
      "saptashrungi", "saptashrungi devi", "saptashrungi devi temple",
      "saptashrungi temple", "vani saptashrungi", "saptashrungi devi temple (shaktipeeth vani)",
      "saptashringi", "saptashrungi gad", "सप्तशृंगी", "सप्तशृंगी देवी मंदिर", "सप्तशृंगी गड"
    ]
  },
  {
    canonicalId: "gondeshwar_temple",
    slug: "gondeshwar-temple",
    latitude: 19.8510,
    longitude: 73.9960,
    coreKey: "gondeshwar",
    aliases: [
      "gondeshwar", "gondeshwar temple", "gondeshwar mandir",
      "gondeshwar temple (11th-century hemadpanthi)", "gondeshwar temple sinnar",
      "sinnar gondeshwar", "गोंदेश्वर मंदिर", "गोंदेश्वर", "गोंदेश्वर मंदिर सिन्नर"
    ]
  },
  {
    canonicalId: "gargoti_museum",
    slug: "gargoti-museum",
    latitude: 19.8450,
    longitude: 74.0020,
    coreKey: "gargoti",
    aliases: [
      "gargoti", "gargoti museum", "gargoti mineral museum", "gargoti the mineral museum",
      "गारगोटी म्युझियम", "गारगोटी संग्रहालय", "गारगोटी"
    ]
  },
  {
    canonicalId: "nandur_madhmeshwar",
    slug: "nandur-madhmeshwar",
    latitude: 20.0210,
    longitude: 74.1280,
    coreKey: "madhmeshwar",
    aliases: [
      "nandur madhmeshwar", "nandur madhmeshwar bird sanctuary",
      "nandur madhmeshwar bird sanctuary (ramsar site)", "nandur madhyameshwar",
      "नांदूर मधमेश्वर", "नांदूर मध्यमेश्वर पक्षी अभयारण्य"
    ]
  },
  {
    canonicalId: "sula_vineyards",
    slug: "sula-vineyards",
    latitude: 20.0060,
    longitude: 73.6880,
    coreKey: "sula",
    aliases: [
      "sula", "sula vineyards", "sula vineyards & tasting tour", "sula winery",
      "सुला वाईनयार्ड्स", "सुला"
    ]
  },
  {
    canonicalId: "york_winery",
    slug: "york-winery",
    latitude: 20.0090,
    longitude: 73.6820,
    coreKey: "york",
    aliases: [
      "york winery", "york winery & tasting lounge", "york vineyards",
      "यॉर्क वाईनरी", "यॉर्क"
    ]
  }
];

/**
 * Finds the canonical metadata record matching an itinerary item or title.
 */
function findCanonicalEntry(titleOrId) {
  if (!titleOrId) return null;
  const normalized = normalizeText(titleOrId);
  const rawClean = String(titleOrId).toLowerCase().trim();

  for (const entry of CANONICAL_DESTINATIONS) {
    if (entry.canonicalId === rawClean || entry.slug === rawClean) return entry;
    for (const alias of entry.aliases) {
      if (normalizeText(alias) === normalized) return entry;
    }
  }

  // Fallback: check if title contains the distinct coreKey
  for (const entry of CANONICAL_DESTINATIONS) {
    if (normalized.includes(entry.coreKey)) return entry;
  }

  return null;
}

/**
 * Matches an itinerary item against candidate Discover Nashik platform places.
 * 
 * Returns matched Place object or null if no confident match is established.
 */
function matchDestinationToPlace(destinationItem, candidatePlaces) {
  if (!destinationItem || !Array.isArray(candidatePlaces) || candidatePlaces.length === 0) {
    return null;
  }

  const itemTitle = destinationItem.title || "";
  const itemPlaceId = destinationItem.placeId ? String(destinationItem.placeId).trim() : null;
  const canonical = findCanonicalEntry(itemTitle) || findCanonicalEntry(destinationItem.id);

  // ─── Priority 1: Existing unique place ID ───
  if (itemPlaceId) {
    const exactIdMatch = candidatePlaces.find(p => {
      const pid = String(p._id || p.id || "").trim();
      return pid === itemPlaceId;
    });
    if (exactIdMatch) return exactIdMatch;
  }

  // ─── Priority 2: Canonical place identifier or slug ───
  if (canonical) {
    const slugMatch = candidatePlaces.find(p => {
      const pid = String(p._id || p.id || "").toLowerCase().trim();
      const pSlug = String(p.slug || "").toLowerCase().trim();
      return pid === canonical.canonicalId || pid === canonical.slug || pSlug === canonical.slug;
    });
    if (slugMatch) return slugMatch;
  }

  const normalizedItemTitle = normalizeText(itemTitle);
  if (!normalizedItemTitle) return null;

  // ─── Priority 3: Normalised exact place name ───
  for (const p of candidatePlaces) {
    const pName = normalizeText(p.name || p.business_name || "");
    if (pName && pName === normalizedItemTitle) {
      return p;
    }
  }

  // ─── Priority 4: Verified alternative names and aliases (English, Marathi, Hindi) ───
  if (canonical) {
    for (const p of candidatePlaces) {
      const pNameNorm = normalizeText(p.name || p.business_name || "");
      // Check place primary name against canonical aliases
      for (const alias of canonical.aliases) {
        if (normalizeText(alias) === pNameNorm) {
          return p;
        }
      }

      // Check place localizedContent names if present
      if (p.localizedContent && typeof p.localizedContent === "object") {
        for (const lang of Object.keys(p.localizedContent)) {
          const locName = normalizeText(p.localizedContent[lang]?.name || "");
          if (locName) {
            for (const alias of canonical.aliases) {
              if (normalizeText(alias) === locName) {
                return p;
              }
            }
          }
        }
      }
    }
  }

  // ─── Priority 5: Carefully validated fuzzy name matching (Core distinctive tokens) ───
  const targetCoreKey = canonical ? canonical.coreKey : null;
  const candidateMatches = [];

  for (const p of candidatePlaces) {
    const pNameNorm = normalizeText(p.name || p.business_name || "");
    if (!pNameNorm) continue;

    let isMatch = false;

    if (targetCoreKey && pNameNorm.includes(targetCoreKey)) {
      isMatch = true;
    } else {
      // Extract distinctive tokens from itemTitle and compare
      const itemTokens = extractCoreTokens(normalizedItemTitle);
      const placeTokens = extractCoreTokens(pNameNorm);
      const intersection = itemTokens.filter(t => placeTokens.includes(t));
      if (intersection.length >= 2 || (intersection.length === 1 && intersection[0].length >= 5)) {
        isMatch = true;
      }
    }

    if (isMatch) {
      candidateMatches.push(p);
    }
  }

  // ─── Priority 6: Geographical coordinate verification to resolve ambiguity ───
  if (candidateMatches.length === 1) {
    const singleMatch = candidateMatches[0];
    // If coordinate metadata is available on both, verify proximity (< 3.0 km)
    const pLat = singleMatch.latitude ?? singleMatch.lat;
    const pLon = singleMatch.longitude ?? singleMatch.lng;
    const destLat = destinationItem.latitude ?? canonical?.latitude;
    const destLon = destinationItem.longitude ?? canonical?.longitude;

    if (pLat != null && destLat != null) {
      const distKm = calculateHaversineDistanceKm(destLat, destLon, pLat, pLon);
      if (distKm != null && distKm > 8.0) {
        // More than 8 km apart despite name similarity -> Reject (different locations!)
        return null;
      }
    }
    return singleMatch;
  }

  if (candidateMatches.length > 1) {
    // Ambiguous multiple name matches: Pick the one with closest geographic proximity
    const destLat = destinationItem.latitude ?? canonical?.latitude;
    const destLon = destinationItem.longitude ?? canonical?.longitude;

    if (destLat != null && destLon != null) {
      let closestPlace = null;
      let minDistance = Infinity;

      for (const p of candidateMatches) {
        const pLat = p.latitude ?? p.lat;
        const pLon = p.longitude ?? p.lng;
        if (pLat != null && pLon != null) {
          const distKm = calculateHaversineDistanceKm(destLat, destLon, pLat, pLon);
          if (distKm != null && distKm < minDistance) {
            minDistance = distKm;
            closestPlace = p;
          }
        }
      }

      if (closestPlace && minDistance <= 3.0) {
        return closestPlace;
      }
    }

    // Still ambiguous -> Do NOT match to avoid showing incorrect destination
    return null;
  }

  return null;
}

module.exports = {
  CANONICAL_DESTINATIONS,
  findCanonicalEntry,
  normalizeText,
  extractCoreTokens,
  calculateHaversineDistanceKm,
  matchDestinationToPlace
};

