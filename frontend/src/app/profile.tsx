import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  ImagePlus,
  LockKeyhole,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { z } from 'zod';

import { AppButton } from '@/components/app-button';
import { FormField } from '@/components/form-field';
import { ScreenHeader } from '@/components/screen-header';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { colors, layout } from '@/constants/theme';
import { resolveApiAssetUrl } from '@/lib/api';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import {
  getUserProfile,
  removeUserProfilePhoto,
  updateUserPassword,
  updateUserProfile,
  updateUserProfilePhoto,
} from '@/lib/profile';
import { useAuth } from '@/providers/auth-provider';

const profileSchema = z.object({
  email: z.string(),
  name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(50, 'Nama maksimal 50 karakter'),
});

const passwordSchema = z
  .object({
    confirmPassword: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
    password: z.string().min(8, 'Gunakan minimal 8 karakter'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Kata sandi tidak sama',
    path: ['confirmPassword'],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfileScreen() {
  const router = useRouter();
  const { loading: authLoading, refreshSession, session, signOut } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileValues>({
    defaultValues: { email: '', name: '' },
    resolver: zodResolver(profileSchema),
  });
  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm<PasswordValues>({
    defaultValues: { confirmPassword: '', password: '' },
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (!authLoading && !session) router.replace('/welcome');
  }, [authLoading, router, session]);

  useEffect(() => {
    if (!session) return;
    getUserProfile()
      .then((profile) => {
        resetProfile({ email: profile.email, name: profile.name });
        setPhotoUrl(profile.photoUrl);
      })
      .catch((error) => Alert.alert('Profil belum dapat dimuat', getAuthErrorMessage(error)))
      .finally(() => setProfileLoading(false));
  }, [resetProfile, session]);

  const saveProfile = async (values: ProfileValues) => {
    try {
      await updateUserProfile(values.name);
      await refreshSession();
      Alert.alert('Profil tersimpan', 'Nama akun DuiTrack berhasil diperbarui.');
    } catch (error) {
      Alert.alert('Profil gagal disimpan', getAuthErrorMessage(error));
    }
  };

  const savePassword = async (values: PasswordValues) => {
    try {
      await updateUserPassword(values.password);
      resetPassword();
      Alert.alert('Kata sandi diperbarui', 'Gunakan kata sandi baru saat masuk berikutnya.');
    } catch (error) {
      Alert.alert('Kata sandi gagal diperbarui', getAuthErrorMessage(error));
    }
  };

  const chooseProfilePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Izin diperlukan', 'Izinkan akses galeri untuk memilih foto profil.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ['images'],
        quality: 0.7,
      });

      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
        Alert.alert('Foto terlalu besar', 'Gunakan foto berukuran maksimal 2 MB.');
        return;
      }

      setPhotoSaving(true);
      const profile = await updateUserProfilePhoto(asset);
      setPhotoUrl(profile.photoUrl);
      await refreshSession();
      Alert.alert('Foto tersimpan', 'Foto profil berhasil diperbarui.');
    } catch (error) {
      Alert.alert('Foto gagal disimpan', getAuthErrorMessage(error));
    } finally {
      setPhotoSaving(false);
    }
  };

  const removeProfilePhoto = async () => {
    try {
      setPhotoSaving(true);
      const profile = await removeUserProfilePhoto();
      setPhotoUrl(profile.photoUrl);
      await refreshSession();
    } catch (error) {
      Alert.alert('Foto gagal dihapus', getAuthErrorMessage(error));
    } finally {
      setPhotoSaving(false);
    }
  };

  const confirmRemovePhoto = () => {
    const message = 'Inisial nama akan digunakan kembali sebagai foto profil.';

    if (Platform.OS === 'web') {
      if (window.confirm(`Hapus foto profil?\n\n${message}`)) {
        void removeProfilePhoto();
      }
      return;
    }

    Alert.alert('Hapus foto profil?', message, [
      { style: 'cancel', text: 'Batal' },
      { onPress: () => void removeProfilePhoto(), style: 'destructive', text: 'Hapus' },
    ]);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/welcome');
    } catch (error) {
      Alert.alert('Gagal keluar', getAuthErrorMessage(error));
    }
  };

  if (authLoading || !session || profileLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const metadataName = session.user.user_metadata.full_name;
  const displayPhotoUrl = resolveApiAssetUrl(photoUrl);
  const initials =
    typeof metadataName === 'string' && metadataName.trim()
      ? metadataName
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part: string) => part[0])
          .join('')
          .toUpperCase()
      : 'DT';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          backHref="/dashboard"
          subtitle="Kelola identitas dan keamanan akun"
          title="Profil & pengaturan"
        />

        <View style={styles.identityBand}>
          <View style={styles.avatar}>
            {displayPhotoUrl ? (
              <Image source={{ uri: displayPhotoUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.identityName}>
              {typeof metadataName === 'string' ? metadataName : 'Pengguna DuiTrack'}
            </Text>
            <Text style={styles.identityEmail}>{session.user.email}</Text>
          </View>
          <ShieldCheck color={colors.primary} size={24} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi akun</Text>
          <Text style={styles.sectionSubtitle}>Nama ini digunakan pada sapaan dashboard.</Text>
          <View style={styles.photoEditor}>
            <View style={styles.photoPreview}>
              {displayPhotoUrl ? (
                <Image source={{ uri: displayPhotoUrl }} style={styles.photoPreviewImage} />
              ) : (
                <Text style={styles.photoPreviewText}>{initials}</Text>
              )}
            </View>
            <View style={styles.photoCopy}>
              <Text style={styles.photoTitle}>Foto profil</Text>
              <Text style={styles.photoHint}>JPG, PNG, atau WebP. Maksimal 2 MB.</Text>
              <View style={styles.photoActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={photoSaving}
                  onPress={() => void chooseProfilePhoto()}
                  style={({ pressed }) => [
                    styles.photoButton,
                    pressed && styles.pressed,
                    photoSaving && styles.disabled,
                  ]}>
                  {photoSaving ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <ImagePlus color={colors.primary} size={17} />
                  )}
                  <Text style={styles.photoButtonText}>{photoUrl ? 'Ganti foto' : 'Pilih foto'}</Text>
                </Pressable>
                {photoUrl ? (
                  <Pressable
                    accessibilityLabel="Hapus foto profil"
                    accessibilityRole="button"
                    disabled={photoSaving}
                    onPress={confirmRemovePhoto}
                    style={({ pressed }) => [
                      styles.removePhotoButton,
                      pressed && styles.pressed,
                      photoSaving && styles.disabled,
                    ]}>
                    <Trash2 color={colors.coral} size={17} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
          <View style={styles.form}>
            <Controller
              control={profileControl}
              name="name"
              render={({ field: { onBlur, onChange, value } }) => (
                <FormField
                  autoCapitalize="words"
                  error={profileErrors.name?.message}
                  icon={UserRound}
                  label="Nama lengkap"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Nama lengkap"
                  value={value}
                />
              )}
            />
            <Controller
              control={profileControl}
              name="email"
              render={({ field: { value } }) => (
                <FormField
                  editable={false}
                  icon={Mail}
                  label="Email"
                  placeholder="Email akun"
                  value={value}
                />
              )}
            />
            <AppButton
              icon={Save}
              label="Simpan profil"
              loading={profileSubmitting}
              onPress={handleProfileSubmit(saveProfile)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubah kata sandi</Text>
          <Text style={styles.sectionSubtitle}>Gunakan minimal 8 karakter.</Text>
          <View style={styles.form}>
            <Controller
              control={passwordControl}
              name="password"
              render={({ field: { onBlur, onChange, value } }) => (
                <FormField
                  autoCapitalize="none"
                  error={passwordErrors.password?.message}
                  icon={LockKeyhole}
                  label="Kata sandi baru"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Minimal 8 karakter"
                  secureTextEntry
                  value={value}
                />
              )}
            />
            <Controller
              control={passwordControl}
              name="confirmPassword"
              render={({ field: { onBlur, onChange, value } }) => (
                <FormField
                  autoCapitalize="none"
                  error={passwordErrors.confirmPassword?.message}
                  icon={LockKeyhole}
                  label="Ulangi kata sandi baru"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Ketik ulang kata sandi"
                  secureTextEntry
                  value={value}
                />
              )}
            />
            <AppButton
              icon={ShieldCheck}
              label="Perbarui kata sandi"
              loading={passwordSubmitting}
              onPress={handlePasswordSubmit(savePassword)}
              variant="secondary"
            />
          </View>
        </View>

        <View style={styles.signOutArea}>
          <AppButton icon={LogOut} label="Keluar dari akun" onPress={() => void handleSignOut()} variant="secondary" />
        </View>
        </ScrollView>
        <AppBottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.canvas, flex: 1 },
  screen: { flex: 1 },
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: colors.canvas,
    flex: 1,
    justifyContent: 'center',
  },
  page: {
    alignSelf: 'center',
    maxWidth: 760,
    paddingBottom: 120,
    paddingHorizontal: 20,
    width: '100%',
  },
  identityBand: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: layout.radius,
    flexDirection: 'row',
    gap: 13,
    marginTop: 22,
    padding: 16,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 48,
  },
  avatarImage: { height: '100%', width: '100%' },
  avatarText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  identityCopy: { flex: 1, minWidth: 0 },
  identityName: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  identityEmail: { color: colors.muted, fontSize: 12, marginTop: 4 },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    marginTop: 18,
    padding: 20,
  },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  sectionSubtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  photoEditor: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 14,
    paddingBottom: 18,
    paddingTop: 18,
  },
  photoPreview: {
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 60,
  },
  photoPreviewImage: { height: '100%', width: '100%' },
  photoPreviewText: { color: colors.white, fontSize: 18, fontWeight: '800' },
  photoCopy: { flex: 1, minWidth: 0 },
  photoTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  photoHint: { color: colors.muted, fontSize: 11, marginTop: 3 },
  photoActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  photoButton: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: layout.radius,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  photoButtonText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  removePhotoButton: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: layout.radius,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
  form: { gap: 17, marginTop: 20 },
  signOutArea: { marginTop: 18 },
});
