import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { LockKeyhole, LogOut, Mail, Save, ShieldCheck, UserRound } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
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
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { getUserProfile, updateUserPassword, updateUserProfile } from '@/lib/profile';
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
      .then((profile) => resetProfile({ email: profile.email, name: profile.name }))
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
            <Text style={styles.avatarText}>{initials}</Text>
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
    paddingBottom: 46,
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
    borderRadius: layout.radius,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
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
  form: { gap: 17, marginTop: 20 },
  signOutArea: { marginTop: 18 },
});
