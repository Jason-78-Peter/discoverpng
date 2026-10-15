import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function AddReviewScreen() {
  const { placeId, placeName, reviewId, rating: ratingParam, comment: commentParam } = useLocalSearchParams<{
    placeId: string;
    placeName: string;
    reviewId?: string;
    rating?: string;
    comment?: string;
  }>();
  const router = useRouter();
  const isEditing = !!reviewId;

  const [rating, setRating] = useState(ratingParam ? Number(ratingParam) : 4);
  const [reviewText, setReviewText] = useState(commentParam ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleBack() {
    if (isEditing) {
      router.replace('/profile');
    } else {
      router.back();
    }
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library permission is needed to attach a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function uploadPhoto(userId: string): Promise<string | null> {
    if (!photoUri) return null;
    const base64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const fileExt = photoUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const filePath = `${userId}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('review-photos')
      .upload(filePath, decode(base64), { contentType: `image/${fileExt}` });
    if (uploadError) {
      throw new Error(uploadError.message);
    }
    const { data } = supabase.storage.from('review-photos').getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handlePost() {
    if (!reviewText.trim()) {
      setError('Please write a few words about your visit.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError('You need to be signed in to post a review.');
      setSubmitting(false);
      return;
    }

    let photoUrl: string | null = null;
    try {
      photoUrl = await uploadPhoto(userData.user.id);
    } catch (uploadErr) {
      setError(uploadErr instanceof Error ? uploadErr.message : 'Could not upload photo.');
      setSubmitting(false);
      return;
    }

    if (isEditing) {
      const updatePayload: { rating: number; comment: string; photo_url?: string } = {
        rating,
        comment: reviewText.trim(),
      };
      if (photoUrl) updatePayload.photo_url = photoUrl;

      const { error: updateError } = await supabase.from('reviews').update(updatePayload).eq('id', reviewId);
      setSubmitting(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.replace('/profile');
      return;
    }

    const authorName = (userData.user.user_metadata?.full_name as string | undefined) ?? 'DiscoverPNG user';
    const { error: insertError } = await supabase.from('reviews').insert({
      place_id: placeId,
      user_id: userData.user.id,
      rating,
      comment: reviewText.trim(),
      author_name: authorName,
      photo_url: photoUrl,
    });
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <View style={styles.headerTextBlock}>
          <Text style={styles.title}>{isEditing ? 'Edit your review' : 'Write a review'}</Text>
          <Text style={styles.subtitle}>{placeName}</Text>
        </View>
      </View>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable key={value} onPress={() => setRating(value)}>
            <Text style={[styles.star, value <= rating ? styles.starFilled : styles.starEmpty]}>★</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.textInput}
        placeholder="Share a few words about your visit..."
        placeholderTextColor={colors.textSecondary}
        value={reviewText}
        onChangeText={setReviewText}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      <Pressable style={styles.photoPicker} onPress={pickImage}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>Tap to attach a photo</Text>
          </View>
        )}
      </Pressable>
      {photoUri ? (
        <Pressable onPress={() => setPhotoUri(null)}>
          <Text style={styles.removePhotoText}>Remove photo</Text>
        </Pressable>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable style={styles.submitButton} onPress={handlePost} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>{isEditing ? 'Save Changes' : 'Post Review'}</Text>
        )}
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
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  backArrow: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  headerTextBlock: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  star: {
    fontSize: 32,
  },
  starFilled: {
    color: colors.accent,
  },
  starEmpty: {
    color: colors.placeholderBorder,
  },
  textInput: {
    minHeight: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    fontSize: 14,
    color: colors.textPrimary,
  },
  photoPicker: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 10,
  },
  photoPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.placeholderBorder,
    backgroundColor: colors.placeholderFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  removePhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.destructive,
    marginTop: -10,
  },
  errorText: {
    fontSize: 13,
    color: colors.destructive,
  },
  submitButton: {
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    marginTop: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});