// All sample data is fictional.
export type Contact = { name: string; title: string; campus: string; email: string; phone: string; status: "Confirmed" | "Inferred"; role: string; tag?: "New" | "Departed" };

export const contacts: Contact[] = [
  { name: "Jordan Reyes", title: "Director of Academic Technology", campus: "Lakeside State", email: "j.reyes@example.edu", phone: "(555) 010-2231", status: "Confirmed", role: "IT & Academic Tech", tag: "New" },
  { name: "Priya Nair", title: "Facilities Project Manager", campus: "Harbor City College", email: "pnair@example.edu", phone: "(555) 010-4410", status: "Confirmed", role: "Facilities" },
  { name: "Marcus Bell", title: "Director of Purchasing", campus: "Lakeside State", email: "marcus.bell@example.edu", phone: "(555) 010-2290", status: "Inferred", role: "Procurement", tag: "Departed" },
  { name: "Events Office", title: "Event & Performance Spaces", campus: "Harbor City College", email: "events@example.edu", phone: "(555) 010-4475", status: "Confirmed", role: "AV-heavy spaces" },
];

export const campuses = {
  SUNY: ["Albany", "Binghamton", "Buffalo (UB)", "Stony Brook", "Buffalo State", "Brockport", "Cortland", "Fredonia", "Geneseo", "New Paltz", "Old Westbury", "Oneonta", "Oswego", "Plattsburgh", "Potsdam", "Purchase", "Empire State", "Farmingdale", "Maritime", "Polytechnic Institute", "Alfred State", "Canton", "Cobleskill", "Delhi", "Morrisville", "ESF", "Optometry", "Downstate Health", "Upstate Medical"],
  CUNY: ["Baruch", "Brooklyn College", "City College", "College of Staten Island", "Hunter", "John Jay", "Lehman", "Medgar Evers", "NYC College of Technology", "Queens College", "York", "BMCC", "Bronx CC", "Guttman CC", "Hostos CC", "Kingsborough CC", "LaGuardia CC", "Queensborough CC", "Graduate Center", "CUNY School of Law", "CUNY SPS"],
};

export type HeroRow = { site: string; item: string; detail: string; status: "Confirmed" | "New" | "Updated" };
export const heroRows: HeroRow[] = [
  { site: "example-store.com", item: "Wireless Speaker X2", detail: "$129.00 · in stock", status: "Confirmed" },
  { site: "example-realty.com", item: "3-bed house on Maple Street", detail: "$485,000 · just listed", status: "New" },
  { site: "example.edu", item: "Jordan Reyes, AV Services Manager", detail: "j.reyes@example.edu", status: "Confirmed" },
  { site: "example-jobs.com", item: "Data Analyst, full time", detail: "posted 2 days ago", status: "Updated" },
];
