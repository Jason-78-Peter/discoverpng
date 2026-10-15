// Static place data for now — this becomes real Supabase data once the
// data layer (M3) is built. Centralized here so the Explore list and the
// Location Detail screen both read from the same source.

export type Review = {
  id: string;
  author: string;
  stars: number; // 1-5
  when: string;
  text: string;
};

export type Place = {
  id: string;
  name: string;
  region: string;
  tag: string;
  description: string;
  accommodationNote: string;
  reviews: Review[];
};

export const PLACES: Place[] = [
  {
    id: '1',
    name: 'Rabaul Volcano',
    region: 'East New Britain Province',
    tag: 'Nature',
    description:
      "One of PNG's most active volcanoes, rising over Rabaul town in East New Britain. Guided walks lead to the crater rim, and the surrounding ash-grey beaches are a short walk from town. Best visited early morning before the cloud sets in.",
    accommodationNote:
      'Budget guesthouses and the Rabaul Hotel are a short walk from town, from around K180/night.',
    reviews: [
      { id: 'r1', author: 'Jason P.', stars: 5, when: '2 weeks ago', text: 'Early morning walk to the crater was worth the heat. Guide was friendly and knew the safe paths well.' },
      { id: 'r2', author: 'Mera K.', stars: 4, when: '1 month ago', text: 'Beautiful but very hot by mid-morning. Bring water and go early.' },
    ],
  },
  {
    id: '2',
    name: 'Mt Hagen Show',
    region: 'Western Highlands Province',
    tag: 'Culture',
    description:
      "A major cultural festival bringing together sing-sing groups from across the Highlands in elaborate traditional dress. One of the most accessible ways to see PNG's cultural diversity in one place.",
    accommodationNote: 'A range of hotels in Mt Hagen town, from guesthouses to mid-range options near the showgrounds.',
    reviews: [],
  },
  {
    id: '3',
    name: 'Kokoda Track',
    region: 'Oro / Central Province',
    tag: 'Trekking',
    description:
      "A demanding multi-day trek through rainforest along the historic WWII track between Owers' Corner and Kokoda. Requires a licensed guide and a reasonable level of fitness.",
    accommodationNote: 'Camping along the track with a licensed trekking operator; no formal accommodation on the route itself.',
    reviews: [],
  },
  {
    id: '4',
    name: 'Loloata Island',
    region: 'Central Province',
    tag: 'Island',
    description:
      'A small reef island a short boat ride from Port Moresby, known for calm snorkeling spots and a relaxed, low-key atmosphere.',
    accommodationNote: 'Loloata Island Resort offers bungalows on the island itself, from around K450/night.',
    reviews: [
      { id: 'r3', author: 'Jason P.', stars: 4, when: '3 months ago', text: 'Quiet and relaxing, a short boat ride from town. Snorkeling was the highlight.' },
    ],
  },
];