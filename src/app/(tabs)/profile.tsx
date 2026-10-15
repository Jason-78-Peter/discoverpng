import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Review = {
  id: string;
  place_id: string;
  rating: number;
  comment: string;
  created_at: string;
  places: { name: string } | null;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError('Could not load your profile.');
      setLoading(false);
      return;
    }

    const fullName = (userData.user.user_metadata?.full_name as string | undefined) ?? 'DiscoverPNG user';
    setName(fullName);
    setEmail(userData.user.email ?? '');

    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('id, place_id, rating, comment, created_at, places(name)')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      setError('Could not load your reviews.');
    } else {
      setReviews((reviewsData as unknown as Review[]) ?? []);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  function handleEdit(review: Review) {
    router.push({
      pathname: '/explore/add-review',
      params: {
        placeId: review.place_id,
        placeName: review.places?.name ?? '',
        reviewId: review.id,
        rating: String(review.rating),
        comment: review.comment,
      },
    });
  }

  function handleDelete(reviewId: string) {
    Alert.alert(
      'Delete review?',
      'This will permanently remove your review. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error: deleteError } = await supabase.from('reviews').delete().eq('id', reviewId);
            if (deleteError) {
              Alert.alert('Could not delete review', deleteError.message);
              return;
            }
            fetchProfile();
          },
        },
      ]
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <Text style={styles.sectionTitle}>My Reviews</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      ) : error ? (
        <View>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={fetchProfile} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : reviews.length === 0 ? (
        <Text style={styles.emptyText}>You haven&apos;t written any reviews yet.</Text>
      ) : (
        reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <Text style={styles.reviewPlace}>{review.places?.name ?? 'Unknown place'}</Text>
            <Text style={styles.reviewStars}>
              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
            </Text>
            <Text style={styles.reviewDate}>
              {new Date(review.created_at).toLocaleDateString()}
            </Text>
            <Text style={styles.reviewText}>{review.comment}</Text>
            <View style={styles.reviewActions}>
              <Pressable onPress={() => handleEdit(review)} style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => handleDelete(review.id)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
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
  header: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 8,
  },
  email: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 13,
    color: colors.destructive,
  },
  retryButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 4,
  },
  reviewPlace: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reviewStars: {
    fontSize: 13,
    color: colors.accent,
  },
  reviewDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  reviewText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 19,
    marginTop: 2,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  editButton: {
    paddingVertical: 4,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  deleteButton: {
    paddingVertical: 4,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.destructive,
  },
  logoutButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.destructive,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.destructive,
    fontSize: 15,
    fontWeight: '700',
  },
});