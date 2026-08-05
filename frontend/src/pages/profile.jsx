import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  ImagePlus,
  LockKeyhole,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  Loader2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { loading: authLoading, refreshSession, session, signOut } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);

  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm({
    defaultValues: { email: '', name: '' },
    resolver: zodResolver(profileSchema),
  });

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm({
    defaultValues: { confirmPassword: '', password: '' },
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (!authLoading && !session) navigate('/welcome', { replace: true });
  }, [authLoading, navigate, session]);

  useEffect(() => {
    if (!session) return;
    getUserProfile()
      .then((profile) => {
        resetProfile({ email: profile.email, name: profile.name });
        setPhotoUrl(profile.photoUrl);
      })
      .catch((error) => alert(getAuthErrorMessage(error)))
      .finally(() => setProfileLoading(false));
  }, [resetProfile, session]);

  const saveProfile = async (values) => {
    try {
      await updateUserProfile(values.name);
      await refreshSession();
      alert('Nama akun DuiTrack berhasil diperbarui.');
    } catch (error) {
      alert(getAuthErrorMessage(error));
    }
  };

  const savePassword = async (values) => {
    try {
      await updateUserPassword(values.password);
      resetPassword();
      alert('Gunakan kata sandi baru saat masuk berikutnya.');
    } catch (error) {
      alert(getAuthErrorMessage(error));
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Gunakan foto berukuran maksimal 2 MB.');
      return;
    }

    try {
      setPhotoSaving(true);
      const profile = await updateUserProfilePhoto(file);
      setPhotoUrl(profile.photoUrl);
      await refreshSession();
      alert('Foto profil berhasil diperbarui.');
    } catch (error) {
      alert(getAuthErrorMessage(error));
    } finally {
      setPhotoSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeProfilePhoto = async () => {
    try {
      setPhotoSaving(true);
      const profile = await removeUserProfilePhoto();
      setPhotoUrl(profile.photoUrl);
      await refreshSession();
    } catch (error) {
      alert(getAuthErrorMessage(error));
    } finally {
      setPhotoSaving(false);
    }
  };

  const confirmRemovePhoto = () => {
    const confirmed = window.confirm(
      'Hapus foto profil?\nInisial nama akan digunakan kembali sebagai foto profil.',
    );
    if (confirmed) {
      void removeProfilePhoto();
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/welcome', { replace: true });
    } catch (error) {
      alert(getAuthErrorMessage(error));
    }
  };

  if (authLoading || !session || profileLoading) {
    return (
      <div style={{ alignItems: 'center', backgroundColor: colors.canvas, display: 'flex', minHeight: '100vh', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" color={colors.primary} size={36} />
      </div>
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
          .map((part) => part[0])
          .join('')
          .toUpperCase()
      : 'DT';

  return (
    <div style={{ backgroundColor: colors.canvas, minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px 120px 20px', boxSizing: 'border-box' }}>
        <ScreenHeader
          backHref="/dashboard"
          subtitle="Kelola identitas dan keamanan akun"
          title="Profil & pengaturan"
        />

        {/* Identity Band */}
        <div
          style={{
            alignItems: 'center',
            backgroundColor: colors.primarySoft,
            borderRadius: layout.radius,
            display: 'flex',
            flexDirection: 'row',
            gap: 13,
            marginTop: 22,
            padding: 16,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              alignItems: 'center',
              backgroundColor: colors.primaryDark,
              borderRadius: 24,
              display: 'flex',
              height: 48,
              justifyContent: 'center',
              overflow: 'hidden',
              width: 48,
              flexShrink: 0,
            }}
          >
            {displayPhotoUrl ? (
              <img src={displayPhotoUrl} alt="Foto Profil" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: colors.white, fontSize: 16, fontWeight: '800' }}>{initials}</span>
            )}
          </div>
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minWidth: 0 }}>
            <span style={{ color: colors.ink, fontSize: 16, fontWeight: '800' }}>
              {typeof metadataName === 'string' ? metadataName : 'Pengguna DuiTrack'}
            </span>
            <span style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{session.user.email}</span>
          </div>
          <ShieldCheck color={colors.primary} size={24} />
        </div>

        {/* Account Info Section */}
        <section
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.line,
            borderRadius: layout.radius,
            borderWidth: 1,
            borderStyle: 'solid',
            marginTop: 18,
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
          <h3 style={{ color: colors.ink, fontSize: 17, fontWeight: '800', margin: 0 }}>Informasi akun</h3>
          <p style={{ color: colors.muted, fontSize: 12, margin: '4px 0 0 0' }}>
            Nama ini digunakan pada sapaan dashboard.
          </p>

          <input
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
            type="file"
          />

          <div
            style={{
              alignItems: 'center',
              borderBottom: `1px solid ${colors.line}`,
              display: 'flex',
              flexDirection: 'row',
              gap: 14,
              paddingBottom: 18,
              paddingTop: 18,
            }}
          >
            <div
              style={{
                alignItems: 'center',
                backgroundColor: colors.primaryDark,
                borderRadius: 30,
                display: 'flex',
                height: 60,
                justifyContent: 'center',
                overflow: 'hidden',
                width: 60,
                flexShrink: 0,
              }}
            >
              {displayPhotoUrl ? (
                <img src={displayPhotoUrl} alt="Foto Profil" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: colors.white, fontSize: 18, fontWeight: '800' }}>{initials}</span>
              )}
            </div>
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minWidth: 0 }}>
              <span style={{ color: colors.ink, fontSize: 14, fontWeight: '800' }}>Foto profil</span>
              <span style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>JPG, PNG, atau WebP. Maksimal 2 MB.</span>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <button
                  disabled={photoSaving}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    alignItems: 'center',
                    borderColor: colors.primary,
                    borderRadius: layout.radius,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    cursor: photoSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 7,
                    height: 36,
                    justifyContent: 'center',
                    padding: '0 12px',
                    backgroundColor: 'transparent',
                  }}
                  type="button"
                >
                  {photoSaving ? (
                    <Loader2 className="animate-spin" color={colors.primary} size={17} />
                  ) : (
                    <ImagePlus color={colors.primary} size={17} />
                  )}
                  <span style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>
                    {photoUrl ? 'Ganti foto' : 'Pilih foto'}
                  </span>
                </button>
                {photoUrl ? (
                  <button
                    aria-label="Hapus foto profil"
                    disabled={photoSaving}
                    onClick={confirmRemovePhoto}
                    style={{
                      alignItems: 'center',
                      borderColor: colors.line,
                      borderRadius: layout.radius,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      cursor: photoSaving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      height: 36,
                      justifyContent: 'center',
                      width: 36,
                      backgroundColor: 'transparent',
                    }}
                    type="button"
                  >
                    <Trash2 color={colors.coral} size={17} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit(saveProfile)} style={{ display: 'flex', flexDirection: 'column', gap: 17, marginTop: 20 }}>
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
              type="submit"
            />
          </form>
        </section>

        {/* Change Password Section */}
        <section
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.line,
            borderRadius: layout.radius,
            borderWidth: 1,
            borderStyle: 'solid',
            marginTop: 18,
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
          <h3 style={{ color: colors.ink, fontSize: 17, fontWeight: '800', margin: 0 }}>Ubah kata sandi</h3>
          <p style={{ color: colors.muted, fontSize: 12, margin: '4px 0 0 0' }}>Gunakan minimal 8 karakter.</p>
          <form onSubmit={handlePasswordSubmit(savePassword)} style={{ display: 'flex', flexDirection: 'column', gap: 17, marginTop: 20 }}>
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
              type="submit"
              variant="secondary"
            />
          </form>
        </section>

        {/* Logout Area */}
        <div style={{ marginTop: 18 }}>
          <AppButton
            icon={LogOut}
            label="Keluar dari akun"
            onClick={() => void handleSignOut()}
            variant="secondary"
          />
        </div>
      </div>
      <AppBottomNav />
    </div>
  );
}
