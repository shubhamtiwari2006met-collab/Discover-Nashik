"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  List,
  Bookmark,
  Landmark,
  Feather,
  Info
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Chapter {
  id: string;
  num: string;
  title: string;
  subtitle: string;
  pageIndex: number;
}

const CHAPTERS: Chapter[] = [
  { id: "chap-1", num: "01", title: "What Is Kumbh Mela?", subtitle: "The world's sacred gathering", pageIndex: 2 },
  { id: "chap-2", num: "02", title: "Why Nashik?", subtitle: "A Kumbh city shaped by river & story", pageIndex: 4 },
  { id: "chap-3", num: "03", title: "Simhastha Kumbh 2027", subtitle: "Nashik & Trimbakeshwar", pageIndex: 6 },
  { id: "chap-4", num: "04", title: "Spiritual Geography", subtitle: "The pilgrimage landscape", pageIndex: 8 },
  { id: "chap-5", num: "05", title: "Trimbakeshwar", subtitle: "Land of Jyotirlinga & Godavari", pageIndex: 10 },
  { id: "chap-6", num: "06", title: "Panchavati & Ramayana", subtitle: "Where mythology meets the city", pageIndex: 12 },
  { id: "chap-7", num: "07", title: "The Godavari", subtitle: "River of faith", pageIndex: 14 },
  { id: "chap-8", num: "08", title: "Understanding the Kumbh Experience", subtitle: "Pilgrimage, bathing & community", pageIndex: 16 },
  { id: "chap-9", num: "09", title: "Akhadas & Saints", subtitle: "Spiritual communities of Kumbh", pageIndex: 18 },
  { id: "chap-10", num: "10", title: "Kumbh Traditions", subtitle: "Living traditions of faith & culture", pageIndex: 20 },
  { id: "chap-11", num: "11", title: "Explore Nashik Beyond Kumbh", subtitle: "Heritage, nature & culture", pageIndex: 22 },
  { id: "chap-12", num: "12", title: "Kumbh Visitor Guide", subtitle: "Plan • Prepare • Participate", pageIndex: 24 },
  { id: "chap-13", num: "13", title: "Discover Nashik", subtitle: "Your digital companion to Nashik", pageIndex: 26 },
  { id: "chap-14", num: "14", title: "Heritage for the Next Generation", subtitle: "Why digital heritage matters", pageIndex: 28 },
  { id: "chap-15", num: "15", title: "A Shared Responsibility", subtitle: "Respect • Responsibility • Heritage", pageIndex: 30 },
  { id: "chap-16", num: "16", title: "The Future of Discover Nashik", subtitle: "From Kumbh guide to digital heritage archive", pageIndex: 32 },
];

// Content for each chapter: left page (main text) and right page (extended content + references)
const CHAPTER_CONTENT: Record<string, { quote: string; quoteAttr: string; leftText: string; rightTitle: string; rightText: string; tags: string[] }> = {
  "01": {
    quote: "\u201CKumbh Mela is not merely a festival — it is a living expression of faith, tradition, and the collective spiritual memory of a civilisation.\u201D",
    quoteAttr: "— The Sacred Journey of Nashik",
    leftText: "Kumbh Mela is among the most significant pilgrimage traditions in the world. Rooted in centuries of spiritual practice, it brings together millions of pilgrims, sadhus, saints, and seekers at sacred river banks for acts of devotion, sacred bathing, and community.\n\nThe tradition is observed at four locations across India — Prayagraj (at the confluence of the Ganga, Yamuna, and the mythic Saraswati), Haridwar (on the Ganga), Ujjain (on the Shipra), and Nashik–Trimbakeshwar (on the Godavari). The cycle rotates among these cities based on astrological alignments of Jupiter, the Sun, and the Moon.\n\nNashik's Kumbh, known as Simhastha, is observed when Jupiter enters the sign of Leo (Simha). It is centred around both Nashik and Trimbakeshwar, making it unique — a Kumbh celebrated across two sacred towns connected by the Godavari.\n\nKumbh is far more than sacred bathing alone. It is a living cultural landscape involving rivers, ghats, temples, saints, akhadas, spiritual discourses, community service (seva), processions, and the transmission of knowledge across generations.",
    rightTitle: "The Four Sacred Kumbh Sites",
    rightText: "Each Kumbh site carries its own spiritual and geographic identity:\n\n• Prayagraj — The Sangam, the meeting of three rivers, considered the most sacred confluence.\n• Haridwar — Where the Ganga enters the plains, a gateway to the Himalayas.\n• Ujjain — On the banks of the Shipra, associated with the Mahakaleshwar Jyotirlinga.\n• Nashik–Trimbakeshwar — On the banks of the Godavari, the only Kumbh celebrated across two towns, one a Jyotirlinga site and the other a Ramayana-linked city.\n\nThe astronomical cycle determines which city hosts Kumbh in a given year. The tradition connects faith with the cosmos, geography with mythology, and individual devotion with collective celebration.",
    tags: ["Kumbh Mela", "Pilgrimage", "Simhastha", "Godavari"],
  },
  "02": {
    quote: "\u201CNashik is where the river begins, where the epic was lived, and where the sacred and the everyday have always flowed together.\u201D",
    quoteAttr: "— Sacred Geography of Nashik",
    leftText: "Nashik's connection to the Kumbh tradition is shaped by three powerful forces: the Godavari river, the Ramayana epic, and the Trimbakeshwar Jyotirlinga.\n\nThe Godavari — often called Dakshin Ganga (Ganga of the South) — originates near Trimbakeshwar in the Brahmagiri hills and flows through Nashik before continuing its 1,465-kilometre journey to the Bay of Bengal. Its origin near one of the twelve Jyotirlingas makes the Nashik–Trimbakeshwar region uniquely sacred.\n\nAccording to the Ramayana tradition, Nashik's Panchavati is where Lord Rama, Sita, and Lakshmana spent part of their fourteen-year exile. The landscape around Panchavati — its ghats, temples, and sacred tanks — is deeply woven into this epic narrative.\n\nTrimbakeshwar, about 30 kilometres from Nashik, houses one of the twelve Jyotirlingas of Lord Shiva. It is the site where the Godavari emerges and where key Kumbh rituals take place.\n\nTogether, these elements — river, epic, and temple — form the spiritual foundation that makes Nashik a Kumbh city.",
    rightTitle: "River, Epic & Temple",
    rightText: "Nashik's identity as a pilgrimage landscape is built upon three intersecting traditions:\n\n• The Godavari River — A sacred lifeline that connects Trimbakeshwar to Nashik, its ghats serving as sites for daily worship, Kumbh bathing, and community life.\n\n• Panchavati & The Ramayana — Traditional associations link this area to Lord Rama's exile, embedding mythology into the city's geography. Temples and sites across Panchavati mark these associations.\n\n• Trimbakeshwar Temple — One of the twelve Jyotirlingas, it anchors the region's Shaiva spiritual tradition and serves as a primary Kumbh ritual site.\n\nThis convergence of river, mythology, and temple makes Nashik–Trimbakeshwar one of only four Kumbh sites in the entire tradition.",
    tags: ["Nashik", "Godavari", "Panchavati", "Trimbakeshwar"],
  },
  "03": {
    quote: "\u201CSimhastha Kumbh is an occasion for pilgrimage, devotion, and collective renewal — a moment when a city becomes a sacred landscape for millions.\u201D",
    quoteAttr: "— Kumbh Planning Framework",
    leftText: "Simhastha Kumbh 2027 will be observed in Nashik and Trimbakeshwar when Jupiter transits into Leo (Simha rashi), marking the astrologically determined cycle for this region's Kumbh.\n\nThe Simhastha Kumbh is distinct in that it is celebrated across two towns — Nashik and Trimbakeshwar — connected by the Godavari river. Key rituals, sacred bathing, processions, and spiritual gatherings take place at ghats and temples in both locations.\n\nFor the 2027 cycle, significant infrastructure planning is underway covering sanitation, safety, transport connectivity, digital enablement, healthcare, and pilgrim facilities. Both state and local authorities coordinate with religious organisations and service groups to manage the massive influx of visitors.\n\nNote: Specific dates, schedules, and official arrangements for Kumbh 2027 are announced by the authorities closer to the event. Visitors are strongly advised to check official sources and the latest government notifications before making travel plans. Do not rely on unofficial or unconfirmed schedules.",
    rightTitle: "Preparing for Kumbh 2027",
    rightText: "Key areas of preparation for Simhastha Kumbh 2027 include:\n\n• Infrastructure — Road improvements, temporary bridges, ghats restoration, and crowd management infrastructure connecting Nashik and Trimbakeshwar.\n\n• Sanitation & Health — Extensive sanitation facilities, mobile health units, first-aid posts, and water quality monitoring along the Godavari.\n\n• Transport — Enhanced rail, road, and bus connectivity. Shuttle services between Nashik and Trimbakeshwar. Parking and traffic management.\n\n• Digital Enablement — Digital maps, mobile information services, multilingual guides, and real-time crowd updates for pilgrims.\n\n• Pilgrim Facilities — Accommodation camps, food distribution (langar/bhandara), lost-and-found systems, and information centres.\n\n⚠ Always verify travel details, schedules, and official arrangements through government and official Kumbh sources before visiting.",
    tags: ["Simhastha 2027", "Infrastructure", "Pilgrimage", "Planning"],
  },
  "04": {
    quote: "\u201CA pilgrimage landscape is a network of places — not a single destination.\u201D",
    quoteAttr: "— The Sacred Journey of Nashik",
    leftText: "The spiritual geography of Nashik and Trimbakeshwar forms a connected pilgrimage landscape rather than a collection of isolated sites. Each place draws meaning from its relationship with others — the river connects the temple to the ghats, the hills cradle the river's source, and the city holds the memory of the epic.\n\nTrimbakeshwar — The site of the Jyotirlinga and the origin of the Godavari. A place of Shaiva devotion and Kumbh rituals.\n\nBrahmagiri Hills — The mountain from which the Godavari emerges. A place of natural beauty and spiritual significance, linking earth, water, and sky.\n\nKushavarta Tirtha — A sacred tank near Trimbakeshwar, traditionally regarded as a concentrated source of the Godavari's sacred waters. An important Kumbh bathing site.\n\nGodavari River — The living thread connecting Trimbakeshwar and Nashik, carrying spiritual significance along its entire course.\n\nRamkund — A sacred bathing ghat in Nashik on the Godavari, associated with the Ramayana tradition and central to Kumbh activities in the city.\n\nPanchavati — The area in Nashik linked to Lord Rama's exile, containing temples, sacred groves, and ghats.",
    rightTitle: "The Connected Landscape",
    rightText: "Understanding the Kumbh pilgrimage means seeing how these places form a single sacred geography:\n\n• Brahmagiri → source of the Godavari\n• Godavari → flows through Kushavarta, past Trimbakeshwar, into Nashik\n• Trimbakeshwar Temple → Jyotirlinga, Kumbh rituals\n• Kushavarta → sacred tank, Kumbh bathing\n• Ramkund → Godavari ghat in Nashik, Ramayana association\n• Panchavati → mythological landscape, temples, community life\n\nA pilgrim who visits only one site experiences only a fragment. The full Kumbh experience unfolds as one moves through this landscape — from the mountain to the river, from the temple to the ghat, from the ancient to the living.\n\nThis is what makes Nashik–Trimbakeshwar unique among Kumbh sites: the pilgrimage is distributed across a landscape, not confined to a single bank.",
    tags: ["Trimbakeshwar", "Brahmagiri", "Kushavarta", "Ramkund", "Panchavati"],
  },
  "05": {
    quote: "\u201CTrimbakeshwar is where the mountain meets the river, and where the Jyotirlinga anchors a landscape of devotion.\u201D",
    quoteAttr: "— Heritage of the Godavari",
    leftText: "Trimbakeshwar, located about 30 kilometres from Nashik, is one of the most important pilgrimage sites in the region. It is home to the Trimbakeshwar Temple, which houses one of the twelve Jyotirlingas — the most sacred representations of Lord Shiva.\n\nThe temple architecture reflects the Hemadpanthi style of construction, characterised by its black basalt stone structure, intricate carvings, and a distinctive three-faced lingam (representing Brahma, Vishnu, and Shiva). The temple complex includes sacred tanks and mandapas used for worship and rituals.\n\nBehind the temple rises Brahmagiri, the mountain from which the Godavari originates. The trek to the Godavari source is itself a pilgrimage, offering both physical exertion and spiritual significance.\n\nKushavarta Tirtha, a sacred water tank near the temple, is traditionally believed to be a concentrated source of the Godavari's holy waters. It is one of the primary bathing sites during Kumbh Mela.\n\nTrimbakeshwar's identity is shaped by the convergence of the Jyotirlinga tradition, the origin of a sacred river, and the rituals of Kumbh — making it far more than a single temple visit.",
    rightTitle: "Temple, Mountain & Sacred Water",
    rightText: "Key elements of the Trimbakeshwar pilgrimage:\n\n• Trimbakeshwar Temple — Hemadpanthi stone architecture, three-faced lingam, one of twelve Jyotirlingas. Daily worship and special rituals (Rudra Abhishek, Tripindi Vidhi).\n\n• Brahmagiri Hills — The origin point of the Godavari river. The trek to the summit passes through forests and offers panoramic views. Traditionally, sages performed penance here.\n\n• Kushavarta Tirtha — A sacred kund (tank) fed by springs, considered an especially holy bathing site. During Kumbh, this is one of the most important ritual locations.\n\n• Godavari Origin — The river begins its 1,465-km journey from the Brahmagiri hills near Trimbakeshwar, making this the starting point of a sacred waterway that connects multiple pilgrimage sites across southern India.\n\n• Kumbh Connection — Trimbakeshwar serves as one of the two primary Kumbh centres (alongside Nashik city), with major processions and sacred bathing events taking place here.",
    tags: ["Trimbakeshwar Temple", "Jyotirlinga", "Brahmagiri", "Kushavarta"],
  },
  "06": {
    quote: "\u201CIn Panchavati, the epic is not merely remembered — it is embedded in the landscape, the temples, and the daily life of the community.\u201D",
    quoteAttr: "— Ramayana Heritage of Nashik",
    leftText: "Panchavati, located along the Godavari in Nashik, is traditionally associated with the period of Lord Rama, Sita, and Lakshmana's exile as described in the Ramayana. The name Panchavati refers to a grove of five banyan trees where, according to tradition, Rama established his hermitage.\n\nSita Gufa (Sita's Cave) — A cave near the Godavari traditionally believed to be the place where Sita took shelter. It is a site of worship and a place of quiet reverence.\n\nKalaram Temple — One of Nashik's most prominent temples, dedicated to Lord Rama. The temple is known for its black stone idol of Rama and its historical significance in India's social reform movements.\n\nRamkund — A sacred bathing ghat on the Godavari in Panchavati. It is associated with the tradition that Lord Rama bathed here during his exile. Ramkund is also an important site for performing last rites and ancestral rituals.\n\nGodavari Ghats — The ghats along the river in Panchavati are used daily for prayer, aarti, and community gatherings. During Kumbh, they become the primary bathing and ritual sites in Nashik.\n\nIt is important to note that these associations are rooted in living religious tradition. They represent how communities understand and relate to their sacred geography, rather than claims verified by archaeological evidence.",
    rightTitle: "The Ramayana Landscape of Nashik",
    rightText: "Panchavati's sacred sites form a compact pilgrimage circuit within Nashik:\n\n• Panchavati Grove — Traditional site of Rama's exile hermitage, associated with the five banyan trees of the Ramayana narrative.\n\n• Sita Gufa — A small cave temple, tradition holds this as Sita's shelter. A place of devotion and reflection.\n\n• Kalaram Temple — 18th-century temple with a distinctive black stone Rama idol. Site of Babasaheb Ambedkar's historic 1930 Satyagraha for temple entry.\n\n• Ramkund — Sacred ghat for ritual bathing, ancestral rites, and Kumbh celebrations. One of the most visited spots in Nashik.\n\n• Godavari Ghats — A network of stepped river banks used for daily aarti, festivals, and during Kumbh for mass sacred bathing.\n\n• Tapovan — The nearby area traditionally associated with forest hermitages of sages during the Ramayana period.\n\nThese sites are part of a living religious tradition. Their significance lies in the faith, worship, and community life they sustain — not solely in historical verification.",
    tags: ["Panchavati", "Sita Gufa", "Kalaram Temple", "Ramkund"],
  },
  "07": {
    quote: "\u201CThe Godavari is not just a river — it is a flowing expression of faith, community, and the continuity of a cultural tradition.\u201D",
    quoteAttr: "— Rivers of Sacred India",
    leftText: "The Godavari is the longest river in peninsular India, stretching over 1,465 kilometres from its source near Trimbakeshwar to the Bay of Bengal. For the communities of Nashik and Trimbakeshwar, it is far more than a geographic feature — it is a sacred lifeline.\n\nSpiritual Importance — The Godavari is revered as Dakshin Ganga, the Ganga of the South. Bathing in its waters is considered an act of spiritual purification, and the river forms the central axis of the Kumbh Mela in this region.\n\nGhats and Cultural Life — Along its banks in Nashik, a series of ghats serve as gathering points for daily prayer, aarti, festivals, and community life. The ghats are where spirituality meets everyday social activity — washing, conversation, worship, and contemplation all share the same steps.\n\nSacred Bathing — During Kumbh Mela, sacred bathing (snan) in the Godavari is the primary ritual act. Pilgrims believe that bathing during the auspicious Kumbh alignments purifies the soul and liberates from the cycle of rebirth.\n\nRiver Conservation — The health of the Godavari is a growing concern. Visitors and communities share a responsibility to protect its waters. Avoid throwing offerings, plastics, or waste into the river. Participate in clean-river initiatives where possible. The river sustains the pilgrimage — and the pilgrimage must sustain the river.",
    rightTitle: "Life Along the Godavari",
    rightText: "The Godavari shapes daily life and sacred practice in Nashik:\n\n• Morning Aarti — At dawn, priests and devotees perform aarti (light offering) at the ghats, accompanied by chanting and the sound of bells.\n\n• Sacred Bathing — Pilgrims and residents bathe in the river year-round, with peak devotion during Kumbh and on auspicious days.\n\n• Ancestral Rites — Ramkund and surrounding ghats are traditional sites for performing shraddha and tarpan — rituals for deceased ancestors.\n\n• Festivals — The ghats come alive during festivals like Ganga Dussehra, Kartik Purnima, and of course Kumbh Mela.\n\n• Community Gathering — The ghats serve as public spaces where the city's social, cultural, and spiritual life converges.\n\nResponsible Behaviour:\n• Do not throw offerings, flowers, or plastics into the river.\n• Use designated bathing areas.\n• Support and respect clean-river initiatives.\n• Remember: protecting the Godavari is itself an act of devotion.",
    tags: ["Godavari", "Sacred Bathing", "Ghats", "Conservation"],
  },
  "08": {
    quote: "\u201CKumbh is experienced, not merely observed. It is understood through participation, patience, and openness.\u201D",
    quoteAttr: "— Pilgrim Traditions of India",
    leftText: "For first-time visitors, Kumbh Mela can be overwhelming — millions of people, vast temporary cities, unfamiliar rituals, and an intensity of devotion that is unlike any other gathering in the world. Understanding what to expect can transform the experience.\n\nPilgrimage — Kumbh is, at its core, a pilgrimage. People come with faith, seeking spiritual renewal. Even as a visitor, approaching the experience with respect and curiosity opens doors to deeper understanding.\n\nSacred Bathing — The act of bathing in the river during Kumbh is not simply a physical cleansing. It is a ritual act believed to wash away sins and connect the individual to a cosmic cycle of purification.\n\nSpiritual Learning — Kumbh is an open university of spiritual thought. Saints, scholars, and gurus set up camps and offer discourses on philosophy, yoga, meditation, and sacred texts. Many of these are open to all visitors.\n\nCommunity — One of Kumbh's most powerful experiences is the sense of community. Millions of strangers share food, space, prayer, and purpose. The tradition of bhandara (free community meals) and seva (selfless service) is central to the Kumbh ethos.\n\nWhat to Expect — Crowds will be large. Movement will be slow. Facilities may be basic. But for those who approach with patience and an open heart, Kumbh offers something no other event can — a glimpse into a living tradition that has continued for centuries.",
    rightTitle: "First-Time Visitor Guide",
    rightText: "What first-time visitors may experience at Kumbh:\n\n• Scale — The sheer number of people is extraordinary. Allow extra time for everything.\n\n• Atmosphere — A unique mix of devotion, spectacle, commerce, and community. Expect chanting, incense, bells, processions, and crowds.\n\n• Sacred Bathing — You may witness (or participate in) mass river bathing, especially on auspicious dates. Follow local customs and safety guidelines.\n\n• Spiritual Discourses — Many ashrams and camps hold daily talks. These are often open to all, regardless of background.\n\n• Community Meals — Bhandara (free meals served by religious organisations and community groups) is a hallmark of Kumbh. Accepting food is an act of participation.\n\n• Simplicity — Kumbh is not a luxury experience. It is a pilgrimage. Basic facilities, shared spaces, and simple food are part of the ethos.\n\n• Respect — Dress modestly. Ask before photographing people, especially sadhus. Follow instructions from organisers and authorities. Remember you are in a sacred space.",
    tags: ["Pilgrimage", "Sacred Bathing", "Community", "Spiritual Learning"],
  },
  "09": {
    quote: "\u201CThe Akhadas are not just organisations — they are living lineages of spiritual knowledge, discipline, and service.\u201D",
    quoteAttr: "— Traditions of the Naga Sadhus",
    leftText: "Akhadas are organised orders of sadhus (ascetics and spiritual practitioners) that form the institutional backbone of Kumbh Mela. They are monastic communities with centuries-old traditions of spiritual discipline, martial training, philosophical study, and service.\n\nWhat Is an Akhada? — An Akhada is a formal order of sadhus, led by spiritual heads (Mahamandaleshwars and Acharyas). Each Akhada follows specific traditions — some are Shaiva (devoted to Shiva), some are Vaishnava (devoted to Vishnu), and some follow other traditions. There are traditionally thirteen recognised Akhadas.\n\nWho Are Sadhus? — Sadhus are individuals who have renounced worldly life to pursue spiritual practice. They may be monks, ascetics, scholars, yogis, or wandering holy men. Some, known as Naga Sadhus, are particularly associated with Kumbh — recognised by their ash-covered bodies and austere practices.\n\nTheir Role in Kumbh — Akhadas lead the ceremonial processions (Peshwai and Shahi Snan) that are among the most iconic events of Kumbh. The order in which Akhadas proceed to the river for sacred bathing is determined by tradition and protocol.\n\nCamps and Discourses — During Kumbh, Akhadas set up elaborate camps where they offer spiritual discourses, yoga sessions, and community service. Many camps welcome visitors.\n\nRespectful Behaviour — Always ask permission before photographing sadhus. Do not touch sacred objects without invitation. Approach camps with humility and genuine interest.",
    rightTitle: "The Akhada Tradition",
    rightText: "Understanding the Akhada system:\n\n• Thirteen Akhadas — Traditionally, thirteen Akhadas are recognised. Seven are Shaiva, three are Vaishnava, and three follow the Udasi and Nirmali traditions.\n\n• Peshwai Processions — Grand processions where Akhadas arrive at the Kumbh site with music, chanting, elephants, horses, and armed sadhus. A spectacle of devotion and tradition.\n\n• Shahi Snan — The 'Royal Bath' — the most sacred bathing event during Kumbh. Akhadas proceed to the river in a specific order for ritual bathing on the most auspicious day.\n\n• Spiritual Camps — During Kumbh, Akhada camps become temporary ashrams offering discourses on Vedanta, yoga, and spiritual philosophy. Many are open to all visitors.\n\n• Seva (Service) — Akhadas often run free medical camps, food distribution, and educational activities during Kumbh.\n\nVisitor Etiquette:\n• Dress modestly in Akhada camps.\n• Ask permission before taking photographs.\n• Listen respectfully during discourses.\n• Accept offerings (prasad) graciously.\n• Do not argue about spiritual practices you may not understand.",
    tags: ["Akhadas", "Sadhus", "Peshwai", "Shahi Snan"],
  },
  "10": {
    quote: "\u201CTradition remains alive when it is practiced, remembered, and passed on.\u201D",
    quoteAttr: "— The Sacred Journey of Nashik",
    leftText: "Kumbh Mela is sustained by a rich tapestry of traditions that have been practiced, adapted, and transmitted across generations. These are not museum exhibits — they are living expressions of faith and community.\n\nRituals — From the pre-dawn aarti at the ghats to the elaborate Shahi Snan processions, Kumbh rituals structure the entire experience. Each act — bathing, offering, chanting, circumambulation — carries layers of meaning accumulated over centuries.\n\nProcessions — The Peshwai (arrival procession of Akhadas) and the Shahi Snan (royal bath) processions are grand public events that combine devotion, pageantry, and community identity. They are among the most visually and spiritually powerful experiences of Kumbh.\n\nSpiritual Discourses — Throughout Kumbh, scholars, saints, and gurus offer pravachans (discourses) on sacred texts, philosophy, meditation, and spiritual practice. These gatherings are open forums for learning and reflection.\n\nSadhus and Ascetics — The visible presence of sadhus — from ash-covered Naga Sadhus to robed monks — is central to Kumbh's identity. They represent a spectrum of spiritual paths and ascetic traditions.\n\nCulture — Music, devotional singing (bhajans and kirtans), folk traditions, and community storytelling are woven throughout the Kumbh experience.\n\nSeva (Service) — Selfless service is a core Kumbh value. Free meals (bhandara), medical camps, volunteer coordination, and hospitality for strangers are practiced by religious organisations and ordinary citizens alike.",
    rightTitle: "Traditions That Sustain Kumbh",
    rightText: "Key living traditions of Kumbh Mela:\n\n• Sacred Bathing (Snan) — The central ritual act. Bathing in the river during auspicious alignments is believed to purify the soul.\n\n• Shahi Snan — The 'Royal Bath' procession, led by Akhadas, is the ceremonial highlight of Kumbh.\n\n• Peshwai — The grand arrival of Akhadas at the Kumbh site, marked by music, chanting, and processions.\n\n• Pravachan — Spiritual discourses held in Akhada camps and open spaces. Topics range from Vedantic philosophy to practical yoga.\n\n• Bhandara — Free community meals served to all, regardless of caste, creed, or status. A powerful expression of equality and seva.\n\n• Bhajan-Kirtan — Devotional music and singing that fills the air at ghats, camps, and temples throughout Kumbh.\n\n• Daan (Giving) — The practice of charitable giving — food, clothing, money — as a spiritual act during the auspicious Kumbh period.\n\n• Sankalp — Taking a spiritual vow or resolve at the river bank, committing to personal transformation.\n\nThese traditions endure because communities continue to practice, teach, and value them.",
    tags: ["Rituals", "Processions", "Seva", "Spiritual Discourses"],
  },
  "11": {
    quote: "\u201CNashik is not only a Kumbh city — it is a city of heritage, nature, and living culture that rewards exploration in every season.\u201D",
    quoteAttr: "— Discover Nashik Heritage Guide",
    leftText: "While Kumbh Mela draws the world's attention, Nashik offers a rich tapestry of experiences throughout the year. The city and its surroundings are a blend of ancient heritage, natural beauty, and vibrant culture.\n\nHERITAGE:\n• Trimbakeshwar — Jyotirlinga temple and Godavari origin, a pilgrimage site of national importance.\n• Panchavati — The Ramayana-associated landscape with temples, ghats, and sacred groves.\n• Ramkund — Sacred bathing ghat on the Godavari, central to the city's spiritual life.\n• Kalaram Temple — Historic black-stone Rama temple, site of Ambedkar's 1930 temple-entry movement.\n• Pandavleni Caves — Ancient Buddhist rock-cut caves dating from the 1st–3rd century BCE, showcasing early Buddhist architecture and inscriptions.\n• Historic Temples — Numerous temples across Nashik reflecting different periods of history and architectural styles.\n\nNATURE:\n• Brahmagiri Hills — Trek to the source of the Godavari, offering stunning views and ecological diversity.\n• Anjaneri — A hill fort traditionally associated with the birthplace of Lord Hanuman.\n• Waterfalls — Seasonal waterfalls in the Western Ghats near Nashik, especially during and after the monsoon.\n• Hills and Scenic Landscapes — The Sahyadri range provides a dramatic backdrop to the region.",
    rightTitle: "Culture & Community",
    rightText: "Beyond heritage and nature, Nashik offers rich cultural experiences:\n\nCULTURE & COMMUNITY:\n• Local Food — Nashik is known for its distinctive cuisine including misal pav, sabudana vada, thalipeeth, and regional specialties. Street food around Panchavati and the old city is a must-try experience.\n\n• Festivals — Beyond Kumbh, Nashik celebrates numerous festivals including Ganesh Chaturthi, Navratri, Diwali, Ram Navami, and local village festivals with great enthusiasm.\n\n• Local Traditions — Community traditions of worship, music, folk performance, and seasonal celebrations continue to thrive.\n\n• Arts & Crafts — Traditional crafts, Paithani saree weaving, and devotional art forms are part of the region's cultural identity.\n\n• Markets — The old city markets, Saraf Bazaar, and local haats offer everything from temple supplies to traditional jewelry, textiles, and local produce.\n\n• Community Life — Nashik's community life revolves around temple visits, ghat gatherings, seasonal festivals, and the shared rhythms of a city that lives close to its traditions.\n\nNashik rewards the visitor who stays beyond the headlines and explores its quieter corners.",
    tags: ["Heritage", "Nature", "Culture", "Pandavleni", "Anjaneri"],
  },
  "12": {
    quote: "\u201CPlan wisely, prepare practically, and participate respectfully — that is the essence of a meaningful Kumbh visit.\u201D",
    quoteAttr: "— Kumbh Visitor Advisory",
    leftText: "Visiting Kumbh Mela requires practical preparation. The sheer scale of the event, the crowds, and the unfamiliar environment demand that visitors plan ahead.\n\nBEFORE YOU VISIT:\n• Plan Important Places — Identify the key sites you wish to visit: Trimbakeshwar, Kushavarta, Ramkund, Panchavati ghats, Kalaram Temple. Prioritise based on your time and interest.\n\n• Check Current Official Information — Bathing dates, procession schedules, route changes, and access restrictions are announced by authorities. Always check official sources before travelling.\n\n• Understand Transport and Access — Know how to reach Nashik (rail, road, air). Understand the shuttle services between Nashik and Trimbakeshwar. Plan for delays and traffic restrictions during peak days.\n\n• Keep Emergency Contacts — Note local police helpline numbers, medical facility locations, and lost-and-found centres. Share your itinerary with family.\n\n• Carry Essentials — Comfortable walking shoes, modest clothing, sun protection, a water bottle, basic medicines, a charged phone, ID documents, and cash (digital payments may not work everywhere during peak crowding).",
    rightTitle: "While Visiting Kumbh",
    rightText: "WHILE VISITING:\n\n• Respect Religious Spaces — Dress modestly. Remove shoes before entering temples. Follow local customs around prayer, offerings, and photography.\n\n• Follow Official Instructions — Obey crowd-control barriers, police directions, and event organisers. These are designed for your safety and the safety of millions around you.\n\n• Protect the River and Heritage — Do not throw waste, plastics, flowers, or offerings into the river. Use designated bins. Respect heritage structures.\n\n• Stay Aware of Your Group — Crowds can be dense and disorienting. Establish meeting points. Keep children close. Use the Discover Nashik Group Tracker feature.\n\n• Avoid Unnecessary Litter — Carry a bag for your waste. The Kumbh site is a shared sacred space. Leave it cleaner than you found it.\n\n• Allow Extra Time — Everything takes longer during Kumbh. Walking distances are greater, queues are longer, and transport is slower. Build buffer time into your plans.\n\n• Stay Hydrated and Rested — The physical demands of a Kumbh visit are significant. Drink water regularly, rest when needed, and pace yourself.\n\n• Be Patient and Open — Kumbh is not a curated tourist experience. It is a living pilgrimage. Approach it with patience, humility, and genuine curiosity.",
    tags: ["Planning", "Safety", "Transport", "Essentials"],
  },
  "13": {
    quote: "\u201CREAD → DISCOVER → UNDERSTAND → PLAN → EXPERIENCE\u201D",
    quoteAttr: "— Discover Nashik Platform",
    leftText: "Discover Nashik is your digital companion for exploring Nashik's heritage, culture, and Kumbh Mela 2027. The platform is designed to make information accessible, reliable, and useful for visitors, pilgrims, residents, and researchers.\n\nPlatform Features:\n\n• Heritage & Culture — Explore the spiritual, historical, and cultural heritage of Nashik through curated guides, stories, and place information.\n\n• Kumbh 2027 — Dedicated resources for understanding and planning your Kumbh Mela visit, including this digital heritage book.\n\n• Maps & Nearby — Interactive maps showing temples, ghats, facilities, and points of interest. Find what's near you.\n\n• AI Assistant — An intelligent assistant that can answer your questions about Nashik, Kumbh, temples, transport, food, and local information.\n\n• Group Tracker — Stay connected with your family, trek buddies, or pilgrimage group. Share live locations, meeting points, and notes.\n\n• Lost & Found — Report or search for lost items and people during Kumbh and other large events. A safety tool for crowded gatherings.\n\n• Local Businesses — Discover verified local businesses, hotels, restaurants, transport services, and shops. Supporting the local economy.\n\n• Multilingual — Available in English, Hindi, and Marathi — making Nashik's heritage accessible to a wider audience.",
    rightTitle: "Your Digital Guide",
    rightText: "How to use Discover Nashik:\n\n1. READ — Browse the heritage book, place guides, and Kumbh information to understand what makes Nashik special.\n\n2. DISCOVER — Use maps, nearby features, and the AI assistant to find places, temples, ghats, and services.\n\n3. UNDERSTAND — Learn about the traditions, stories, and significance behind each place before you visit.\n\n4. PLAN — Use the visitor guide, transport information, and business listings to prepare your trip practically.\n\n5. EXPERIENCE — Visit Nashik with awareness, respect, and appreciation for its heritage.\n\nThe platform is continuously updated with new content, features, and community contributions.\n\nKey Features at a Glance:\n• 📖 Heritage & Culture Guides\n• 🕉️ Kumbh 2027 Resources\n• 🗺️ Interactive Maps & Nearby\n• 🤖 AI Assistant\n• 👥 Group Tracker\n• 🔍 Lost & Found\n• 🏪 Local Business Directory\n• 🌐 English / Hindi / Marathi",
    tags: ["Discover Nashik", "AI Assistant", "Maps", "Group Tracker"],
  },
  "14": {
    quote: "\u201CTechnology should not replace tradition. It should help more people discover it.\u201D",
    quoteAttr: "— The Sacred Journey of Nashik",
    leftText: "Heritage is not only preserved in monuments and manuscripts — it lives in stories, rituals, community practices, and the memories of people. Digital tools can play a vital role in making this living heritage accessible to a wider audience while respecting its cultural roots.\n\nTRADITION encompasses:\n• Stories — The oral narratives, legends, and epics that give meaning to places and practices. The Ramayana associations of Panchavati, the legends of Trimbakeshwar, the folklore of the Godavari.\n\n• Temples — Architectural heritage, ritual practices, and the social life that revolves around temple complexes.\n\n• Rituals — The daily aarti, the seasonal festivals, the Kumbh bathing, the ancestral rites at Ramkund — practices that sustain faith across generations.\n\n• Local Memories — The knowledge held by priests, elders, boatmen, shopkeepers, and community members who have lived alongside these traditions.\n\n• Cultural Practices — Music, food, craft, festival traditions, and the unwritten rules of community life.\n\nDIGITAL tools can support this by providing:\n• Maps — Making it easy for visitors to navigate sacred landscapes and find places they might otherwise miss.\n• AI Assistance — Answering questions about history, culture, and logistics in real time.\n• Multilingual Information — Breaking language barriers so that heritage is not restricted to those who speak a particular language.\n• Digital Archives — Preserving photographs, oral histories, and documentation for future generations.\n• Interactive Guides — Making heritage engaging and accessible to younger audiences.",
    rightTitle: "Tradition Meets Technology",
    rightText: "The goal of digital heritage is not to digitise everything — it is to ensure that knowledge, stories, and cultural practices remain accessible even as the world changes.\n\nWhat Digital Heritage Can Achieve:\n\n• Accessibility — A visitor from anywhere in the world can learn about Nashik's heritage before, during, or after their visit.\n\n• Preservation — Oral histories, traditional knowledge, and community memories can be documented before they are lost.\n\n• Education — Schools, colleges, and researchers can access structured information about local heritage.\n\n• Engagement — Interactive maps, AI assistants, and multimedia guides make heritage exploration engaging for younger generations.\n\n• Inclusion — Multilingual support ensures that heritage information is not limited by language.\n\nWhat Digital Heritage Must Not Do:\n\n• It must not replace the experience of visiting a place, hearing a story from a local elder, or participating in a ritual.\n\n• It must not commercialise sacred spaces or reduce traditions to entertainment.\n\n• It must not present unverified claims as historical facts.\n\n• It must always centre the community's own voice and understanding of their heritage.\n\nTechnology is a tool. Tradition is the purpose.",
    tags: ["Digital Heritage", "Tradition", "Technology", "Preservation"],
  },
  "15": {
    quote: "\u201CHeritage belongs to everyone — and everyone has a responsibility to protect it.\u201D",
    quoteAttr: "— Nashik Heritage Conservation",
    leftText: "Kumbh Mela and the heritage sites of Nashik are shared treasures. Their preservation depends on the collective responsibility of visitors, residents, authorities, and communities.\n\nKEEP THE RIVER CLEAN\nThe Godavari sustains the entire pilgrimage tradition. Do not throw waste, plastics, flowers, food, or ritual offerings directly into the river. Use designated areas and bins. Support community clean-up initiatives.\n\nRESPECT SACRED SPACES\nTemples, ghats, caves, and pilgrimage sites are places of worship for millions. Dress appropriately, follow local customs, maintain silence in prayer areas, and ask permission before photographing rituals or people.\n\nRESPECT PEOPLE AND TRADITIONS\nKumbh brings together people from diverse backgrounds, faiths, and regions. Approach unfamiliar traditions with curiosity and respect, not judgment. Ask before photographing sadhus or ceremonies.\n\nPROTECT HERITAGE\nDo not damage, deface, or remove anything from heritage structures, caves, or temples. These are irreplaceable links to the past.\n\nFOLLOW OFFICIAL GUIDANCE\nDuring Kumbh, follow the instructions of police, event organisers, and local authorities. These guidelines are designed for the safety of millions.\n\nHELP FELLOW VISITORS\nIf you see someone in distress, lost, or in need of help, offer assistance or direct them to the nearest help centre. Community care is itself a Kumbh tradition.",
    rightTitle: "A Visitor's Pledge",
    rightText: "As a visitor to Nashik and Kumbh Mela, consider this pledge:\n\n✓ I will keep the Godavari clean and not throw waste into the river.\n\n✓ I will respect temples, ghats, and sacred spaces as places of worship.\n\n✓ I will dress appropriately and follow local customs.\n\n✓ I will ask permission before photographing people, sadhus, or ceremonies.\n\n✓ I will follow official instructions and crowd-management guidelines.\n\n✓ I will not damage, deface, or remove anything from heritage structures.\n\n✓ I will carry my waste and dispose of it responsibly.\n\n✓ I will be patient, kind, and helpful to fellow visitors.\n\n✓ I will approach traditions I do not understand with respect and curiosity.\n\n✓ I will remember that this is a sacred space for millions of people.\n\nHeritage is not a spectacle — it is a trust. Every visitor who respects it ensures that future generations can experience it too.\n\n\"The river, the temple, and the tradition endure — but only if we choose to protect them.\"",
    tags: ["Conservation", "Responsibility", "Respect", "River Protection"],
  },
  "16": {
    quote: "\u201CMake Nashik's heritage accessible to anyone, anywhere — while keeping its cultural identity at the centre.\u201D",
    quoteAttr: "— Discover Nashik Vision",
    leftText: "Discover Nashik began as a Kumbh Mela visitor guide. But Nashik's heritage extends far beyond a single event — and so does the platform's vision.\n\nThe long-term goal is to evolve from a Kumbh guide into a comprehensive digital heritage archive for Nashik and its surrounding region.\n\nWhat This Means:\n\n• Historical Locations — Documenting temples, forts, caves, ghats, and heritage structures with accurate information, photographs, and visitor guidance.\n\n• Oral Histories — Recording the stories, memories, and knowledge of community elders, priests, artisans, and longtime residents before this knowledge is lost.\n\n• Cultural Traditions — Preserving information about festivals, rituals, food traditions, music, craft, and community practices.\n\n• Festivals — Creating a living calendar of Nashik's festival traditions with their histories, practices, and community significance.\n\n• Local Stories — Collecting the lesser-known stories, legends, and folklore that give Nashik its unique character.\n\n• Heritage Walks — Curating self-guided and community-led walking routes that connect heritage sites with their stories.\n\n• Educational Content — Developing resources for schools, colleges, and researchers to learn about Nashik's history and culture.\n\n• Interactive Maps — Building detailed, multilingual maps of heritage landscapes, pilgrimage routes, and cultural sites.\n\n• Multilingual Cultural Resources — Ensuring all content is available in English, Hindi, and Marathi — and eventually in more languages.",
    rightTitle: "The Vision Ahead",
    rightText: "The future of Discover Nashik is shaped by a simple principle:\n\nMake Nashik's heritage accessible to anyone, anywhere — while keeping its cultural identity at the centre.\n\nThis means:\n\n• Community First — The platform should amplify the voices of local communities, not replace them. Heritage documentation must be guided by the people who live the traditions.\n\n• Accuracy Over Sensation — Historical and cultural content must be carefully researched and respectfully presented. Unverified claims should never be presented as facts.\n\n• Open Access — Heritage knowledge should be freely accessible. The platform aims to remain open and available to all.\n\n• Continuous Growth — The archive will grow over time through community contributions, research partnerships, and ongoing documentation.\n\n• Technology as a Tool — Maps, AI, multilingual features, and interactive guides are tools in service of heritage — not replacements for the real experience.\n\nNashik's heritage is a living inheritance — shaped by rivers, mountains, temples, stories, and the people who keep them alive.\n\nDiscover Nashik exists to help more people find their way to it.\n\n— The Discover Nashik Team",
    tags: ["Vision", "Digital Archive", "Heritage Walks", "Community"],
  },
};

export default function HeritageBookPage() {
  const { t } = useTranslation();
  
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [showTocModal, setShowTocModal] = useState<boolean>(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Cover(0) + TOC(1) + 16 chapters × 2 pages + Final page(34) = 35
  const totalPages = 35;

  const turnToPage = (newPage: number) => {
    if (newPage < 0 || newPage >= totalPages || newPage === currentPage) return;
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsFlipping(false);
    }, 200);
  };

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
      if (isDesktop && currentPage >= 2 && currentPage < totalPages - 2) {
        turnToPage(currentPage + 2);
      } else {
        turnToPage(currentPage + 1);
      }
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
      if (isDesktop && currentPage >= 4) {
        turnToPage(currentPage - 2);
      } else {
        turnToPage(currentPage - 1);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextPage();
      else prevPage();
    }
    setTouchStartX(null);
  };

  const renderPageContent = (pageNo: number) => {
    // Page 0: Cover
    if (pageNo === 0) {
      return (
        <div className="flex flex-col items-center justify-between min-h-[480px] p-6 md:p-10 text-center bg-[#faf4e8] border-4 border-[#b8860b]/40 rounded-xl relative overflow-hidden shadow-inner">
          <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-[#b8860b]" />
          <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-[#b8860b]" />
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-[#b8860b]" />
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-[#b8860b]" />

          <div className="space-y-3 mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-orange-100 text-orange-900 border border-orange-200">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" /> Digital Heritage Guide
            </span>
            <div className="w-16 h-16 mx-auto rounded-full bg-orange-600/10 flex items-center justify-center text-orange-700 my-4 shadow-sm border border-orange-200">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#173247] tracking-wide leading-tight">
              KUMBH MELA 2027<br /><span className="text-orange-700">THE SACRED JOURNEY<br />OF NASHIK</span>
            </h1>
            <p className="text-xs uppercase tracking-[0.25em] text-[#8c6b43] font-semibold">
              Discover • Understand • Experience
            </p>
            <p className="text-[11px] text-[#667883] font-medium mt-1">
              Nashik — Trimbakeshwar, Maharashtra
            </p>
          </div>

          <div className="my-6 max-w-sm p-4 rounded-2xl bg-white/70 border border-[#e1cfb0] shadow-sm backdrop-blur-sm">
            <p className="text-xs text-[#667883] leading-relaxed font-medium">
              A comprehensive heritage and cultural guide to Kumbh Mela, the sacred Godavari, Trimbakeshwar, Panchavati, and the living spiritual traditions of Nashik.
            </p>
          </div>

          <div className="w-full space-y-3 mb-2">
            <button
              onClick={() => turnToPage(1)}
              className="w-full max-w-xs mx-auto py-3 px-6 rounded-full bg-orange-600 text-white font-bold text-sm shadow-md hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" /> Open Book &amp; Contents
            </button>
            <p className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">
              The Sacred Journey of Nashik • Heritage Edition
            </p>
          </div>
        </div>
      );
    }

    // Page 1: Table of Contents
    if (pageNo === 1) {
      return (
        <div className="flex flex-col min-h-[480px] p-6 md:p-8 bg-[#fcf9f2] border border-[#e1cfb0] rounded-xl relative">
          <div className="flex items-center justify-between border-b border-[#e1cfb0] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <List className="w-5 h-5 text-orange-700" />
              <h2 className="text-xl font-serif font-bold text-[#173247]">CONTENTS</h2>
            </div>
            <span className="text-xs font-bold text-[#8c6b43] uppercase tracking-wider">Table of Chapters</span>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
            {CHAPTERS.map((chap) => (
              <button
                key={chap.id}
                onClick={() => turnToPage(chap.pageIndex)}
                className="w-full flex items-center justify-between p-2 rounded-xl border border-transparent hover:border-[#d8c4a3] hover:bg-white/80 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-orange-100 text-orange-800 font-bold text-xs flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    {chap.num}
                  </span>
                  <div>
                    <h3 className="text-xs md:text-sm font-bold text-[#173247] group-hover:text-orange-700 transition-colors">
                      {chap.title}
                    </h3>
                    <p className="text-[11px] text-[#667883] line-clamp-1">{chap.subtitle}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  Page {chap.pageIndex}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-[#e1cfb0] flex items-center justify-between text-xs text-[#8c6b43]">
            <span>📖 Select any chapter to read</span>
            <span className="font-bold">Table of Contents</span>
          </div>
        </div>
      );
    }

    // Final page (page 34)
    if (pageNo === totalPages - 1) {
      return (
        <div className="flex flex-col items-center justify-between min-h-[480px] p-6 md:p-10 text-center bg-[#faf4e8] border-4 border-[#b8860b]/40 rounded-xl relative overflow-hidden shadow-inner">
          <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-[#b8860b]" />
          <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-[#b8860b]" />
          <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-[#b8860b]" />
          <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-[#b8860b]" />

          <div className="space-y-4 mt-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-orange-600/10 flex items-center justify-center text-orange-700 shadow-sm border border-orange-200">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#173247]">
              DISCOVER NASHIK
            </h2>
            <p className="text-sm text-orange-800 font-semibold leading-relaxed max-w-xs mx-auto">
              Explore Heritage. Experience Culture. Discover Kumbh.
            </p>
            <p className="text-xs text-[#667883] font-medium leading-relaxed max-w-sm mx-auto">
              Preserving the Past • Connecting the Present • Inspiring the Future
            </p>
          </div>

          <div className="my-6 max-w-sm p-5 rounded-2xl bg-white/70 border border-[#e1cfb0] shadow-sm backdrop-blur-sm space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-800">
              Scan to Explore the Platform
            </p>
            <div className="w-24 h-24 mx-auto rounded-xl bg-slate-100 border-2 border-dashed border-[#d8c4a3] flex items-center justify-center text-slate-400">
              <span className="text-3xl">📱</span>
            </div>
            <a
              href="https://discovernashik.co.in/"
              target="_blank"
              rel="noreferrer"
              className="block text-xs font-bold text-orange-700 hover:text-orange-900 underline transition-colors"
            >
              discovernashik.co.in
            </a>
          </div>

          <div className="space-y-2 mb-2">
            <button
              onClick={() => turnToPage(0)}
              className="px-6 py-2.5 rounded-full bg-orange-600 text-white font-bold text-sm shadow-md hover:bg-orange-700 transition-all inline-flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" /> Back to Cover
            </button>
            <p className="text-[10px] text-[#8c6b43] font-semibold uppercase tracking-wider">
              © Discover Nashik • The Sacred Journey of Nashik
            </p>
          </div>
        </div>
      );
    }

    // Chapter pages (pages 2–33)
    const chapIndex = Math.floor((pageNo - 2) / 2);
    const activeChap = CHAPTERS[chapIndex] || CHAPTERS[0];
    const isLeftPage = pageNo % 2 === 0;
    const content = CHAPTER_CONTENT[activeChap.num];

    return (
      <div className="flex flex-col justify-between min-h-[480px] p-6 md:p-8 bg-[#fcf9f2] border border-[#e1cfb0] rounded-xl relative">
        <div className="flex items-center justify-between border-b border-[#e1cfb0]/80 pb-2 mb-4 text-xs text-[#8c6b43]">
          <span className="font-bold font-serif tracking-wider flex items-center gap-1.5">
            <Feather className="w-3.5 h-3.5 text-orange-600" />
            Chapter {activeChap.num}: {activeChap.title}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {isLeftPage ? "Left Page" : "Right Page"}
          </span>
        </div>

        <div className="flex-1 space-y-4">
          {isLeftPage ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-orange-800">
                  Section {activeChap.num}.1
                </span>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-[#173247]">
                  {activeChap.title}
                </h2>
                <p className="text-xs text-[#667883] italic">{activeChap.subtitle}</p>
              </div>

              {content && (
                <div className="p-3.5 rounded-xl bg-orange-50/80 border-l-4 border-orange-600 space-y-1 my-3">
                  <p className="text-xs font-serif italic text-orange-950">
                    {content.quote}
                  </p>
                  <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider block">
                    {content.quoteAttr}
                  </span>
                </div>
              )}

              {content ? (
                <div className="space-y-2 pt-1">
                  {content.leftText.split("\n\n").map((para, i) => (
                    <p key={i} className="text-xs leading-relaxed text-[#333] font-medium">
                      {para}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <div className="h-3.5 bg-slate-200/80 rounded w-full animate-pulse" />
                  <div className="h-3.5 bg-slate-200/80 rounded w-11/12 animate-pulse" />
                  <div className="h-3.5 bg-slate-200/80 rounded w-4/5 animate-pulse" />
                  <div className="h-3.5 bg-slate-200/80 rounded w-10/12 animate-pulse" />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {content ? (
                <>
                  <div className="space-y-1 mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-orange-800">
                      Section {activeChap.num}.2
                    </span>
                    <h3 className="text-lg md:text-xl font-serif font-bold text-[#173247]">
                      {content.rightTitle}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {content.rightText.split("\n\n").map((para, i) => (
                      <p key={i} className="text-xs leading-relaxed text-[#333] font-medium">
                        {para}
                      </p>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#e1cfb0] space-y-1.5 shadow-sm mt-3">
                    <span className="text-[11px] font-bold text-[#173247] uppercase tracking-wider flex items-center gap-1">
                      <Bookmark className="w-3.5 h-3.5 text-orange-600" /> Key References
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {content.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border-2 border-dashed border-[#d8c4a3] bg-orange-50/40 p-6 text-center space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-orange-100 flex items-center justify-center text-orange-700">
                      <Landmark className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-serif font-bold text-[#173247]">
                      Content Loading
                    </h3>
                    <p className="text-xs text-[#667883] max-w-xs mx-auto">
                      This section is being prepared.
                    </p>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="h-3 bg-slate-200/70 rounded w-full animate-pulse" />
                    <div className="h-3 bg-slate-200/70 rounded w-9/12 animate-pulse" />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 pt-2 border-t border-[#e1cfb0]/60 flex items-center justify-between text-xs text-[#8c6b43] font-mono">
          <span>{`Page ${pageNo}`}</span>
          <span className="text-[11px] font-sans font-semibold text-orange-800">The Sacred Journey of Nashik</span>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#f8f2e8] text-[#173247] py-8 md:py-12 px-4 flex flex-col justify-between">
      <div className="container mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link
            href="/kumbh"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#d8c4a3] bg-white text-xs font-bold text-[#667883] hover:bg-orange-50 hover:text-orange-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> {t("Back to Kumbh Guide")}
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTocModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#d8c4a3] text-xs font-bold text-[#173247] hover:border-orange-500 hover:text-orange-600 shadow-sm transition-all"
            >
              <List className="w-4 h-4 text-orange-600" /> Contents
            </button>
          </div>
        </header>

        <section
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative max-w-4xl mx-auto my-4 transition-all duration-300"
        >
          <div className="rounded-3xl border-8 border-[#3d2716] bg-[#3d2716] p-2 md:p-4 shadow-[0_20px_50px_rgba(40,25,10,0.25)] relative overflow-hidden">
            <div className="hidden md:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-black/20 via-black/5 to-black/20 z-20 pointer-events-none" />

            <div className={`transition-opacity duration-200 ${isFlipping ? "opacity-40 scale-[0.99]" : "opacity-100 scale-100"}`}>
              {currentPage === 0 || currentPage === 1 || currentPage === totalPages - 1 ? (
                <div className="w-full max-w-lg mx-auto">
                  {renderPageContent(currentPage)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 relative z-10">
                  <div className="w-full">
                    {renderPageContent(currentPage)}
                  </div>
                  <div className="hidden md:block w-full">
                    {currentPage + 1 < totalPages - 1 ? (
                      renderPageContent(currentPage + 1)
                    ) : (
                      renderPageContent(currentPage)
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 mt-6 p-4 rounded-2xl bg-white border border-[#e1cfb0] shadow-sm max-w-4xl mx-auto">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#d8c4a3] bg-white text-xs font-bold text-[#173247] hover:bg-orange-50 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 text-orange-600" /> Previous Page
          </button>

          <div className="text-center">
            <p className="text-xs font-bold text-[#173247] font-mono">
              {currentPage === 0
                ? "Book Cover"
                : currentPage === 1
                ? "Table of Contents"
                : currentPage === totalPages - 1
                ? "Final Page"
                : typeof window !== "undefined" && window.innerWidth >= 768
                ? `Pages ${currentPage}–${Math.min(currentPage + 1, totalPages - 2)} of ${totalPages - 1}`
                : `Page ${currentPage} of ${totalPages - 1}`}
            </p>
            <p className="text-[10px] text-[#8c6b43] font-semibold uppercase tracking-wider">
              {currentPage === 0 ? "Tap Open Book to Start" : "Swipe or click arrows to flip pages"}
            </p>
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage >= totalPages - 1}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 disabled:opacity-40 disabled:hover:bg-orange-600 transition-all shadow-sm"
          >
            Next Page <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      </div>

      {showTocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#e1cfb0] pb-3">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-serif font-bold text-[#173247]">Book Table of Contents</h3>
              </div>
              <button
                onClick={() => setShowTocModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1 flex-1">
              <button
                onClick={() => {
                  turnToPage(0);
                  setShowTocModal(false);
                }}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-orange-50 text-xs font-bold text-[#173247] flex items-center justify-between"
              >
                <span>📖 Book Cover</span>
                <span className="text-[10px] font-mono text-slate-500">Page 0</span>
              </button>

              {CHAPTERS.map((chap) => (
                <button
                  key={chap.id}
                  onClick={() => {
                    turnToPage(chap.pageIndex);
                    setShowTocModal(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl border border-transparent hover:border-[#d8c4a3] hover:bg-orange-50/60 text-xs flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded bg-orange-100 text-orange-800 font-bold text-[11px] flex items-center justify-center">
                      {chap.num}
                    </span>
                    <div>
                      <p className="font-bold text-[#173247]">{chap.title}</p>
                      <p className="text-[10px] text-[#667883]">{chap.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded">
                    Pg {chap.pageIndex}
                  </span>
                </button>
              ))}

              <button
                onClick={() => {
                  turnToPage(totalPages - 1);
                  setShowTocModal(false);
                }}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-orange-50 text-xs font-bold text-[#173247] flex items-center justify-between"
              >
                <span>✨ Final Page — Discover Nashik</span>
                <span className="text-[10px] font-mono text-slate-500">Page {totalPages - 1}</span>
              </button>
            </div>

            <button
              onClick={() => setShowTocModal(false)}
              className="w-full py-2.5 rounded-xl border border-[#d8c4a3] text-xs font-bold text-[#667883] hover:bg-slate-100"
            >
              Close Contents
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
