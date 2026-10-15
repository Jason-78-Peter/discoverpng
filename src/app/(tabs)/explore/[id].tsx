import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Place = {
  id: string;
  name: string;
  region: string;
  category: string;
  description: string;
  accommodation_note: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
};

type Review = {
  id: string;
  author_name: string | null;
  rating: number;
  comment: string;
  photo_url: string | null;
};

type DayForecast = {
  date: string;
  max: number;
  min: number;
  code: number;
};

type Weather = {
  temperature: number;
  code: number;
  forecast: DayForecast[];
};

function describeWeatherCode(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1 || code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Light drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Variable conditions';
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const fetchPlaceAndReviews = useCallback(async (placeId: string) => {
    setLoading(true);
    setError(null);
    const [placeResult, reviewsResult] = await Promise.all([
      supabase.from('places').select('*').eq('id', placeId).single(),
      supabase
        .from('reviews')
        .select('id, author_name, rating, comment, photo_url')
        .eq('place_id', placeId)
        .order('created_at', { ascending: false }),
    ]);
    if (placeResult.error) {
      setError('Could not load this place.');
    } else {
      setPlace(placeResult.data);
      setReviews(reviewsResult.data ?? []);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (id) fetchPlaceAndReviews(id);
    }, [id, fetchPlaceAndReviews])
  );

  useEffect(() => {
    if (!place?.latitude || !place?.longitude) return;

    let cancelled = false;

    async function fetchWeather() {
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place!.latitude}&longitude=${place!.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=4&timezone=auto`
        );
        const data = await response.json();
        if (cancelled) return;

        const forecast: DayForecast[] = (data.daily?.time ?? [])
          .slice(1, 4)
          .map((date: string, i: number) => ({
            date,
            max: data.daily.temperature_2m_max[i + 1],
            min: data.daily.temperature_2m_min[i + 1],
            code: data.daily.weather_code[i + 1],
          }));

        setWeather({
          temperature: data.current.temperature_2m,
          code: data.current.weather_code,
          forecast,
        });
      } catch {
        if (!cancelled) setWeatherError('Could not load live weather.');
      } finally {
        if (!cancelled) setWeatherLoading(false);
      }
    }

    fetchWeather();

    return () => {
      cancelled = true;
    };
  }, [place?.id, place?.latitude, place?.longitude]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !place) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Place not found.'}</Text>
        <Pressable onPress={() => id && fetchPlaceAndReviews(id)} style={styles.retryButton}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const averageStars =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
  <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
</Pressable>
      </View>

      {place.image_url ? (
        <Image source={{ uri: place.image_url }} style={styles.heroImage} />
      ) : (
        <View style={styles.heroPlaceholder}>
          <Text style={styles.heroPlaceholderText}>Photo</Text>
        </View>
      )}

      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{place.name}</Text>
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {place.category.charAt(0).toUpperCase() + place.category.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.region}>{place.region}</Text>
      </View>

      <Text style={styles.description}>{place.description}</Text>

      {place.accommodation_note ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Where to stay</Text>
          <Text style={styles.infoCardText}>{place.accommodation_note}</Text>
        </View>
      ) : null}

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Weather</Text>
        {weatherLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
        ) : weatherError ? (
          <Text style={styles.infoCardText}>{weatherError}</Text>
        ) : weather ? (
          <>
            <Text style={styles.weatherText}>
              {Math.round(weather.temperature)}°C · {describeWeatherCode(weather.code)}
            </Text>
            {weather.forecast.length > 0 ? (
              <View style={styles.forecastRow}>
                {weather.forecast.map((day) => (
                  <View key={day.date} style={styles.forecastChip}>
                    <Text style={styles.forecastDay}>{formatDayLabel(day.date)}</Text>
                    <Text style={styles.forecastCondition}>{describeWeatherCode(day.code)}</Text>
                    <Text style={styles.forecastTemps}>
                      {Math.round(day.max)}° / {Math.round(day.min)}°
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : (
          <Text style={styles.infoCardText}>No coordinates set for this place yet.</Text>
        )}
      </View>

      <View style={styles.reviewsSection}>
        <View style={styles.reviewsHeaderRow}>
          <Text style={styles.reviewsTitle}>
            Reviews{averageStars ? ` · ★${averageStars}` : ''}
          </Text>
          <Link
            href={{ pathname: '/explore/add-review', params: { placeId: place.id, placeName: place.name } }}
            asChild
          >
            <Pressable style={styles.writeReviewButton}>
              <Text style={styles.writeReviewText}>Write a Review</Text>
            </Pressable>
          </Link>
        </View>

        {reviews.length === 0 ? (
          <Text style={styles.emptyText}>No reviews yet.</Text>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <Text style={styles.reviewAuthor}>{review.author_name ?? 'DiscoverPNG user'}</Text>
              <Text style={styles.reviewStars}>
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
              </Text>
              <Text style={styles.reviewText}>{review.comment}</Text>
              {review.photo_url ? (
                <Image source={{ uri: review.photo_url }} style={ styles.reviewPhoto } />
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: colors.destructive,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  headerRow: {
    flexDirection: 'row',
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 12,
    backgroundColor: colors.placeholderFill,
  },
  heroPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: colors.placeholderFill,
    borderWidth: 1,
    borderColor: colors.placeholderBorder,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  titleBlock: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  region: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  tag: {
    backgroundColor: colors.tagBackground,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.tagText,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 4,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoCardText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  weatherText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  forecastRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  forecastChip: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  forecastDay: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  forecastCondition: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  forecastTemps: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
  },
  reviewsSection: {
    gap: 12,
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  writeReviewButton: {
    backgroundColor: colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  writeReviewText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 4,
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reviewStars: {
    fontSize: 13,
    color: colors.accent,
  },
  reviewText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 19,
  },
  reviewPhoto: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 8,
    marginTop: 6,
  },
});