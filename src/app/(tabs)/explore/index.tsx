// Explore screen — reads real places from Supabase, with the last-fetched
// list cached locally via AsyncStorage so the screen isn't blank if a
// future load fails (poor connection / offline).

import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Place = {
  id: string;
  name: string;
  region: string;
  category: string;
  image_url: string | null;
};

const CATEGORIES = ['All', 'Nature', 'Culture', 'Trekking', 'Island'];

const CATEGORY_TO_DB = {
  Nature: 'nature',
  Culture: 'culture',
  Trekking: 'trekking',
  Island: 'island',
} as const;

const PLACES_CACHE_KEY = 'discoverpng_places_cache';

export default function ExploreScreen() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showingCached, setShowingCached] = useState(false);

  useEffect(() => {
    fetchPlaces();
  }, []);

  async function fetchPlaces() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('places')
      .select('id, name, region, category, image_url')
      .order('name');

    if (error) {
      // Live fetch failed — fall back to the last-cached list if we have one,
      // so a poor connection shows real (if slightly old) data, not a blank screen.
      try {
        const cached = await AsyncStorage.getItem(PLACES_CACHE_KEY);
        if (cached) {
          setPlaces(JSON.parse(cached));
          setShowingCached(true);
          setLoading(false);
          return;
        }
      } catch {
        // No usable cache either — fall through to the normal error state.
      }
      setError('Could not load places. Try again.');
      setLoading(false);
      return;
    }

    setPlaces(data ?? []);
    setShowingCached(false);
    setLoading(false);
    AsyncStorage.setItem(PLACES_CACHE_KEY, JSON.stringify(data ?? [])).catch(() => {
      // Caching is a nice-to-have; a failed write shouldn't break the screen.
    });
  }

  const visiblePlaces =
    activeCategory === 'All'
      ? places
      : places.filter(
          (p) => p.category === CATEGORY_TO_DB[activeCategory as keyof typeof CATEGORY_TO_DB]
        );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Discover PNG</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={{ gap: 8 }}
      >
        {CATEGORIES.map((category) => {
          const active = category === activeCategory;
          return (
            <Pressable
              key={category}
              onPress={() => setActiveCategory(category)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {showingCached ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            Showing previously loaded places — you may be offline.
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={fetchPlaces} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {visiblePlaces.map((place) => (
            <Link key={place.id} href={`/explore/${place.id}`} asChild>
              <Pressable style={styles.card}>
                {place.image_url ? (
                  <Image source={{ uri: place.image_url }} style={styles.cardImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>Photo</Text>
                  </View>
                )}
                <View style={styles.cardRow}>
                  <View>
                    <Text style={styles.cardTitle}>{place.name}</Text>
                    <Text style={styles.cardLoc}>{place.region}</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      {place.category.charAt(0).toUpperCase() + place.category.slice(1)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  chipRow: { paddingHorizontal: 20, marginBottom: 14, flexGrow: 0 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#E4E7EE' },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  chipTextActive: { color: '#FFFFFF' },
  offlineBanner: { marginHorizontal: 20, marginBottom: 10, backgroundColor: colors.tagBackground, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  offlineBannerText: { fontSize: 12, color: colors.tagText, fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 60 },
  errorText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
  retryButton: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  retryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
  card: { gap: 8 },
  cardImage: { width: '100%', aspectRatio: 16 / 10, borderRadius: 10, backgroundColor: colors.placeholderFill },
  imagePlaceholder: { width: '100%', aspectRatio: 16 / 10, backgroundColor: colors.placeholderFill, borderWidth: 1, borderColor: colors.placeholderBorder, borderStyle: 'dashed', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { fontSize: 12, color: colors.textSecondary },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  cardLoc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  tag: { backgroundColor: colors.tagBackground, paddingVertical: 4, paddingHorizontal: 9, borderRadius: 12 },
  tagText: { fontSize: 11, fontWeight: '700', color: colors.tagText },
});