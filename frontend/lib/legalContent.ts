/**
 * Discover Nashik - Legal Documentation Content
 * Version: 1.0 (Effective October 2026)
 * 
 * Contains complete, professional Terms & Conditions and Privacy Policy
 * documents meeting all statutory and operational guidelines.
 */

export interface LegalSection {
  id: string;
  number: number;
  title: string;
  subsections?: { subtitle?: string; content: string[] }[];
  content?: string[];
  bulletPoints?: string[];
}

export interface LegalDocument {
  title: string;
  version: string;
  lastUpdated: string;
  summary: string;
  sections: LegalSection[];
}

export const TERMS_AND_CONDITIONS: LegalDocument = {
  title: "Terms & Conditions",
  version: "1.0",
  lastUpdated: "October 30, 2026",
  summary: "These Terms & Conditions constitute a legally binding agreement between you and Discover Nashik governing your access to and use of the platform.",
  sections: [
    {
      id: "introduction",
      number: 1,
      title: "Introduction",
      content: [
        "Discover Nashik is a digital tourism and information platform designed to help visitors, pilgrims, and residents explore Nashik, Trimbakeshwar, and surrounding destinations in Maharashtra, India. The platform provides comprehensive tourist information, interactive maps, curated itineraries, business directories, civic utilities, and dedicated services for Kumbh Mela 2027.",
        "By accessing our website, creating an account, or using our mobile-responsive interfaces and related digital services, you enter into a binding legal agreement subject to these Terms & Conditions."
      ]
    },
    {
      id: "acceptance-of-terms",
      number: 2,
      title: "Acceptance of Terms",
      content: [
        "By creating an account, registering on Discover Nashik, or otherwise accessing platform services, you explicitly affirm that you have read, understood, and agree to follow these Terms & Conditions in full.",
        "If you do not agree with any provision set forth in these terms, you must refrain from registering an account and discontinue using the platform immediately."
      ]
    },
    {
      id: "user-account-security",
      number: 3,
      title: "User Account and Security",
      bulletPoints: [
        "Accurate Registration: Users must provide accurate, current, and complete information during registration, including genuine mobile numbers and email addresses.",
        "Credential Confidentiality: Users are solely responsible for maintaining the confidentiality of their login credentials, passwords, and assigned Discover Nashik Platform IDs.",
        "No Unauthorized Sharing: Users must not share their account credentials, verification codes, or access tokens with unauthorized individuals or third parties.",
        "Activity Reporting: Any known or suspected unauthorized access, account compromise, or security anomaly must be reported immediately to Discover Nashik administration.",
        "Account Responsibility: The registered account holder is legally responsible for all activities and submissions carried out under their account until Discover Nashik receives notice of compromise."
      ]
    },
    {
      id: "data-privacy-protection",
      number: 4,
      title: "Data Privacy and Protection",
      content: [
        "Discover Nashik respects user privacy and handles personal data in accordance with our Privacy Policy and applicable data protection legislation."
      ],
      bulletPoints: [
        "Legitimate Collection: Personal information is collected only when strictly necessary for providing, maintaining, and improving platform services.",
        "No Commercial Sale: User personal information will not be sold, rented, or bartered to third parties for their independent marketing or commercial purposes.",
        "Security Safeguards: Appropriate technical and organizational security measures are implemented to protect personal data against unauthorized access, loss, or disclosure.",
        "Restricted Access: Access to user personal information is strictly restricted to authorized personnel who require it for legitimate operational and administrative requirements.",
        "Secure Password Storage: Passwords are never stored in plain text. Secure, industry-standard cryptographic password hashing (bcrypt) is utilized.",
        "API & Infrastructure Protection: Sensitive operational and user details are not intentionally exposed through public APIs, client logs, or unauthorized database queries.",
        "Realistic Security Commitment: While Discover Nashik employs rigorous technical safeguards, no online platform or digital system can guarantee absolute protection against every conceivable cyberattack or vulnerability. We take reasonable, proactive, and commercially sound measures to protect user information."
      ]
    },
    {
      id: "location-device-permissions",
      number: 5,
      title: "Location and Device Permissions",
      bulletPoints: [
        "Optional Location Access: Location access is entirely optional unless a specific feature (such as interactive navigation, nearby attractions, or real-time group tracking) requires it.",
        "Purpose of Location Data: When granted by the user, location information is utilized exclusively for displaying nearby places, interactive maps, route guidance, and location-based civic assistance.",
        "Device Permissions: Camera, photo storage, and other device permissions are requested only when required for explicit user features, such as uploading place photos or submitting lost-and-found reports.",
        "User Permission Management: Users can manage, grant, or revoke permissions at any time through their device or web browser settings.",
        "No Undisclosed Background Tracking: Discover Nashik does not collect continuous background location data without an explicitly disclosed operational purpose and without explicit user consent."
      ]
    },
    {
      id: "platform-features",
      number: 6,
      title: "Platform Features and Tourism Services",
      content: [
        "Discover Nashik provides an extensive suite of digital tourism, civic, and pilgrimage tools, including but not limited to:"
      ],
      bulletPoints: [
        "Explore Nashik and Trimbakeshwar: Historical overviews, sacred temples, vineyards, ghats, and cultural heritage itineraries.",
        "Kumbh Mela 2027 Information: Key Shahi Snan dates, ghat allocations, parking zones, crowd guidelines, and spiritual event schedules.",
        "Interactive Maps & Facilities: Point-of-interest mapping for medical centers, police chowkis, restrooms, drinking water booths, and public transport hubs.",
        "Hotels, Dining & Local Businesses: Curated business directories, local culinary specialties, and verified accommodations.",
        "AI-Powered Tourism Assistant: Real-time intelligent chatbot providing conversational tourism information and route recommendations.",
        "Group Tracker: Voluntary, permission-based location sharing allowing pilgrim groups, families, and tour groups to coordinate during visits.",
        "Lost & Found Portal: Public-interest reporting system for reporting missing individuals or lost belongings during crowded festivals.",
        "Personalized Trip Planner: Algorithmic and user-customized travel schedules tailored to duration, interests, and budget.",
        "Civic and Tourism Utilities: Weather alerts, emergency hotline contacts, and transport shuttle status."
      ]
    },
    {
      id: "ai-assistant-disclaimer",
      number: 7,
      title: "AI Assistant Disclaimer",
      bulletPoints: [
        "Informational Assistance Only: AI-generated responses from the Discover Nashik digital assistant are provided solely for informational and planning guidance.",
        "Independent Verification: Users should independently verify critical information, including ritual timings, transport schedules, road closures, and official requirements.",
        "Not Official Advice: AI-generated content must not be construed or relied upon as official government orders, medical advice, legal counsel, or emergency protocols.",
        "Emergency Contacts: In emergencies or critical safety situations, users must immediately contact official emergency services (112 / 108) or on-duty police and disaster response authorities."
      ]
    },
    {
      id: "third-party-services",
      number: 8,
      title: "Third-Party Services and Integrations",
      bulletPoints: [
        "External Links & Map Layers: The platform may integrate third-party map tiles, payment gateways, transactional email services, or external tourism links.",
        "Independent Policies: Third-party services operate under their own independent terms and privacy practices.",
        "Limitation of Liability: Discover Nashik is not responsible for independent third-party privacy practices, external site availability, or third-party service interruptions."
      ]
    },
    {
      id: "business-listings-contributions",
      number: 9,
      title: "Business Listings and User Contributions",
      bulletPoints: [
        "Genuine Information: Business owners, vendors, and content contributors must submit genuine, truthful, and non-deceptive details regarding their establishments.",
        "Administrative Verification: All submitted business listings and public contributions are subject to administrative review, verification, and moderation.",
        "Right to Moderate: Discover Nashik reserves the explicit right to reject, suspend, or permanently remove listings that are fraudulent, misleading, or in violation of platform guidelines.",
        "Prohibited Content: Users must not upload illegal, defamatory, obscene, infringing, or socially disruptive content."
      ]
    },
    {
      id: "lost-and-found",
      number: 10,
      title: "Lost & Found Feature Guidelines",
      bulletPoints: [
        "Truthful Submissions: Users submitting lost or found reports must provide genuine, accurate, and non-fraudulent descriptions.",
        "No Recovery Guarantee: While the platform facilitates community assistance, Discover Nashik cannot guarantee the recovery, safety, or return of lost belongings or missing persons.",
        "Verification Before Handover: Users are strongly advised to independently verify the identity and credentials of any individual before handing over valuable property.",
        "Sensitive Information: Users must exercise caution and avoid publishing sensitive personal or financial identifiers unnecessarily on public boards."
      ]
    },
    {
      id: "group-tracker",
      number: 11,
      title: "Group Tracker Guidelines",
      bulletPoints: [
        "Explicit Consent: Group tracking and location synchronization require active, mutual user consent within the application.",
        "Trusted Members Only: Users must only share group tracker invite codes or tracking links with trusted family members, friends, or verified tour companions.",
        "Revocation of Tracking: Users can leave a group or stop location sharing at any time through the in-app controls."
      ]
    },
    {
      id: "prohibited-activities",
      number: 12,
      title: "Prohibited Activities",
      content: [
        "When using Discover Nashik, users must not engage in any of the following activities:"
      ],
      bulletPoints: [
        "Attempting unauthorized access to accounts, administrative dashboards, backend servers, or underlying databases.",
        "Hacking, reverse-engineering, probing, or disrupting platform infrastructure or associated networks.",
        "Injecting malicious code, viruses, worms, automated scraping bots, or denial-of-service payloads.",
        "Impersonating another person or misusing someone else's personal contact information without lawful authority.",
        "Submitting fraudulent business registrations, fake reviews, or misleading emergency reports.",
        "Using the platform for any unlawful, harassing, or commercially exploitative purpose not authorized by Discover Nashik."
      ]
    },
    {
      id: "platform-accuracy-availability",
      number: 13,
      title: "Platform Accuracy and Service Availability",
      content: [
        "Tourism information, business operating hours, bus and shuttle schedules, entry tariffs, map markers, and Kumbh Mela crowd management directives may change without prior notice due to administrative or civic requirements.",
        "Users are strongly encouraged to cross-reference important schedules with official district administration announcements. Discover Nashik does not warrant uninterrupted, error-free, or zero-latency service availability."
      ]
    },
    {
      id: "suspension-termination",
      number: 14,
      title: "Account Suspension and Termination",
      content: [
        "Discover Nashik reserves the right to restrict, suspend, or permanently terminate user accounts or access tokens that are found to be involved in fraudulent conduct, harassment, security violations, malicious activities, or repeated breaches of these Terms & Conditions, subject to applicable Indian laws."
      ]
    },
    {
      id: "changes-to-terms",
      number: 15,
      title: "Changes to Terms & Conditions",
      content: [
        "Discover Nashik may update, revise, or amend these Terms & Conditions periodically to reflect technological updates, regulatory changes, or new platform features.",
        "When material modifications occur, users will be informed through platform notices or updated policy banners. Where required by applicable law, renewed consent will be requested before continuing access."
      ]
    },
    {
      id: "contact-grievance",
      number: 16,
      title: "Contact and Grievance Support",
      content: [
        "For questions regarding these Terms & Conditions, account inquiries, or data-related assistance, users may contact the Discover Nashik support team using our verified contact channels:"
      ],
      bulletPoints: [
        "Support & Grievance Email: discover.nashik15@gmail.com",
        "Support Phone: +91 9767173376",
        "Operational Location: Nashik, Maharashtra, India",
        "Official Civic Emergency Hotlines: 112 (All Emergencies) / 108 (Medical Ambulance)"
      ]
    },
    {
      id: "applicable-law",
      number: 17,
      title: "Applicable Law and Jurisdiction",
      content: [
        "These Terms & Conditions are governed by and construed in accordance with the laws of the Republic of India, including the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023.",
        "Any disputes arising out of or in connection with the use of Discover Nashik shall be subject to the exclusive jurisdiction of the competent courts located in Nashik, Maharashtra, India."
      ]
    }
  ]
};

export const PRIVACY_POLICY: LegalDocument = {
  title: "Privacy Policy",
  version: "1.0",
  lastUpdated: "October 30, 2026",
  summary: "This Privacy Policy describes how Discover Nashik collects, uses, stores, and protects your personal information when you use our platform.",
  sections: [
    {
      id: "intro-scope",
      number: 1,
      title: "Introduction and Scope",
      content: [
        "Discover Nashik ('we', 'us', or 'our') is committed to protecting your privacy and handling your personal data responsibly. This Privacy Policy applies to all visitors, registered tourists, local business operators, and administrators utilizing Discover Nashik web portals, digital guides, and location-based utilities.",
        "This policy outlines what data we collect, why we collect it, how it is safeguarded, and your statutory rights regarding your personal information."
      ]
    },
    {
      id: "information-collected",
      number: 2,
      title: "Information We Collect",
      content: [
        "We collect personal and technical information only to the extent necessary to deliver high-quality digital tourism and civic services:"
      ],
      bulletPoints: [
        "Account & Contact Identifiers: Full name (optional), email address, Indian mobile phone number, and unique Discover Nashik Platform ID (e.g. DN-XXXXXXX).",
        "Authentication Credentials: Secure cryptographic password hashes. Plaintext passwords are never collected, logged, or stored.",
        "Location Data: Real-time geographic coordinates (latitude and longitude) strictly when the user grants explicit browser permission for nearby places, navigation, or Group Tracker.",
        "User-Submitted Contributions: Reviews, star ratings, lost & found inquiries, missing person reports, place suggestions, and photos uploaded by users.",
        "Business Registration Details: Business name, owner contact details, physical business address, commercial categories, and verification documentation submitted by business operators.",
        "Technical & Log Information: IP address, browser user-agent, operating system, session cookies, and server timestamps collected for security auditing, fraud prevention, and session maintenance."
      ]
    },
    {
      id: "why-we-collect",
      number: 3,
      title: "Why We Collect Information",
      bulletPoints: [
        "Account Provisioning: To register your account, assign a unique Discover Nashik Platform ID, and authenticate your login sessions.",
        "Tourism & Navigation Services: To calculate distances, recommend nearby attractions, provide directions, and enable Kumbh Mela 2027 itinerary planning.",
        "Group & Community Coordination: To power the voluntary Group Tracker and Lost & Found community assistance tools.",
        "Platform Security & Integrity: To prevent brute-force attacks, detect bot activities, enforce rate limits, and block malicious identifiers.",
        "Operational Communications: To send password reset links, critical Kumbh safety notices, and verified account confirmations."
      ]
    },
    {
      id: "how-information-used",
      number: 4,
      title: "How Information Is Used",
      content: [
        "We use personal information strictly for legitimate operational purposes aligned with our platform commitments. We will never sell, rent, or trade your personal information to third parties for independent marketing or advertising campaigns.",
        "Information is processed to deliver interactive features, maintain system performance, comply with civic guidelines, and support user-initiated inquiries."
      ]
    },
    {
      id: "storage-protection",
      number: 5,
      title: "How Information Is Stored and Protected",
      content: [
        "Discover Nashik stores application records in secure MongoDB databases protected by environment-level credentials, network firewalls, and encrypted communication channels.",
        "Access to production databases and administrative consoles is restricted to authorized administrative personnel on a strict, need-to-know operational basis.",
        "Realistic Security Statement: While we implement rigorous industry-standard administrative, physical, and technical safeguards, no online application or electronic storage system can guarantee 100% immunity against every potential security threat. Discover Nashik commits to taking reasonable, appropriate, and continuous security measures to safeguard user data."
      ]
    },
    {
      id: "password-encryption",
      number: 6,
      title: "Password Encryption and Authentication Security",
      bulletPoints: [
        "Cryptographic Hashing: Passwords are protected using salted bcrypt cryptographic hashing (work factor 10) before being stored. Plaintext passwords never touch our permanent database.",
        "Token-Based Authentication: User sessions are managed using industry-standard JSON Web Tokens (JWT) signed with secure server secrets.",
        "HttpOnly Cookie Protection: Session tokens are stored in httpOnly, same-site protected browser cookies to mitigate cross-site scripting (XSS) risks.",
        "Passwordless Platform ID Option: Discover Nashik provides unique, non-predictable Platform IDs allowing seamless authentication without exposing static credentials across shared devices."
      ]
    },
    {
      id: "data-sharing-third-parties",
      number: 7,
      title: "Data Sharing and Third-Party Service Providers",
      content: [
        "We do not sell personal information. We only share data with third-party service providers who assist in operating our platform, subject to confidentiality obligations:"
      ],
      bulletPoints: [
        "Transactional Email Delivery: We utilize verified transactional email providers (such as Resend) solely to transmit account password resets and essential verification emails.",
        "Map & Geographic Services: Map visualization utilizes mapping libraries (Leaflet / OpenStreetMap / Mapbox tiles). Coordinates are processed client-side for displaying map markers.",
        "Cloud & Database Infrastructure: Cloud hosting and database providers who store encrypted application data under strict operational security agreements.",
        "Legal & Statutory Disclosures: We may disclose information if required to do so by applicable Indian law, court order, or formal request from law enforcement authorities in emergency situations."
      ]
    },
    {
      id: "data-retention-deletion",
      number: 8,
      title: "Data Retention and Account Deletion",
      content: [
        "Personal data is retained only for as long as your account remains active or as required to fulfill legitimate operational, civic, or statutory requirements.",
        "Users may request account deactivation, data export, or deletion of their personal records by contacting support at discover.nashik15@gmail.com. We process verified requests in accordance with applicable legal timeframes."
      ]
    },
    {
      id: "user-rights",
      number: 9,
      title: "User Rights and Control",
      content: [
        "Under Indian data protection laws, including the Digital Personal Data Protection Act, 2023, you have recognized rights concerning your personal information:"
      ],
      bulletPoints: [
        "Right to Access: You can review your profile information and account platform ID at any time via your user dashboard.",
        "Right to Correction: You can correct inaccurate contact details or update your registration information.",
        "Right to Erasure: You may request the deletion of your account and personal data, subject to lawful retention requirements.",
        "Right to Withdraw Consent: You can revoke device permissions (location, camera) at any time through your device settings.",
        "Right to Grievance Redressal: You have the right to file an inquiry or grievance with our designated support channel."
      ]
    },
    {
      id: "cookies-technical-info",
      number: 10,
      title: "Cookies and Technical Information",
      content: [
        "Discover Nashik utilizes essential cookies (`app_user_token`) strictly for session authentication, security verification, and language preference retention.",
        "We do not use invasive third-party tracking cookies or advertising tracking pixels. Users can control cookie behavior through browser settings, though disabling essential cookies may impact login functionality."
      ]
    },
    {
      id: "children-privacy",
      number: 11,
      title: "Children's Privacy",
      content: [
        "Discover Nashik is designed as a family-friendly tourism and civic resource. However, our user registration is intended for individuals who are at least 18 years of age or who access the service under the supervision and consent of a parent or legal guardian.",
        "We do not knowingly collect personal information directly from unaccompanied minors without parental oversight."
      ]
    },
    {
      id: "security-incident-handling",
      number: 12,
      title: "Security Incident and Data Breach Handling",
      content: [
        "Discover Nashik maintains proactive operational monitoring to detect and address potential security anomalies. In the event of a verified security incident affecting user personal data, we will take immediate containment steps, investigate the root cause, and notify affected users and regulatory authorities in accordance with applicable legal mandates."
      ]
    },
    {
      id: "changes-privacy-policy",
      number: 13,
      title: "Changes to This Privacy Policy",
      content: [
        "We may update this Privacy Policy periodically to reflect technological improvements, legal developments, or enhanced platform services.",
        "The 'Last Updated' date at the top of this document indicates when changes were made. Continued use of Discover Nashik following policy revisions signifies your acknowledgement of the updated policy."
      ]
    },
    {
      id: "contact-grievance-redressal",
      number: 14,
      title: "Contact and Grievance Redressal Mechanism",
      content: [
        "For any privacy-related questions, data protection requests, or grievance redressal, please contact our support team:"
      ],
      bulletPoints: [
        "Grievance & Support Email: discover.nashik15@gmail.com",
        "Support Phone: +91 9767173376",
        "Physical Jurisdiction: Nashik, Maharashtra, India",
        "Response Timeline: We endeavor to acknowledge and resolve privacy inquiries within statutory timelines (typically within 30 days)."
      ]
    }
  ]
};
