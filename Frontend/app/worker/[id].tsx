import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Modal,
  Image,
  Pressable,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  getWorkerById,
  type Worker,
} from '@/api/adminWorker';

import { useColors } from '@/hooks/useColors';

export default function AdminWorkerProfileScreen() {
  const colors = useColors();
  const styles = createStyles(colors);

  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const [worker, setWorker] =
    useState<Worker | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const loadWorker =
    useCallback(async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError('');

        const data =
          await getWorkerById(id);

        setWorker(data);
      } catch (err) {
        console.error(
          'Worker profile error:',
          err
        );

        setError(
          'Unable to load worker profile.'
        );
      } finally {
        setLoading(false);
      }
    }, [id]);

  useEffect(() => {
    loadWorker();
  }, [loadWorker]);

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safe}
      >
        <View
          style={styles.loading}
        >
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text
            style={styles.loadingText}
          >
            Loading worker profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !worker) {
    return (
      <SafeAreaView
        style={styles.safe}
      >
        <View
          style={styles.errorContainer}
        >
          <Feather
            name="alert-circle"
            size={40}
            color={
              colors.destructive
            }
          />

          <Text
            style={styles.errorTitle}
          >
            Worker Not Found
          </Text>

          <Text
            style={styles.errorText}
          >
            {error ||
              'This worker profile could not be found.'}
          </Text>

          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text
              style={
                styles.backButtonText
              }
            >
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const profile =
    worker.workerProfile;

  const initials =
    worker.name
      .split(' ')
      .filter(Boolean)
      .map(
        (part) => part[0]
      )
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <SafeAreaView
      style={styles.safe}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >

        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backIcon}
          >
            <Feather
              name="arrow-left"
              size={21}
              color="#fff"
            />
          </Pressable>

          <Text
            style={styles.headerTitle}
          >
            Worker Profile
          </Text>

          <View
            style={styles.headerSpacer}
          />
        </View>

        {/* PROFILE CARD */}
        <View
          style={styles.profileCard}
        >
          {worker.profileImage ? (
            <Image
              source={{
                uri: worker.profileImage,
              }}
              style={
                styles.profileImage
              }
            />
          ) : (
            <View
              style={styles.profileAvatar}
            >
              <Text
                style={
                  styles.profileAvatarText
                }
              >
                {initials}
              </Text>
            </View>
          )}

          <Text
            style={styles.name}
          >
            {worker.name}
          </Text>

          <View
            style={styles.workerLabel}
          >
            <Feather
              name="tool"
              size={13}
              color={colors.primary}
            />

            <Text
              style={
                styles.workerLabelText
              }
            >
              Service Worker
            </Text>
          </View>

          {/* STATUS */}
          <View
            style={styles.statusRow}
          >
            <StatusBadge
              label={
                worker.approved
                  ? 'Approved'
                  : 'Pending Approval'
              }
              color={
                worker.approved
                  ? colors.success
                  : colors.accent
              }
              background={
                worker.approved
                  ? `${colors.success}18`
                  : `${colors.accent}18`
              }
            />

            <StatusBadge
              label={
                worker.isActive
                  ? 'Active'
                  : 'Inactive'
              }
              color={
                worker.isActive
                  ? colors.success
                  : colors.mutedForeground
              }
              background={
                worker.isActive
                  ? `${colors.success}18`
                  : `${colors.muted}20`
              }
            />

            {profile?.verified && (
              <StatusBadge
                label="Verified"
                color={
                  colors.primary
                }
                background={`${colors.primary}18`}
              />
            )}
          </View>
        </View>

        {/* CONTACT */}
        <Section title="Contact Information">
          <InfoRow
            icon="mail"
            label="Email"
            value={worker.email}
            colors={colors}
          />

          <InfoRow
            icon="phone"
            label="Phone"
            value={worker.phone}
            colors={colors}
          />

          <InfoRow
            icon="calendar"
            label="Registered"
            value={formatDate(
              worker.createdAt
            )}
            colors={colors}
          />
        </Section>

        {/* ADDRESS */}
        <Section title="Address">
          <InfoRow
            icon="map-pin"
            label="Area"
            value={
              worker.address?.area ||
              'Not provided'
            }
            colors={colors}
          />

          <InfoRow
            icon="home"
            label="Street"
            value={
              worker.address?.street ||
              'Not provided'
            }
            colors={colors}
          />

          <InfoRow
            icon="map"
            label="City"
            value={
              worker.address?.city ||
              'Not provided'
            }
            colors={colors}
          />
        </Section>

        {/* PROFESSIONS */}
        <Section title="Professional Information">

          <View
            style={styles.field}
          >
            <Text
              style={styles.fieldLabel}
            >
              Professions
            </Text>

            <View
              style={styles.skills}
            >
              {profile?.skills?.length ? (
                profile.skills.map(
                  (skill) => (
                    <View
                      key={skill}
                      style={
                        styles.skillBadge
                      }
                    >
                      <Text
                        style={
                          styles.skillText
                        }
                      >
                        {skill}
                      </Text>
                    </View>
                  )
                )
              ) : (
                <Text
                  style={
                    styles.mutedText
                  }
                >
                  No professions added
                </Text>
              )}
            </View>
          </View>

          <InfoRow
            icon="clock"
            label="Experience"
            value={`${profile?.experience ?? 0} years`}
            colors={colors}
          />

          <InfoRow
            icon="dollar-sign"
            label="Hourly Rate"
            value={
              profile?.hourlyRate != null
                ? `Rs. ${profile.hourlyRate}`
                : 'Not provided'
            }
            colors={colors}
          />

          <InfoRow
            icon="activity"
            label="Availability"
            value={
              profile?.availability ||
              'offline'
            }
            colors={colors}
          />
        </Section>

        {/* PERFORMANCE */}
        <Section title="Performance">

          <View
            style={styles.metrics}
          >
            <Metric
              icon="star"
              value={(
                profile?.rating ??
                0
              ).toFixed(1)}
              label="Rating"
              colors={colors}
            />

            <Metric
              icon="message-circle"
              value={String(
                profile?.totalReviews ??
                  0
              )}
              label="Reviews"
              colors={colors}
            />

            <Metric
              icon="check-circle"
              value={String(
                profile?.completedJobs ??
                  0
              )}
              label="Completed"
              colors={colors}
            />
          </View>
        </Section>

        {/* BIO */}
        <Section title="About Worker">
          <Text
            style={styles.bio}
          >
            {profile?.bio?.trim() ||
              'No biography has been provided by this worker.'}
          </Text>
        </Section>

        {/* VERIFICATION */}
        <Section title="Verification">

          <VerificationRow
            label="Profile Approved"
            verified={
              worker.approved
            }
            colors={colors}
          />

          <VerificationRow
            label="Worker Verified"
            verified={
              profile?.verified === true
            }
            colors={colors}
          />

          <VerificationRow
            label="Email Verified"
            verified={
              worker.isEmailVerified ===
              true
            }
            colors={colors}
          />

          <VerificationRow
            label="Phone Verified"
            verified={
              worker.isPhoneVerified ===
              true
            }
            colors={colors}
          />

          <InfoRow
            icon="credit-card"
            label="CNIC"
            value={
              profile?.cnic ||
              'Not provided'
            }
            colors={colors}
          />

        </Section>

        {/* RATINGS */}
        {profile?.ratingsReceived &&
          profile.ratingsReceived
            .length > 0 && (
            <Section title="Recent Reviews">

              {profile.ratingsReceived
                .slice(0, 5)
                .map(
                  (
                    review,
                    index
                  ) => (
                    <View
                      key={`${review.createdAt}-${index}`}
                      style={
                        styles.reviewCard
                      }
                    >
                      <View
                        style={
                          styles.reviewTop
                        }
                      >
                        <View
                          style={
                            styles.reviewRating
                          }
                        >
                          <Feather
                            name="star"
                            size={14}
                            color={
                              colors.accent
                            }
                          />

                          <Text
                            style={
                              styles.reviewRatingText
                            }
                          >
                            {review.rating}
                          </Text>
                        </View>

                        {review.createdAt && (
                          <Text
                            style={
                              styles.reviewDate
                            }
                          >
                            {formatDate(
                              review.createdAt
                            )}
                          </Text>
                        )}
                      </View>

                      <Text
                        style={
                          styles.reviewComment
                        }
                      >
                        {review.comment ||
                          'No comment provided.'}
                      </Text>
                    </View>
                  )
                )}

            </Section>
          )}
        {/* CNIC DETAILS */}
        <Section title="CNIC Details">
          <InfoRow
            icon="credit-card"
            label="CNIC Number"
            value={worker.workerProfile?.cnic || 'Not provided'}
            colors={colors}
          />
          <View style={{ marginTop: 12, flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: 8, fontFamily: 'Inter_500Medium' }}>Front</Text>
              {worker.workerProfile?.cnicFront ? (
                <TouchableOpacity onPress={() => setViewingImage(worker.workerProfile?.cnicFront ?? null)}>
                  <Image source={{ uri: worker.workerProfile.cnicFront }} style={{ width: '100%', height: 120, borderRadius: 8 }} resizeMode="cover" />
                </TouchableOpacity>
              ) : (
                <View style={{ height: 120, borderRadius: 8, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>No image</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: 8, fontFamily: 'Inter_500Medium' }}>Back</Text>
              {worker.workerProfile?.cnicBack ? (
                <TouchableOpacity onPress={() => setViewingImage(worker.workerProfile?.cnicBack ?? null)}>
                  <Image source={{ uri: worker.workerProfile.cnicBack }} style={{ width: '100%', height: 120, borderRadius: 8 }} resizeMode="cover" />
                </TouchableOpacity>
              ) : (
                <View style={{ height: 120, borderRadius: 8, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>No image</Text>
                </View>
              )}
            </View>
          </View>
        </Section>

        {/* ACCOUNT DETAILS */}
        <Section title="Account Details">
          <InfoRow
            icon="user"
            label="User ID"
            value={worker._id}
            colors={colors}
          />

          <InfoRow
            icon="calendar"
            label="Created"
            value={formatDate(
              worker.createdAt
            )}
            colors={colors}
          />

          <InfoRow
            icon="refresh-cw"
            label="Last Updated"
            value={formatDate(
              worker.updatedAt
            )}
            colors={colors}
          />
        </Section>

        <View
          style={styles.bottomSpace}
        />

      </ScrollView>
      <Modal visible={!!viewingImage} transparent={true} animationType="fade" onRequestClose={() => setViewingImage(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }} onPress={() => setViewingImage(null)}>
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
          {viewingImage && (
            <Image source={{ uri: viewingImage }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={sectionStyles.container}
    >
      <Text
        style={sectionStyles.title}
      >
        {title}
      </Text>

      <View
        style={sectionStyles.card}
      >
        {children}
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<
    typeof useColors
  >;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 9,
      }}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          backgroundColor:
            `${colors.primary}10`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather
          name={icon}
          size={15}
          color={colors.primary}
        />
      </View>

      <View
        style={{
          flex: 1,
          marginLeft: 10,
        }}
      >
        <Text
          style={{
            fontFamily:
              'Inter_400Regular',
            fontSize: 10,
            color:
              colors.mutedForeground,
          }}
        >
          {label}
        </Text>

        <Text
          style={{
            marginTop: 2,
            fontFamily:
              'Inter_500Medium',
            fontSize: 13,
            color:
              colors.foreground,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function Metric({
  icon,
  value,
  label,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  value: string;
  label: string;
  colors: ReturnType<
    typeof useColors
  >;
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: 13,
        backgroundColor:
          colors.background,
        borderRadius: 10,
      }}
    >
      <Feather
        name={icon}
        size={17}
        color={
          icon === 'star'
            ? colors.accent
            : colors.primary
        }
      />

      <Text
        style={{
          marginTop: 5,
          fontFamily:
            'Inter_700Bold',
          fontSize: 18,
          color:
            colors.foreground,
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          marginTop: 2,
          fontFamily:
            'Inter_400Regular',
          fontSize: 10,
          color:
            colors.mutedForeground,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function StatusBadge({
  label,
  color,
  background,
}: {
  label: string;
  color: string;
  background: string;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 7,
        backgroundColor: background,
      }}
    >
      <Text
        style={{
          fontFamily:
            'Inter_500Medium',
          fontSize: 10,
          color,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function VerificationRow({
  label,
  verified,
  colors,
}: {
  label: string;
  verified: boolean;
  colors: ReturnType<
    typeof useColors
  >;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 9,
      }}
    >
      <Feather
        name={
          verified
            ? 'check-circle'
            : 'x-circle'
        }
        size={18}
        color={
          verified
            ? colors.success
            : colors.muted
        }
      />

      <Text
        style={{
          flex: 1,
          marginLeft: 9,
          fontFamily:
            'Inter_500Medium',
          fontSize: 13,
          color:
            colors.foreground,
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          fontFamily:
            'Inter_500Medium',
          fontSize: 11,
          color:
            verified
              ? colors.success
              : colors.mutedForeground,
        }}
      >
        {verified
          ? 'Verified'
          : 'Not verified'}
      </Text>
    </View>
  );
}

function formatDate(
  value?: string
) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleDateString(
    undefined,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  );
}

const sectionStyles =
  StyleSheet.create({
    container: {
      marginTop: 18,
    },

    title: {
      fontFamily:
        'Inter_600SemiBold',
      fontSize: 15,
      marginBottom: 8,
      color: '#333',
    },

    card: {
      backgroundColor: '#fff',
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
  });

const createStyles = (
  colors: ReturnType<typeof useColors>
) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    content: {
      paddingBottom: 30,
    },

    header: {
      height: 65,
      backgroundColor:
        colors.navy,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      paddingHorizontal: 18,
    },

    backIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        'rgba(255,255,255,.12)',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    headerTitle: {
      color: '#fff',
      fontFamily:
        'Inter_700Bold',
      fontSize: 18,
    },

    headerSpacer: {
      width: 40,
    },

    profileCard: {
      margin: 18,
      padding: 20,
      backgroundColor:
        colors.card,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 16,
      alignItems: 'center',
    },

    profileAvatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor:
        colors.primary,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    profileAvatarText: {
      color: '#fff',
      fontFamily:
        'Inter_700Bold',
      fontSize: 25,
    },

    profileImage: {
      width: 88,
      height: 88,
      borderRadius: 44,
    },

    name: {
      marginTop: 12,
      color:
        colors.foreground,
      fontFamily:
        'Inter_700Bold',
      fontSize: 21,
      textAlign: 'center',
    },

    workerLabel: {
      marginTop: 5,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    workerLabelText: {
      color:
        colors.primary,
      fontFamily:
        'Inter_500Medium',
      fontSize: 12,
    },

    statusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent:
        'center',
      gap: 7,
      marginTop: 13,
    },

    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    loadingText: {
      marginTop: 12,
      color:
        colors.mutedForeground,
      fontFamily:
        'Inter_400Regular',
      fontSize: 13,
    },

    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 30,
    },

    errorTitle: {
      marginTop: 12,
      color:
        colors.foreground,
      fontFamily:
        'Inter_700Bold',
      fontSize: 18,
    },

    errorText: {
      marginTop: 6,
      textAlign: 'center',
      color:
        colors.mutedForeground,
      fontFamily:
        'Inter_400Regular',
      fontSize: 13,
    },

    backButton: {
      marginTop: 18,
      backgroundColor:
        colors.primary,
      paddingHorizontal: 22,
      paddingVertical: 11,
      borderRadius: 9,
    },

    backButtonText: {
      color: '#fff',
      fontFamily:
        'Inter_600SemiBold',
      fontSize: 13,
    },

    field: {
      paddingVertical: 8,
    },

    fieldLabel: {
      fontFamily:
        'Inter_500Medium',
      fontSize: 11,
      color:
        colors.mutedForeground,
      marginBottom: 8,
    },

    skills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },

    skillBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 7,
      backgroundColor:
        `${colors.primary}12`,
    },

    skillText: {
      color:
        colors.primary,
      fontFamily:
        'Inter_500Medium',
      fontSize: 11,
    },

    mutedText: {
      color:
        colors.mutedForeground,
      fontFamily:
        'Inter_400Regular',
      fontSize: 12,
    },

    metrics: {
      flexDirection: 'row',
      gap: 8,
    },

    bio: {
      color:
        colors.foreground,
      fontFamily:
        'Inter_400Regular',
      fontSize: 13,
      lineHeight: 20,
    },

    reviewCard: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.border,
    },

    reviewTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    reviewRating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    reviewRatingText: {
      color:
        colors.foreground,
      fontFamily:
        'Inter_600SemiBold',
      fontSize: 12,
    },

    reviewDate: {
      color:
        colors.mutedForeground,
      fontFamily:
        'Inter_400Regular',
      fontSize: 10,
    },

    reviewComment: {
      marginTop: 5,
      color:
        colors.mutedForeground,
      fontFamily:
        'Inter_400Regular',
      fontSize: 12,
      lineHeight: 18,
    },

    bottomSpace: {
      height: 30,
    },
  });
