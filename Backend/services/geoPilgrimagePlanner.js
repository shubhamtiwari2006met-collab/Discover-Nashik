/**
 * geoPilgrimagePlanner.js
 * Intelligent Geography-Based Pilgrimage Planner Engine for Discover Nashik
 *
 * Implements:
 * - Verified geographical coordinates & road networks of Nashik & surrounding pilgrimage hubs
 * - 7 distinct geographical zones (Panchavati, Trimbakeshwar, Gangapur, Pathardi, Nashik Road, Vani, Sinnar)
 * - Temple darshan timings & afternoon sanctum closure rules (no temple visits scheduled during closure)
 * - Haversine distance with realistic road tortuosity and traffic-calibrated travel buffers
 * - Cohesive single-zone daily circuits preventing erratic zig-zag cross-city travel
 * - Full-day scheduling (morning snan/darshan, midday lunch/open sites, evening aarti/cultural experiences)
 * - Simhastha Kumbh Mela 2027 Shahi Snan date detection & pedestrian traffic advisories
 * - Senior citizen, low-walking, and accessibility compliance
 */

// ─── 1. VERIFIED NASHIK PILGRIMAGE DESTINATIONS DATABASE ───
const PILGRIMAGE_DESTINATIONS = [
  // ── ZONE 1: PANCHAVATI & OLD NASHIK (Sacred Riverfront & Ramayana Circuit) ──
  {
    id: "ram_kund",
    title: "Ram Kund & Godavari Ghats",
    category: "Spiritual",
    zone: "ZONE_1_PANCHAVATI",
    zoneName: "Panchavati & Old Nashik",
    location: "Panchavati, Nashik",
    latitude: 20.0063,
    longitude: 73.7915,
    durationMinutes: 90,
    openTime: 330,   // 05:30 AM
    closeTime: 1320, // 10:00 PM
    afternoonClosed: false, // Open ghat
    isEarlyMorning: true,
    isEveningAarti: true,
    aartiTime: "06:30 PM - 07:15 PM (Ganga Godavari Aarti)",
    darshanNotes: "Primary holy bathing ghat of Kumbh Mela. Holy dips best in early morning. Daily evening Maha Aarti at 6:30 PM.",
    description: "Sacred bathing ghat where Lord Rama bathed during exile; millions congregate here for holy dips during Kumbh Mela.",
    accessibility: { hasStairs: true, stairCount: 20, wheelchairAccessible: false, walkingIntensity: "Low" },
    tags: ["Spiritual", "Kumbh experiences", "Culture", "Photography"]
  },
  {
    id: "kapaleshwar_temple",
    title: "Kapaleshwar Mahadev Temple",
    category: "Spiritual",
    zone: "ZONE_1_PANCHAVATI",
    zoneName: "Panchavati & Old Nashik",
    location: "Panchavati, Nashik",
    latitude: 20.0068,
    longitude: 73.7922,
    durationMinutes: 45,
    openTime: 300,   // 05:00 AM
    closeTime: 1260, // 09:00 PM
    afternoonClosed: true,
    afternoonCloseStart: 750, // 12:30 PM
    afternoonCloseEnd: 960,   // 04:00 PM
    darshanNotes: "Unique Shiva temple where there is no Nandi statue. Temple sanctum closed 12:30 PM - 4:00 PM.",
    description: "Ancient Shiva shrine facing Ram Kund; Lord Shiva performed penance here without Nandi on advice of Brahma.",
    accessibility: { hasStairs: true, stairCount: 15, wheelchairAccessible: false, walkingIntensity: "Low" },
    tags: ["Spiritual", "Heritage", "Kumbh experiences"]
  },
  {
    id: "kalaram_temple",
    title: "Kalaram Temple (Kala Ram Sansthan)",
    category: "Heritage",
    zone: "ZONE_1_PANCHAVATI",
    zoneName: "Panchavati & Old Nashik",
    location: "Panchavati, Nashik",
    latitude: 20.0080,
    longitude: 73.7932,
    durationMinutes: 60,
    openTime: 330,   // 05:30 AM
    closeTime: 1260, // 09:00 PM
    afternoonClosed: true,
    afternoonCloseStart: 720, // 12:00 PM
    afternoonCloseEnd: 930,   // 03:30 PM
    darshanNotes: "Black stone architectural masterpiece. Sanctum closed 12:00 PM - 3:30 PM. Footwear strictly prohibited in precinct.",
    description: "Magnificent 18th-century black stone temple built by Sardar Rangarao Odhekar housing idols of Rama, Sita and Lakshmana.",
    accessibility: { hasStairs: true, stairCount: 12, wheelchairAccessible: false, walkingIntensity: "Low" },
    tags: ["Heritage", "Spiritual", "Culture"]
  },
  {
    id: "sita_gufa",
    title: "Sita Gufa (Sita's Cave)",
    category: "Heritage",
    zone: "ZONE_1_PANCHAVATI",
    zoneName: "Panchavati & Old Nashik",
    location: "Panchavati, Nashik",
    latitude: 20.0087,
    longitude: 73.7944,
    durationMinutes: 45,
    openTime: 360,   // 06:00 AM
    closeTime: 1170, // 07:30 PM
    afternoonClosed: true,
    afternoonCloseStart: 750, // 12:30 PM
    afternoonCloseEnd: 900,   // 03:00 PM
    darshanNotes: "Narrow crawl cave entry. Closed 12:30 PM - 3:00 PM. Not recommended for severely mobility-impaired.",
    description: "Sacred cave near Kalaram temple where Devi Sita worshipped Lord Shiva and from where Ravana abducted her.",
    accessibility: { hasStairs: true, stairCount: 25, wheelchairAccessible: false, walkingIntensity: "Moderate", lowWalkingIncompatible: true },
    tags: ["Heritage", "Spiritual", "Culture"]
  },
  {
    id: "naroshankar_temple",
    title: "Naroshankar Temple & Historic Bell",
    category: "Spiritual",
    zone: "ZONE_1_PANCHAVATI",
    zoneName: "Panchavati & Old Nashik",
    location: "Godavari Bank, Panchavati",
    latitude: 20.0055,
    longitude: 73.7938,
    durationMinutes: 45,
    openTime: 360,   // 06:00 AM
    closeTime: 1230, // 08:30 PM
    afternoonClosed: false,
    darshanNotes: "18th-century temple on riverfront famous for the Naroshankar Ghanta captured from Portuguese Vasai Fort.",
    description: "Richly carved stone temple on the Godavari bank with ancient river battlements and the celebrated victory bell.",
    accessibility: { hasStairs: true, stairCount: 8, wheelchairAccessible: false, walkingIntensity: "Low" },
    tags: ["Spiritual", "Heritage", "Culture"]
  },
  {
    id: "sundarnarayan_temple",
    title: "Sundarnarayan Temple",
    category: "Spiritual",
    zone: "ZONE_1_PANCHAVATI",
    zoneName: "Panchavati & Old Nashik",
    location: "Panchavati, Nashik",
    latitude: 20.0039,
    longitude: 73.7909,
    durationMinutes: 45,
    openTime: 360,   // 06:00 AM
    closeTime: 1230, // 08:30 PM
    afternoonClosed: true,
    afternoonCloseStart: 720, // 12:00 PM
    afternoonCloseEnd: 960,   // 04:00 PM
    darshanNotes: "Vishnu temple positioned such that sunrise rays fall directly on deity on Spring Equinox. Closed 12:00 PM - 4:00 PM.",
    description: "Exquisite 1756 temple with intricate carvings built by Gangadhar Yashwant Chandrachud dedicated to Lord Vishnu.",
    accessibility: { hasStairs: true, stairCount: 10, wheelchairAccessible: false, walkingIntensity: "Low" },
    tags: ["Spiritual", "Heritage", "Culture"]
  },
  {
    id: "tapovan_grove",
    title: "Tapovan Sacred Grove & Lakshman Kund",
    category: "Spiritual",
    zone: "ZONE_1_PANCHAVATI",
    zoneName: "Panchavati & Old Nashik",
    location: "Tapovan, Nashik",
    latitude: 20.0018,
    longitude: 73.8152,
    durationMinutes: 60,
    openTime: 360,   // 06:00 AM
    closeTime: 1140, // 07:00 PM
    afternoonClosed: false,
    darshanNotes: "Serene sacred garden where sage penances occurred and Surpanakha episode took place. Open all day.",
    description: "Peaceful riverfront woodland where Lakshmana performed meditation; features ancient hermitage sites and temples.",
    accessibility: { hasStairs: false, wheelchairAccessible: true, walkingIntensity: "Low" },
    tags: ["Spiritual", "Nature", "Culture"]
  },
  {
    id: "saraf_bazaar",
    title: "Saraf Bazaar & Old City Heritage Market",
    category: "Shopping",
    zone: "ZONE_1_PANCHAVATI",
    zoneName: "Panchavati & Old Nashik",
    location: "Old City, Nashik",
    latitude: 20.0015,
    longitude: 73.7885,
    durationMinutes: 75,
    openTime: 660,   // 11:00 AM
    closeTime: 1260, // 09:00 PM
    afternoonClosed: false,
    darshanNotes: "Best visited during afternoon hours when temples are in afternoon closure. Renowned for copperware & sweets.",
    description: "Vibrant traditional marketplace famous for pilgrimage copper kalashes, puja articles, handmade brass, and authentic Nashik chivda.",
    accessibility: { hasStairs: false, wheelchairAccessible: true, walkingIntensity: "Moderate" },
    tags: ["Shopping", "Food", "Culture"]
  },

  // ── ZONE 2: TRIMBAKESHWAR & BRAHMAGIRI (Western Sacred Circuit) ──
  {
    id: "trimbakeshwar_temple",
    title: "Trimbakeshwar Jyotirlinga Temple",
    category: "Spiritual",
    zone: "ZONE_2_TRIMBAKESHWAR",
    zoneName: "Trimbakeshwar & Brahmagiri",
    location: "Trimbak, Nashik",
    latitude: 19.9322,
    longitude: 73.5307,
    durationMinutes: 120,
    openTime: 330,   // 05:30 AM
    closeTime: 1260, // 09:00 PM
    afternoonClosed: true,
    afternoonCloseStart: 780, // 01:00 PM
    afternoonCloseEnd: 840,   // 02:00 PM (Sanctum cleaning break)
    isEarlyMorning: true,
    darshanNotes: "One of the 12 sacred Jyotirlingas, featuring a three-faced linga representing Brahma, Vishnu & Shiva. Expect queue buffers.",
    description: "Primary Shaivite Kumbh ritual centre and Jyotirlinga temple surrounded by Brahmagiri mountain, built by Peshwa Balaji Baji Rao.",
    accessibility: { hasStairs: true, stairCount: 15, wheelchairAccessible: false, walkingIntensity: "Moderate" },
    tags: ["Spiritual", "Heritage", "Kumbh experiences"]
  },
  {
    id: "kushavarta_kund",
    title: "Kushavarta Kund (Godavari Tirtha)",
    category: "Spiritual",
    zone: "ZONE_2_TRIMBAKESHWAR",
    zoneName: "Trimbakeshwar & Brahmagiri",
    location: "Trimbakeshwar",
    latitude: 19.9348,
    longitude: 73.5325,
    durationMinutes: 60,
    openTime: 300,   // 05:00 AM
    closeTime: 1260, // 09:00 PM
    afternoonClosed: false,
    darshanNotes: "Sacred pond where sage Gautama bound river Godavari with kusha grass; Akharas take Royal Shahi Snan here.",
    description: "Holy stone tank constructed in 1750 by Shrimant Rao Sahib Parnekar where holy dips wash away sins before temple darshan.",
    accessibility: { hasStairs: true, stairCount: 20, wheelchairAccessible: false, walkingIntensity: "Low" },
    tags: ["Spiritual", "Kumbh experiences"]
  },
  {
    id: "coin_museum_nashik",
    title: "Coin Museum Nashik (INRES)",
    category: "Heritage",
    zone: "ZONE_2_TRIMBAKESHWAR",
    zoneName: "Trimbakeshwar & Brahmagiri",
    location: "Anjaneri, Trimbak Road",
    latitude: 19.9285,
    longitude: 73.5930,
    durationMinutes: 60,
    openTime: 570,   // 09:30 AM
    closeTime: 1050, // 05:30 PM
    afternoonClosed: false,
    darshanNotes: "Asia's premier numismatic research institute. Excellent air-conditioned afternoon stop when temples are closed.",
    description: "Rich museum showcasing India's coinage from punch-marked ancient eras, Mughal periods, and British East India Company.",
    accessibility: { hasStairs: false, wheelchairAccessible: true, walkingIntensity: "Low" },
    tags: ["Heritage", "Culture", "Family"]
  },
  {
    id: "anjaneri_hill",
    title: "Anjaneri Hill (Birthplace of Lord Hanuman)",
    category: "Nature",
    zone: "ZONE_2_TRIMBAKESHWAR",
    zoneName: "Trimbakeshwar & Brahmagiri",
    location: "Anjaneri, Nashik",
    latitude: 19.9205,
    longitude: 73.5855,
    durationMinutes: 180,
    openTime: 360,   // 06:00 AM
    closeTime: 1050, // 05:30 PM (Daylight only)
    afternoonClosed: false,
    darshanNotes: "Demanding uphill climb of ~450 stone steps. Recommended only for morning or early afternoon daylight.",
    description: "Sacred peak where Mata Anjani gave birth to Lord Hanuman; offers spectacular plateau views of the Western Ghats.",
    accessibility: { hasStairs: true, stairCount: 450, wheelchairAccessible: false, walkingIntensity: "High", lowWalkingIncompatible: true },
    tags: ["Nature", "Trekking", "Photography", "Spiritual"]
  },
  {
    id: "brahmagiri_hill",
    title: "Brahmagiri Hill & Godavari Origin",
    category: "Nature",
    zone: "ZONE_2_TRIMBAKESHWAR",
    zoneName: "Trimbakeshwar & Brahmagiri",
    location: "Trimbakeshwar",
    latitude: 19.9280,
    longitude: 73.5220,
    durationMinutes: 180,
    openTime: 360,   // 06:00 AM
    closeTime: 1020, // 05:00 PM
    afternoonClosed: false,
    darshanNotes: "Steep staircase trek (~750 steps) leading to Gangadwar, origin stream of Godavari River. Daylight climb only.",
    description: "Sacred mountain considered a manifestation of Lord Shiva himself, where River Godavari descends into Trimbak valley.",
    accessibility: { hasStairs: true, stairCount: 750, wheelchairAccessible: false, walkingIntensity: "High", lowWalkingIncompatible: true },
    tags: ["Nature", "Spiritual", "Trekking"]
  },
  {
    id: "dugarwadi_waterfall",
    title: "Dugarwadi Waterfall",
    category: "Nature",
    zone: "ZONE_2_TRIMBAKESHWAR",
    zoneName: "Trimbakeshwar & Brahmagiri",
    location: "Trimbak Road, Nashik",
    latitude: 19.9650,
    longitude: 73.5120,
    durationMinutes: 100,
    openTime: 420,  // 07:00 AM
    closeTime: 1020, // 05:00 PM
    afternoonClosed: false,
    darshanNotes: "Stunning forest waterfall located 8 km from Trimbak town. Natural trail requires 20 min walk through woods.",
    description: "Spectacular multi-tiered cascade plunging into a lush green gorge, ideal for nature lovers and photographers.",
    accessibility: { hasStairs: false, wheelchairAccessible: false, walkingIntensity: "Moderate", lowWalkingIncompatible: true },
    tags: ["Nature", "Photography", "Trekking"]
  },

  // ── ZONE 3: GANGAPUR ROAD & SOMESHWAR (Riverside Temples & Agri-Tourism) ──
  {
    id: "navshya_ganpati",
    title: "Navshya Ganpati Temple (Anandvalli)",
    category: "Spiritual",
    zone: "ZONE_3_GANGAPUR",
    zoneName: "Gangapur Road & Anandvalli",
    location: "Anandvalli, Gangapur Road",
    latitude: 19.9950,
    longitude: 73.7445,
    durationMinutes: 50,
    openTime: 360,   // 06:00 AM
    closeTime: 1260, // 09:00 PM
    afternoonClosed: false,
    darshanNotes: "300-year-old wish-fulfilling Ganpati temple built by Peshwa Raghunathrao on the serene Godavari bank. Open all day.",
    description: "Historic Ganpati temple situated amidst quiet river greenery; famous for devotees praying for their wishes (Navas).",
    accessibility: { hasStairs: false, wheelchairAccessible: true, walkingIntensity: "Low" },
    tags: ["Spiritual", "Heritage", "Family"]
  },
  {
    id: "someshwar_temple_waterfall",
    title: "Someshwar Mahadev Temple & Waterfall",
    category: "Spiritual",
    zone: "ZONE_3_GANGAPUR",
    zoneName: "Gangapur Road & Anandvalli",
    location: "Someshwar, Gangapur",
    latitude: 20.0150,
    longitude: 73.7250,
    durationMinutes: 75,
    openTime: 360,   // 06:00 AM
    closeTime: 1200, // 08:00 PM
    afternoonClosed: true,
    afternoonCloseStart: 750, // 12:30 PM
    afternoonCloseEnd: 960,   // 04:00 PM
    darshanNotes: "Ancient Shiva temple beside a picturesque river cascade. Temple closed 12:30 PM - 4:00 PM, waterfall park open all day.",
    description: "Ancient temple dedicated to Lord Shiva situated beside a picturesque rocky waterfall on the Godavari river.",
    accessibility: { hasStairs: true, stairCount: 15, wheelchairAccessible: false, walkingIntensity: "Low" },
    tags: ["Spiritual", "Nature", "Family", "Photography"]
  },
  {
    id: "gangapur_dam",
    title: "Gangapur Dam, Boating & Backwaters",
    category: "Nature",
    zone: "ZONE_3_GANGAPUR",
    zoneName: "Gangapur Road & Anandvalli",
    location: "Gangapur, Nashik",
    latitude: 20.0380,
    longitude: 73.6920,
    durationMinutes: 90,
    openTime: 570,   // 09:30 AM
    closeTime: 1110, // 06:30 PM
    afternoonClosed: false,
    darshanNotes: "Maharashtra's largest earthen dam. Best in late afternoon for sunset boating, water sports, and photography.",
    description: "Massive reservoir built across Godavari offering scenic water sports club, bird observation, and sunset panoramic views.",
    accessibility: { hasStairs: false, wheelchairAccessible: true, walkingIntensity: "Low" },
    tags: ["Nature", "Family", "Photography"]
  },
  {
    id: "sula_vineyards",
    title: "Sula Vineyards & Tasting Tour",
    category: "Vineyards",
    zone: "ZONE_3_GANGAPUR",
    zoneName: "Gangapur Road & Anandvalli",
    location: "Gangapur Dam Road, Nashik",
    latitude: 20.0060,
    longitude: 73.6880,
    durationMinutes: 100,
    openTime: 690,   // 11:30 AM
    closeTime: 1260, // 09:00 PM
    afternoonClosed: false,
    isOptionalNonSpiritual: true,
    darshanNotes: "Only scheduled if traveler preferences explicitly include Vineyards, Food, or Photography.",
    description: "Pioneering Indian winery estate offering guided harvest tours, grape processing exhibits, and balcony dining.",
    accessibility: { hasStairs: false, wheelchairAccessible: true, walkingIntensity: "Low" },
    tags: ["Vineyards", "Food", "Culture", "Photography"]
  },
  {
    id: "york_winery",
    title: "York Winery & Tasting Lounge",
    category: "Vineyards",
    zone: "ZONE_3_GANGAPUR",
    zoneName: "Gangapur Road & Anandvalli",
    location: "Gangapur, Nashik",
    latitude: 20.0090,
    longitude: 73.6820,
    durationMinutes: 80,
    openTime: 720,   // 12:00 PM
    closeTime: 1260, // 09:00 PM
    afternoonClosed: false,
    isOptionalNonSpiritual: true,
    darshanNotes: "Boutique vineyard overlooking Gangapur lake. Only scheduled for wine/food interest travelers.",
    description: "Family-run boutique winery known for artisanal handcrafted wines and tranquil views of the lake hills.",
    accessibility: { hasStairs: false, wheelchairAccessible: true, walkingIntensity: "Low" },
    tags: ["Vineyards", "Food", "Photography"]
  },

  // ── ZONE 4: PATHARDI, PANDAVLENI & SOUTHERN NASHIK (Ancient Rock-Cut Heritage) ──
  {
    id: "pandavleni_caves",
    title: "Pandavleni Caves (Trirashmi Buddhist Caves)",
    category: "Heritage",
    zone: "ZONE_4_PATHARDI",
    zoneName: "Pandavleni & Pathardi",
    location: "Pathardi Phata, Mumbai Highway",
    latitude: 19.9610,
    longitude: 73.7485,
    durationMinutes: 90,
    openTime: 480,   // 08:00 AM
    closeTime: 1050, // 05:30 PM (ASI protected, daylight only)
    afternoonClosed: false,
    darshanNotes: "24 rock-cut Hinayana Buddhist caves dating to 1st century BCE. Requires climbing ~300 stone steps. Great morning views.",
    description: "Ancient rock-hewn viharas and chaityas featuring intricate pillars, water cisterns, and Brahmi inscriptions.",
    accessibility: { hasStairs: true, stairCount: 300, wheelchairAccessible: false, walkingIntensity: "High", lowWalkingIncompatible: true },
    tags: ["Heritage", "Culture", "Photography"]
  },
  {
    id: "phalke_smarak",
    title: "Dadasaheb Phalke Smarak & Buddha Vihar",
    category: "Heritage",
    zone: "ZONE_4_PATHARDI",
    zoneName: "Pandavleni & Pathardi",
    location: "Pathardi Phata, Nashik",
    latitude: 19.9585,
    longitude: 73.7470,
    durationMinutes: 75,
    openTime: 600,   // 10:00 AM
    closeTime: 1140, // 07:00 PM
    afternoonClosed: false,
    darshanNotes: "Sprawling landscaped cultural memorial at base of Pandavleni. Completely wheelchair accessible with musical fountain.",
    description: "Grand memorial honouring the father of Indian cinema, featuring landscaped gardens, meditation halls, and museum.",
    accessibility: { hasStairs: false, wheelchairAccessible: true, walkingIntensity: "Low" },
    tags: ["Heritage", "Culture", "Family"]
  },

  // ── ZONE 5: NASHIK ROAD & DEOLALI (Modern Pilgrim Shrine & Cantonment) ──
  {
    id: "muktidham_temple",
    title: "Muktidham Temple Complex",
    category: "Spiritual",
    zone: "ZONE_5_NASHIK_ROAD",
    zoneName: "Nashik Road & Deolali",
    location: "Nashik Road",
    latitude: 19.9555,
    longitude: 73.8340,
    durationMinutes: 60,
    openTime: 360,   // 06:00 AM
    closeTime: 1230, // 08:30 PM
    afternoonClosed: true,
    afternoonCloseStart: 750, // 12:30 PM
    afternoonCloseEnd: 960,   // 04:00 PM
    darshanNotes: "Crafted entirely from Makrana white marble with 18 chapters of Bhagavad Gita carved on walls. Closed 12:30 PM - 4:00 PM.",
    description: "Unique spiritual complex replicating all 12 Jyotirlinga shrines and famous Char Dham temples across India.",
    accessibility: { hasStairs: false, wheelchairAccessible: true, walkingIntensity: "Low" },
    tags: ["Spiritual", "Family", "Heritage"]
  },
  {
    id: "artillery_museum",
    title: "Artillery Centre Museum (Deolali)",
    category: "Heritage",
    zone: "ZONE_5_NASHIK_ROAD",
    zoneName: "Nashik Road & Deolali",
    location: "Deolali Cantonment",
    latitude: 19.9320,
    longitude: 73.8210,
    durationMinutes: 60,
    openTime: 570,   // 09:30 AM
    closeTime: 1020, // 05:00 PM (Closed on Mondays)
    afternoonClosed: false,
    darshanNotes: "Asia's largest military artillery museum showcasing tanks, radars, and historical cannons. Valid ID required for entry.",
    description: "Prestigious military museum illustrating historical Indian artillery weaponry from Babur's era to modern Bofors guns.",
    accessibility: { hasStairs: false, wheelchairAccessible: true, walkingIntensity: "Low" },
    tags: ["Heritage", "Culture", "Family"]
  },

  // ── ZONE 6: VANI & SAPTASHRUNGI (Northern Shaktipeeth Excursion - 65 km) ──
  {
    id: "saptashrungi_temple",
    title: "Saptashrungi Devi Temple (Shaktipeeth Vani)",
    category: "Spiritual",
    zone: "ZONE_6_VANI_SAPTASHRUNGI",
    zoneName: "Vani & Saptashrungi",
    location: "Saptashrungi Gad, Vani",
    latitude: 20.3900,
    longitude: 73.9050,
    durationMinutes: 150,
    openTime: 300,   // 05:00 AM
    closeTime: 1260, // 09:00 PM
    afternoonClosed: false,
    darshanNotes: "Major Shaktipeeth where Goddess Mahishasurmardini resides. Modern Funicular Trolley available for elderly pilgrims.",
    description: "Revered hillside goddess shrine nestled among seven mountain pinnacles (Saptashrunga); one of Maharashtra's 3.5 Shaktipeeths.",
    accessibility: { hasStairs: true, stairCount: 470, wheelchairAccessible: true, funicularAvailable: true, walkingIntensity: "Moderate" },
    tags: ["Spiritual", "Nature", "Photography"]
  },

  // ── ZONE 7: SINNAR & SOUTHERN HERITAGE (Hemadpanthi Temple Circuit - 30 km) ──
  {
    id: "gondeshwar_temple",
    title: "Gondeshwar Temple (11th-Century Hemadpanthi)",
    category: "Heritage",
    zone: "ZONE_7_SINNAR",
    zoneName: "Sinnar & Southern Heritage",
    location: "Sinnar, Nashik",
    latitude: 19.8450,
    longitude: 73.9920,
    durationMinutes: 60,
    openTime: 360,   // 06:00 AM
    closeTime: 1140, // 07:00 PM
    afternoonClosed: false,
    darshanNotes: "Finest preserved Panchayatana temple in Maharashtra from Seuna/Yadava dynasty. Open continuously.",
    description: "Magnificent 900-year-old stone temple with a central Shiva shrine surrounded by four shrines to Surya, Vishnu, Parvati and Ganesha.",
    accessibility: { hasStairs: true, stairCount: 10, wheelchairAccessible: false, walkingIntensity: "Low" },
    tags: ["Heritage", "Spiritual", "Culture", "Photography"]
  },
  {
    id: "gargoti_museum",
    title: "Gargoti Mineral Museum",
    category: "Heritage",
    zone: "ZONE_7_SINNAR",
    zoneName: "Sinnar & Southern Heritage",
    location: "MIDC Malegaon, Sinnar",
    latitude: 19.8650,
    longitude: 73.9850,
    durationMinutes: 60,
    openTime: 600,   // 10:00 AM
    closeTime: 1080, // 06:00 PM
    afternoonClosed: false,
    darshanNotes: "India's only private gemological and mineral museum. Awarded internationally for natural zeolite clusters.",
    description: "Internationally acclaimed museum exhibiting rare natural mineral crystals, zeolites, and prehistoric fossils.",
    accessibility: { hasStairs: false, wheelchairAccessible: true, walkingIntensity: "Low" },
    tags: ["Heritage", "Family", "Culture"]
  },

  // ── ZONE 8: NIPHAD & NORTH-EAST SANCTUARY (Wetland Excursion) ──
  {
    id: "nandur_madhmeshwar",
    title: "Nandur Madhmeshwar Bird Sanctuary (Ramsar Site)",
    category: "Nature",
    zone: "ZONE_8_NIPHAD",
    zoneName: "Niphad Wetland & Ramsar Site",
    location: "Niphad, Nashik",
    latitude: 20.0020,
    longitude: 74.1120,
    durationMinutes: 120,
    openTime: 420,  // 07:00 AM
    closeTime: 1050, // 05:30 PM (Daylight only)
    afternoonClosed: false,
    darshanNotes: "Known as the Bharatpur of Maharashtra. Best visited during early morning hours for bird watching from watchtowers.",
    description: "Maharashtra's first Ramsar wetland sanctuary created at the confluence of Godavari and Kadwa rivers, home to 230+ bird species.",
    accessibility: { hasStairs: false, wheelchairAccessible: true, walkingIntensity: "Moderate" },
    tags: ["Nature", "Photography", "Family"]
  }
];

// ─── 2. GEOGRAPHICAL ZONES DEFINITION ───
const GEOGRAPHICAL_ZONES = {
  ZONE_1_PANCHAVATI: {
    id: "ZONE_1_PANCHAVATI",
    name: "Panchavati & Sacred Riverfront Circuit",
    centerLat: 20.0063,
    centerLng: 73.7925,
    description: "High-density pedestrian-friendly circuit along sacred Godavari River and Ramayana landmarks.",
    defaultDurationDays: 1,
    circuits: ["ram_kund", "kapaleshwar_temple", "kalaram_temple", "sita_gufa", "naroshankar_temple", "sundarnarayan_temple", "saraf_bazaar", "tapovan_grove"]
  },
  ZONE_2_TRIMBAKESHWAR: {
    id: "ZONE_2_TRIMBAKESHWAR",
    name: "Trimbakeshwar Jyotirlinga & Brahmagiri Circuit",
    centerLat: 19.9322,
    centerLng: 73.5307,
    description: "Western spiritual hub at the source of Godavari River, 28 km west of Nashik City.",
    defaultDurationDays: 1,
    circuits: ["trimbakeshwar_temple", "kushavarta_kund", "coin_museum_nashik", "anjaneri_hill", "brahmagiri_hill", "dugarwadi_waterfall"]
  },
  ZONE_3_GANGAPUR: {
    id: "ZONE_3_GANGAPUR",
    name: "Gangapur Road, Someshwar & Backwaters Circuit",
    centerLat: 20.0150,
    centerLng: 73.7250,
    description: "Scenic riverside corridor featuring ancient Shiva/Ganpati temples and backwater recreation.",
    defaultDurationDays: 1,
    circuits: ["navshya_ganpati", "someshwar_temple_waterfall", "gangapur_dam", "sula_vineyards", "york_winery"]
  },
  ZONE_4_PATHARDI: {
    id: "ZONE_4_PATHARDI",
    name: "Pathardi Phata & Pandavleni Heritage Circuit",
    centerLat: 19.9600,
    centerLng: 73.7480,
    description: "Southern Buddhist rock-cut heritage and cultural memorials at the base of Trirashmi hill.",
    defaultDurationDays: 0.5,
    circuits: ["pandavleni_caves", "phalke_smarak"]
  },
  ZONE_5_NASHIK_ROAD: {
    id: "ZONE_5_NASHIK_ROAD",
    name: "Nashik Road & Deolali Heritage Circuit",
    centerLat: 19.9555,
    centerLng: 73.8340,
    description: "Modern pilgrimage shrine complex and historic military cantonment near the railway junction.",
    defaultDurationDays: 0.5,
    circuits: ["muktidham_temple", "artillery_museum"]
  },
  ZONE_6_VANI_SAPTASHRUNGI: {
    id: "ZONE_6_VANI_SAPTASHRUNGI",
    name: "Vani Saptashrungi Shaktipeeth Excursion",
    centerLat: 20.3900,
    centerLng: 73.9050,
    description: "Full-day northern pilgrimage excursion (~65 km via Dindori) to the hilltop Shaktipeeth.",
    defaultDurationDays: 1,
    circuits: ["saptashrungi_temple"]
  },
  ZONE_7_SINNAR: {
    id: "ZONE_7_SINNAR",
    name: "Sinnar Ancient Hemadpanthi Circuit",
    centerLat: 19.8550,
    centerLng: 73.9900,
    description: "Southern heritage excursion (~30 km via Pune Highway) to 11th-century Yadava stone architecture.",
    defaultDurationDays: 1,
    circuits: ["gondeshwar_temple", "gargoti_museum"]
  },
  ZONE_8_NIPHAD: {
    id: "ZONE_8_NIPHAD",
    name: "Niphad Ramsar Wetland & Nature Excursion",
    centerLat: 20.0020,
    centerLng: 74.1120,
    description: "Eastern nature excursion (~40 km via Aurangabad highway) to Maharashtra's premier bird sanctuary.",
    defaultDurationDays: 1,
    circuits: ["nandur_madhmeshwar"]
  }
};

// ─── 3. SIMHASTHA KUMBH MELA 2027 SHAHI SNAN DATES ───
const KUMBH_SHAHI_SNAN_DATES = {
  "2027-07-14": {
    eventName: "Dhwajarohan (Ceremonial Flag Hoisting)",
    primaryGhat: "Ram Kund & Trimbakeshwar",
    trafficRestrictions: "Inner ring road restricted to official shuttles; private vehicle parking strictly at Outer Tapovan & Nilgiri Baug.",
    advisory: "Ceremonial flag hoisting marks the spiritual commencement of Kumbh Mela. Expect high pilgrim gathering from 6:00 AM."
  },
  "2027-08-02": {
    eventName: "First Shahi Snan (Shravan Krishna Amavasya)",
    primaryGhat: "Ram Kund & Kushavarta Kund",
    trafficRestrictions: "Complete pedestrian-only zone across Panchavati & Trimbak town. Vehicle movement prohibited inside 3 km perimeter.",
    advisory: "Royal bath processions of Sadhus and Akharas until 12:00 PM. General public bathing opens after midday. Early arrival via shuttle recommended."
  },
  "2027-08-17": {
    eventName: "Second Shahi Snan (Main Royal Holy Bath - Shravan Purnima)",
    primaryGhat: "Ram Kund & Kushavarta Kund",
    trafficRestrictions: "Highest crowd density day. Dedicated color-coded walking corridors enforced. Emergency medical posts active every 200m.",
    advisory: "The most auspicious bathing day of the entire Kumbh Mela. Follow designated circular entry and exit ghats; avoid crossing Akhara procession routes."
  },
  "2027-08-31": {
    eventName: "Third Shahi Snan (Bhadrapada Amavasya)",
    primaryGhat: "Ram Kund & Kushavarta Kund",
    trafficRestrictions: "Heavy pedestrian corridors leading to Godavari River. Free electric shuttles run continuously from outer parking plazas.",
    advisory: "Significant pilgrimage crowd for Amavasya tarpan and holy dips. Plan for extra security checking and queue waiting times."
  },
  "2027-09-12": {
    eventName: "Rushipanchami Snan & Sanyasi Shahi Snan",
    primaryGhat: "Ram Kund & Godavari Ghats",
    trafficRestrictions: "Traffic diversions in force across Old Nashik and CBS. Central holding zones active.",
    advisory: "Auspicious bathing day dedicated to the ancient Saptarshis. Favourable for early morning holy bath."
  }
};

// ─── 4. GEOGRAPHICAL ROUTING & TRAVEL TIME CALCULATION ───

/**
 * Calculates accurate geodesic distance (km) using Haversine formula
 */
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
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

/**
 * Calculates realistic road travel time and distance between two destinations.
 * Takes into account:
 * - Walking mode for ultra-close temples within Panchavati / Trimbak precincts (< 0.8 km)
 * - Road tortuosity factors (actual winding roads vs straight line)
 * - Congestion profiles of Old Nashik city streets vs. State Highways
 */
function estimateRealisticTravel(placeA, placeB, preferredMode = "Car") {
  if (!placeA || !placeB) return { distanceKm: 1, travelMinutes: 10, mode: "Drive" };

  const straightLineKm = calculateHaversineDistanceKm(
    placeA.latitude,
    placeA.longitude,
    placeB.latitude,
    placeB.longitude
  );

  // 1. Walking within the same compact precinct (e.g. Ram Kund -> Kalaram -> Sita Gufa)
  if (straightLineKm <= 0.8 && placeA.zone === placeB.zone) {
    const walkingDistanceKm = Math.round((straightLineKm * 1.2) * 10) / 10;
    // Average walking speed ~ 4 km/h -> 15 mins per km
    const walkingMinutes = Math.max(4, Math.round(walkingDistanceKm * 15));
    return {
      distanceKm: walkingDistanceKm,
      travelMinutes: walkingMinutes,
      mode: "Walk",
      instructions: `Short walking route (${walkingDistanceKm * 1000} m) through pilgrimage pedestrian lanes.`
    };
  }

  // 2. Road travel (driving / auto / shuttle)
  // Winding factor: City lanes ~ 1.35x, State Highways ~ 1.25x
  const isHighway = placeA.zone !== placeB.zone && (placeA.zone.includes("TRIMBAK") || placeB.zone.includes("TRIMBAK") || placeA.zone.includes("VANI") || placeB.zone.includes("VANI") || placeA.zone.includes("SINNAR") || placeB.zone.includes("SINNAR"));
  const tortuosity = isHighway ? 1.25 : 1.35;
  const roadDistanceKm = Math.round((straightLineKm * tortuosity) * 10) / 10;

  let averageSpeedKmh = 25; // default urban Nashik city driving
  if (isHighway) {
    averageSpeedKmh = 45; // Trimbak highway NH 848 or Vani/Sinnar state highway
  } else if (placeA.zone === "ZONE_1_PANCHAVATI" && placeB.zone === "ZONE_1_PANCHAVATI") {
    averageSpeedKmh = 18; // dense old market / Panchavati lanes
  }

  // Calculate driving time with a 5-minute parking/buffer overhead
  const drivingMinutes = Math.max(8, Math.round((roadDistanceKm / averageSpeedKmh) * 60) + 5);

  return {
    distanceKm: roadDistanceKm,
    travelMinutes: drivingMinutes,
    mode: preferredMode === "Walk" ? "Walk" : "Drive",
    instructions: `Drive via ${isHighway ? "State Highway corridor" : "city connecting roads"} (~${roadDistanceKm} km).`
  };
}

/**
 * Helper to convert minutes from midnight (e.g. 540) to standard 12h display string ("09:00 AM")
 */
function formatMinutesTo12h(totalMinutes) {
  const normalized = totalMinutes % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${displayHours}:${displayMinutes} ${period}`;
}

// ─── 5. INTELLIGENT DAILY CIRCUIT SCHEDULER ───

/**
 * Arranges places in an optimal geographical sequence (nearest-neighbour tour)
 * to eliminate backtracking across the city.
 */
function sequencePlacesGeographically(places) {
  if (places.length <= 2) return places;

  const ordered = [];
  const unvisited = [...places];

  // Start with early morning anchor (e.g., Ram Kund or Trimbakeshwar) if present
  let startIndex = unvisited.findIndex(p => p.isEarlyMorning);
  if (startIndex === -1) startIndex = 0;

  ordered.push(unvisited.splice(startIndex, 1)[0]);

  while (unvisited.length > 0) {
    const current = ordered[ordered.length - 1];
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = calculateHaversineDistanceKm(
        current.latitude,
        current.longitude,
        unvisited[i].latitude,
        unvisited[i].longitude
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = i;
      }
    }

    ordered.push(unvisited.splice(nearestIdx, 1)[0]);
  }

  return ordered;
}

/**
 * Builds a realistic, full-day schedule for a selected set of places on a given day.
 * Ensures:
 * - Temples are NOT scheduled during afternoon closure (12:00 PM - 03:30/04:00 PM)
 * - Lunch & rest break is naturally slotted in midday (12:30 PM - 01:45 PM)
 * - Afternoon slots feature continuously open sites (Coin Museum, shopping, gardens, lakes)
 * - Evening includes Ganga Godavari Aarti or sunset point when present in zone
 * - Realistic travel times between consecutive places
 */
function scheduleFullDayCircuit(places, dayNumber, dateStr, dayThemeTitle, preferences = {}, kumbhAdvisory = null) {
  const items = [];
  // Start time: 6:00 AM (early morning preference) or 8:30 AM
  let currentMinute = preferences.earlyMorningPreference ? 360 : 510;

  const orderedPlaces = sequencePlacesGeographically(places);
  let lunchAdded = false;

  for (let i = 0; i < orderedPlaces.length; i++) {
    const place = orderedPlaces[i];

    // Check if we need to insert a midday lunch break before scheduling this place
    if (!lunchAdded && currentMinute >= 750 && currentMinute <= 870) { // between 12:30 PM and 2:30 PM
      const lunchStartStr = formatMinutesTo12h(currentMinute);
      currentMinute += 75; // 75 mins lunch break
      const lunchEndStr = formatMinutesTo12h(currentMinute);

      items.push({
        placeId: null,
        title: "Traditional Lunch & Pilgrimage Rest Break",
        category: "Food",
        location: place.zoneName || "Nashik",
        startTime: lunchStartStr,
        endTime: lunchEndStr,
        durationMinutes: 75,
        travelMinutes: 15,
        notes: "Enjoy authentic Maharashtrian vegetarian Thali / Misal. Temples undergo afternoon sanctum closure during these hours.",
        isCompleted: false
      });
      lunchAdded = true;
    }

    // Check temple afternoon closure conflict
    if (place.afternoonClosed && currentMinute >= place.afternoonCloseStart && currentMinute < place.afternoonCloseEnd) {
      // If we hit a temple during its afternoon closure, postpone until afternoon reopening
      // Insert lunch if not already done, or add an open shopping/museum activity
      if (!lunchAdded) {
        const lunchStartStr = formatMinutesTo12h(currentMinute);
        const waitMinutes = Math.max(60, place.afternoonCloseEnd - currentMinute);
        currentMinute += waitMinutes;
        const lunchEndStr = formatMinutesTo12h(currentMinute);

        items.push({
          placeId: null,
          title: "Afternoon Rest & Local Refreshments",
          category: "Food",
          location: place.location,
          startTime: lunchStartStr,
          endTime: lunchEndStr,
          durationMinutes: waitMinutes,
          travelMinutes: 10,
          notes: `Temple sanctum is closed between ${formatMinutesTo12h(place.afternoonCloseStart)} and ${formatMinutesTo12h(place.afternoonCloseEnd)}. Relax and enjoy refreshments before reopening.`,
          isCompleted: false
        });
        lunchAdded = true;
      } else {
        // Shift time to temple reopening
        currentMinute = Math.max(currentMinute, place.afternoonCloseEnd);
      }
    }

    // Travel calculation from previous item
    let travelInfo = { travelMinutes: 15, distanceKm: 1, mode: "Drive" };
    if (i > 0) {
      travelInfo = estimateRealisticTravel(orderedPlaces[i - 1], place);
    } else {
      travelInfo.travelMinutes = preferences.earlyMorningPreference ? 15 : 20;
    }

    const startTimeStr = formatMinutesTo12h(currentMinute);
    const duration = place.durationMinutes || 60;
    currentMinute += duration;
    const endTimeStr = formatMinutesTo12h(currentMinute);

    // Build rich, geography-informed notes
    let notesText = place.description || "";
    if (place.darshanNotes) {
      notesText += ` 💡 Darshan note: ${place.darshanNotes}`;
    }
    if (travelInfo.mode === "Walk") {
      notesText += ` 🚶 ${travelInfo.instructions}`;
    }
    if (place.accessibility && place.accessibility.funicularAvailable) {
      notesText += ` 🚡 Funicular ropeway trolley available for senior citizens & families.`;
    }

    items.push({
      placeId: null,
      title: place.title,
      category: place.category,
      location: place.location,
      startTime: startTimeStr,
      endTime: endTimeStr,
      durationMinutes: duration,
      travelMinutes: travelInfo.travelMinutes,
      notes: notesText,
      isCompleted: false
    });

    // Add travel buffer for the next activity
    currentMinute += travelInfo.travelMinutes;
  }

  // Ensure a midday lunch & rest break is included in the full-day itinerary
  if (!lunchAdded && items.length > 0) {
    const lunchStartMinute = Math.max(currentMinute, 750); // At least 12:30 PM (750) or after morning stops
    const lunchStartStr = formatMinutesTo12h(lunchStartMinute);
    currentMinute = lunchStartMinute + 75;
    const lunchEndStr = formatMinutesTo12h(currentMinute);

    items.push({
      placeId: null,
      title: "Traditional Lunch & Pilgrimage Rest Break",
      category: "Food",
      location: places[0]?.zoneName || places[0]?.location || "Nashik",
      startTime: lunchStartStr,
      endTime: lunchEndStr,
      durationMinutes: 75,
      travelMinutes: 15,
      notes: "Enjoy authentic Maharashtrian vegetarian Thali / Misal. Temples undergo afternoon sanctum closure during these midday hours.",
      isCompleted: false
    });
    lunchAdded = true;
  }

  // If in Zone 1 (Panchavati) and evening time permits, append Ganga Godavari Evening Aarti if not present
  const isPanchavati = places.some(p => p.zone === "ZONE_1_PANCHAVATI");
  const alreadyHasAarti = items.some(it => it.title.toLowerCase().includes("aarti"));
  if (isPanchavati && !alreadyHasAarti && currentMinute <= 1110) { // before 6:30 PM
    if (currentMinute < 1110) {
      currentMinute = 1110; // set to 6:30 PM
    }
    items.push({
      placeId: null,
      title: "Ganga Godavari Evening Maha Aarti",
      category: "Spiritual",
      location: "Ram Kund Ghats, Panchavati",
      startTime: "06:30 PM",
      endTime: "07:15 PM",
      durationMinutes: 45,
      travelMinutes: 20,
      notes: "Experience the magnificent evening river aarti with thousands of brass oil lamps and Vedic chants on the Godavari banks.",
      isCompleted: false
    });
  }

  let finalTitle = `Day ${dayNumber}: ${dayThemeTitle}`;
  if (kumbhAdvisory) {
    finalTitle += ` 🚩 [${kumbhAdvisory.eventName}]`;
  }

  return {
    dayNumber,
    date: dateStr,
    title: finalTitle,
    items
  };
}

// ─── 6. MAIN INTELLIGENT PILGRIMAGE PLANNER GENERATOR ───

/**
 * Generates an intelligent, geographically-clustered pilgrimage itinerary
 * based on user parameters, duration, mobility preferences, and Kumbh Mela dates.
 */
function generateIntelligentItinerary({
  destination = "Nashik + Trimbakeshwar",
  startDate,
  endDate,
  interests = ["Spiritual", "Kumbh experiences"],
  travelStyle = "Balanced",
  preferences = {},
  travellers = {}
}) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const totalDays = Math.min(10, Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1));

  // Determine items per day by travel style
  let maxStopsPerDay = 4;
  if (travelStyle === "Relaxed") maxStopsPerDay = 3;
  if (travelStyle === "Packed") maxStopsPerDay = 5;

  // Filter pool based on senior / low-walking / accessibility preferences
  const isLowWalking = preferences.lowWalking || preferences.accessibilityNeeded || (travellers.seniorCitizens > 0);
  let availableDestinations = PILGRIMAGE_DESTINATIONS.filter(p => {
    if (isLowWalking && p.accessibility && p.accessibility.lowWalkingIncompatible) {
      return false;
    }
    // Filter non-spiritual places unless user explicitly chose wine/food interests
    if (p.isOptionalNonSpiritual) {
      const wantsWineOrFood = interests.includes("Vineyards") || interests.includes("Food");
      if (!wantsWineOrFood) return false;
    }
    return true;
  });

  // Geographical circuit plan by day count & destination selection
  const isTrimbakOnly = destination.toLowerCase().includes("trimbakeshwar only");
  const isPanchavatiOnly = destination.toLowerCase().includes("city only") || destination.toLowerCase().includes("panchavati only");

  // Define Zone order for each day
  let dayZonePlan = [];

  if (isTrimbakOnly) {
    // Dedicated Trimbak exploration
    dayZonePlan = [
      { zone: "ZONE_2_TRIMBAKESHWAR", theme: "Trimbakeshwar Jyotirlinga & Sacred Springs" },
      { zone: "ZONE_2_TRIMBAKESHWAR", theme: "Brahmagiri Foothills & Ancient Anjaneri" },
      { zone: "ZONE_3_GANGAPUR", theme: "Someshwar & Upper Godavari Waters" }
    ];
  } else if (isPanchavatiOnly) {
    // Dedicated Panchavati & City exploration
    dayZonePlan = [
      { zone: "ZONE_1_PANCHAVATI", theme: "Sacred Panchavati & Ramayana Ghats Circuit" },
      { zone: "ZONE_3_GANGAPUR", theme: "Someshwar Mahadev & Anandvalli Ganpati" },
      { zone: "ZONE_5_NASHIK_ROAD", theme: "Muktidham Marble Temples & Heritage Walk" }
    ];
  } else {
    // Comprehensive Nashik + Trimbakeshwar pilgrimage
    if (totalDays === 1) {
      dayZonePlan = [
        { zone: "EXPRESS_COMBINED", theme: "Panchavati Ghats & Trimbakeshwar Express Pilgrimage" }
      ];
    } else if (totalDays === 2) {
      dayZonePlan = [
        { zone: "ZONE_1_PANCHAVATI", theme: "Sacred Panchavati & Godavari Riverfront Circuit" },
        { zone: "ZONE_2_TRIMBAKESHWAR", theme: "Trimbakeshwar Jyotirlinga & Sacred Kushavarta" }
      ];
    } else if (totalDays === 3) {
      dayZonePlan = [
        { zone: "ZONE_1_PANCHAVATI", theme: "Sacred Panchavati & Godavari Riverfront Circuit" },
        { zone: "ZONE_2_TRIMBAKESHWAR", theme: "Trimbakeshwar Jyotirlinga & Sacred Foothills" },
        { zone: "ZONE_3_GANGAPUR", theme: "Someshwar Temple, Waterfalls & Gangapur Dam" }
      ];
    } else if (totalDays === 4) {
      dayZonePlan = [
        { zone: "ZONE_1_PANCHAVATI", theme: "Sacred Panchavati & Godavari Riverfront Circuit" },
        { zone: "ZONE_2_TRIMBAKESHWAR", theme: "Trimbakeshwar Jyotirlinga & Ancient Foothills" },
        { zone: "ZONE_3_GANGAPUR", theme: "Someshwar Mahadev, Cascade & Backwaters" },
        { zone: "ZONE_4_5_SOUTH", theme: "Pathardi Ancient Heritage & Muktidham Temples" }
      ];
    } else if (totalDays === 5) {
      dayZonePlan = [
        { zone: "ZONE_1_PANCHAVATI", theme: "Sacred Panchavati & Godavari Riverfront Circuit" },
        { zone: "ZONE_2_TRIMBAKESHWAR", theme: "Trimbakeshwar Jyotirlinga & Ancient Foothills" },
        { zone: "ZONE_3_GANGAPUR", theme: "Someshwar Mahadev, Cascade & Backwaters" },
        { zone: "ZONE_4_5_SOUTH", theme: "Pathardi Ancient Heritage & Muktidham Temples" },
        { zone: "ZONE_6_VANI_SAPTASHRUNGI", theme: "Vani Saptashrungi Hilltop Shaktipeeth Excursion" }
      ];
    } else {
      // 6 to 10 days
      dayZonePlan = [
        { zone: "ZONE_1_PANCHAVATI", theme: "Sacred Panchavati & Godavari Riverfront Circuit" },
        { zone: "ZONE_2_TRIMBAKESHWAR", theme: "Trimbakeshwar Jyotirlinga & Ancient Foothills" },
        { zone: "ZONE_3_GANGAPUR", theme: "Someshwar Mahadev, Cascade & Backwaters" },
        { zone: "ZONE_4_5_SOUTH", theme: "Pathardi Ancient Heritage & Muktidham Temples" },
        { zone: "ZONE_6_VANI_SAPTASHRUNGI", theme: "Vani Saptashrungi Hilltop Shaktipeeth Excursion" },
        { zone: "ZONE_7_SINNAR", theme: "Sinnar 11th-Century Gondeshwar Hemadpanthi Temple" },
        { zone: "ZONE_8_NIPHAD", theme: "Nandur Madhmeshwar Bird Sanctuary & Wetland" },
        { zone: "ZONE_1_PANCHAVATI_DEEP", theme: "Old City Spiritual Heritage & Sacred Groves" },
        { zone: "ZONE_2_TRIMBAK_NATURE", theme: "Brahmagiri Natural Treks & Forest Cascades" },
        { zone: "ZONE_3_AGRI_TOURISM", theme: "Upper Godavari Agro-Tourism & Cultural Departure" }
      ];
    }
  }

  const generatedDays = [];
  const usedPlaceIds = new Set();

  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + (dayNum - 1));
    const dateStr = currentDate.toISOString().split('T')[0];

    // Check Kumbh Mela Shahi Snan advisory for this date
    const kumbhAdvisory = KUMBH_SHAHI_SNAN_DATES[dateStr] || null;

    const planConfig = dayZonePlan[(dayNum - 1) % dayZonePlan.length];
    const targetZone = planConfig.zone;

    let dayCandidatePlaces = [];

    if (targetZone === "EXPRESS_COMBINED") {
      // 1-Day Express: Pick top places from Panchavati (Ram Kund, Kalaram) + Trimbakeshwar
      const p1 = availableDestinations.find(p => p.id === "ram_kund");
      const p2 = availableDestinations.find(p => p.id === "kalaram_temple");
      const p3 = availableDestinations.find(p => p.id === "trimbakeshwar_temple");
      const p4 = availableDestinations.find(p => p.id === "kushavarta_kund");
      dayCandidatePlaces = [p1, p2, p3, p4].filter(Boolean);
    } else if (targetZone === "ZONE_4_5_SOUTH") {
      // Combine Southern zones: Pathardi & Muktidham
      dayCandidatePlaces = availableDestinations.filter(p =>
        (p.zone === "ZONE_4_PATHARDI" || p.zone === "ZONE_5_NASHIK_ROAD") && !usedPlaceIds.has(p.id)
      );
    } else {
      let baseZone = targetZone;
      if (targetZone === "ZONE_1_PANCHAVATI_DEEP") baseZone = "ZONE_1_PANCHAVATI";
      if (targetZone === "ZONE_2_TRIMBAK_NATURE") baseZone = "ZONE_2_TRIMBAKESHWAR";
      if (targetZone === "ZONE_3_AGRI_TOURISM") baseZone = "ZONE_3_GANGAPUR";

      // Single pure geographical zone
      dayCandidatePlaces = availableDestinations.filter(p =>
        p.zone === baseZone && !usedPlaceIds.has(p.id)
      );

      const isDistantExcursion = baseZone === "ZONE_6_VANI_SAPTASHRUNGI" || baseZone === "ZONE_7_SINNAR" || baseZone === "ZONE_8_NIPHAD";

      // If zone candidates are fewer than needed, allow unused complementary places from nearest adjacent zone (only for city zones, never for distant excursions)
      if (!isDistantExcursion && dayCandidatePlaces.length < 2) {
        const urbanZones = ["ZONE_1_PANCHAVATI", "ZONE_3_GANGAPUR", "ZONE_4_PATHARDI", "ZONE_5_NASHIK_ROAD"];
        const fallbackPlaces = availableDestinations.filter(p => !usedPlaceIds.has(p.id) && urbanZones.includes(p.zone));
        dayCandidatePlaces = [...dayCandidatePlaces, ...fallbackPlaces.slice(0, maxStopsPerDay - dayCandidatePlaces.length)];
      }
    }

    // If candidates in target zone and urban fallbacks are exhausted (e.g. Day 10 on a spiritual-only tour),
    // provide auspicious departure darshan & holy river blessing at Ram Kund / Tapovan
    if (dayCandidatePlaces.length === 0) {
      const farewellAnchors = availableDestinations.filter(p =>
        p.id === "ram_kund" || p.id === "kalaram_temple" || p.id === "saraf_bazaar" || p.id === "tapovan"
      );
      dayCandidatePlaces = farewellAnchors.slice(0, 2);
    }

    // Limit to max stops per day according to travel style
    const selectedStops = dayCandidatePlaces.slice(0, maxStopsPerDay);
    selectedStops.forEach(p => usedPlaceIds.add(p.id));

    // Schedule full day circuit with opening hours validation and lunch
    const dayItinerary = scheduleFullDayCircuit(
      selectedStops,
      dayNum,
      dateStr,
      planConfig.theme,
      preferences,
      kumbhAdvisory
    );

    generatedDays.push(dayItinerary);
  }

  return generatedDays;
}

module.exports = {
  PILGRIMAGE_DESTINATIONS,
  GEOGRAPHICAL_ZONES,
  KUMBH_SHAHI_SNAN_DATES,
  calculateHaversineDistanceKm,
  estimateRealisticTravel,
  formatMinutesTo12h,
  sequencePlacesGeographically,
  scheduleFullDayCircuit,
  generateIntelligentItinerary
};

