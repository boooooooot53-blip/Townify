import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ImageViewing from 'react-native-image-viewing';

import {
  assignWorker,
  Complaint,
  ComplaintStatus,
  getComplaintById,
  getWorkersForAssignment,
  ComplaintWorker,
  updateComplaintStatus,
} from '@/api/adminComplain';

import { useColors } from '@/hooks/useColors';

export default function AdminComplaintDetailsScreen() {
  const colors = useColors();
  const styles = createStyles(colors);

  const { id } =
    useLocalSearchParams<{ id: string }>();

  const [complaint, setComplaint] =
    useState<Complaint | null>(null);

  const [workers, setWorkers] =
    useState<ComplaintWorker[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [workersLoading, setWorkersLoading] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [workerModalVisible, setWorkerModalVisible] =
    useState(false);

  const [viewerImages, setViewerImages] = useState<{ uri: string }[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);

  const openImageViewer = (images: string[], startIndex: number) => {
    setViewerImages(images.map(uri => ({ uri })));
    setViewerIndex(startIndex);
    setViewerVisible(true);
  };

  async function loadComplaint() {
    if (!id) return;

    try {
      setLoading(true);

      const data =
        await getComplaintById(id);

      setComplaint(data);
    } catch (error) {
      console.error(
        'Failed to load complaint:',
        error
      );

      Alert.alert(
        'Error',
        'Failed to load complaint.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshComplaint() {
    if (!id) return;

    try {
      setRefreshing(true);

      const data =
        await getComplaintById(id);

      setComplaint(data);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadComplaint();
  }, [id]);

  async function openWorkerModal() {
    try {
      setWorkersLoading(true);
      setWorkerModalVisible(true);

      const data =
        await getWorkersForAssignment();

      setWorkers(data);
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Error',
        'Failed to load workers.'
      );

      setWorkerModalVisible(false);
    } finally {
      setWorkersLoading(false);
    }
  }

  async function handleAssignWorker(
    worker: ComplaintWorker
  ) {
    if (!complaint) return;

    try {
      setActionLoading(true);

      const updated =
        await assignWorker(
          complaint._id,
          worker._id
        );

      setComplaint(updated);
      setWorkerModalVisible(false);

      Alert.alert(
        'Success',
        `${worker.name} has been assigned to this complaint.`
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Error',
        'Failed to assign worker.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStatusChange(
    status: ComplaintStatus
  ) {
    if (!complaint) return;

    if (
      status === 'in_progress' &&
      !complaint.assignedTo
    ) {
      Alert.alert(
        'Assign Worker',
        'Please assign a worker before starting this complaint.'
      );
      return;
    }

    if (status === 'resolved') {
      if (!complaint.assignedTo) {
        Alert.alert(
          'Assign Worker',
          'Please assign a worker before resolving this complaint.'
        );
        return;
      }

      Alert.alert(
        'Resolve Complaint',
        'Are you sure you want to mark this complaint as resolved?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Resolve',
            onPress: () =>
              changeStatus('resolved'),
          },
        ]
      );

      return;
    }

    if (status === 'rejected') {
      Alert.alert(
        'Reject Complaint',
        'Are you sure you want to reject this complaint?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: () =>
              changeStatus('rejected'),
          },
        ]
      );

      return;
    }

    changeStatus(status);
  }

  async function changeStatus(
    status: ComplaintStatus
  ) {
    if (!complaint) return;

    try {
      setActionLoading(true);

      const updated =
        await updateComplaintStatus(
          complaint._id,
          status
        );

      setComplaint(updated);

      Alert.alert(
        'Success',
        `Complaint marked as ${formatStatus(status)}.`
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Error',
        'Failed to update complaint status.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  function formatStatus(
    status: ComplaintStatus
  ) {
    if (status === 'in_progress') {
      return 'In Progress';
    }

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );
  }

  function formatDate(
    date?: string | null
  ) {
    if (!date) return '—';

    try {
      return new Date(date).toLocaleString();
    } catch {
      return date;
    }
  }

  function getStatusColor(
    status: ComplaintStatus
  ) {
    switch (status) {
      case 'resolved':
        return colors.success;

      case 'rejected':
        return colors.destructive;

      case 'in_progress':
        return colors.primary;

      default:
        return colors.accent;
    }
  }

  if (loading) {
    return (
      <View
        style={[
          styles.safe,
          styles.center,
        ]}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading complaint...
        </Text>
      </View>
    );
  }

  if (!complaint) {
    return (
      <View
        style={[
          styles.safe,
          styles.center,
        ]}
      >
        <Feather
          name="alert-circle"
          size={42}
          color={colors.mutedForeground}
        />

        <Text style={styles.emptyTitle}>
          Complaint not found
        </Text>

        <Pressable
          onPress={() => router.back()}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  const statusColor =
    getStatusColor(complaint.status);

  return (
    <View style={styles.safe}>

      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather
            name="arrow-left"
            size={21}
            color="#fff"
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            Complaint Details
          </Text>

          <Text style={styles.headerSubtitle}>
            Review and manage complaint
          </Text>
        </View>
      </View>

      <ImageViewing
        images={viewerImages}
        imageIndex={viewerIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshComplaint}
          />
        }
        contentContainerStyle={
          styles.content
        }
      >

        {/* COMPLAINT HEADER */}
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.categoryIcon}>
              <Feather
                name="alert-triangle"
                size={21}
                color={colors.primary}
              />
            </View>

            <View style={styles.flex}>
              <Text style={styles.title}>
                {complaint.title}
              </Text>

              <Text style={styles.date}>
                Submitted{' '}
                {formatDate(
                  complaint.createdAt
                )}
              </Text>
            </View>
          </View>

          <View style={styles.badgesRow}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    statusColor + '18',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: statusColor,
                  },
                ]}
              >
                {formatStatus(
                  complaint.status
                )}
              </Text>
            </View>

            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    complaint.priority ===
                    'urgent'
                      ? colors.destructive +
                        '18'
                      : colors.accent + '18',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color:
                      complaint.priority ===
                      'urgent'
                        ? colors.destructive
                        : colors.accent,
                  },
                ]}
              >
                {complaint.priority}
              </Text>
            </View>

            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    colors.primary + '18',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                {complaint.category}
              </Text>
            </View>
          </View>
        </View>


        {/* DESCRIPTION */}
        <Section
          title="Description"
          icon="file-text"
          colors={colors}
        >
          <Text style={styles.bodyText}>
            {complaint.description}
          </Text>
        </Section>


        {/* PHOTOS */}
        {complaint.images &&
          complaint.images.length > 0 && (
            <Section
              title={`Photos (${complaint.images.length})`}
              icon="image"
              colors={colors}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageList}
              >
                {complaint.images.map((image, index) => (
                  <Pressable
                    key={`${image}-${index}`}
                    onPress={() => openImageViewer(complaint.images, index)}
                  >
                    <Image
                      source={{ uri: image }}
                      style={styles.complaintImage}
                      contentFit="cover"
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </Section>
          )}

        {/* COMPLETION PHOTOS */}
        {complaint.completionImages &&
          complaint.completionImages.length > 0 && (
            <Section
              title={`Completion Photos (${complaint.completionImages.length})`}
              icon="check-circle"
              colors={colors}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageList}
              >
                {complaint.completionImages.map(
                  (image: string, index: number) => (
                    <Pressable
                      key={`completion-${image}-${index}`}
                      onPress={() => openImageViewer(complaint.completionImages || [], index)}
                    >
                      <Image
                        source={{ uri: image }}
                        style={styles.complaintImage}
                        contentFit="cover"
                      />
                    </Pressable>
                  )
                )}
              </ScrollView>
            </Section>
          )}


        {/* LOCATION */}
        <Section
          title="Location"
          icon="map-pin"
          colors={colors}
        >
          <InfoRow
            icon="map-pin"
            label="Address"
            value={
              complaint.location?.address ||
              'No address'
            }
            colors={colors}
          />

          <InfoRow
            icon="map"
            label="Area"
            value={
              complaint.location?.area ||
              '—'
            }
            colors={colors}
          />

          <InfoRow
            icon="navigation"
            label="City"
            value={
              complaint.location?.city ||
              '—'
            }
            colors={colors}
          />

          {complaint.location
            ?.coordinates &&
            complaint.location.coordinates
              .length >= 2 && (
              <InfoRow
                icon="crosshair"
                label="Coordinates"
                value={`${complaint.location.coordinates[1]}, ${complaint.location.coordinates[0]}`}
                colors={colors}
              />
            )}
        </Section>


        {/* RESIDENT */}
        <Section
          title="Reported By"
          icon="user"
          colors={colors}
        >
          <InfoRow
            icon="user"
            label="Name"
            value={
              complaint.user?.name ||
              'Unknown'
            }
            colors={colors}
          />

          <InfoRow
            icon="mail"
            label="Email"
            value={
              complaint.user?.email ||
              '—'
            }
            colors={colors}
          />

          <InfoRow
            icon="phone"
            label="Phone"
            value={
              complaint.user?.phone ||
              '—'
            }
            colors={colors}
          />
        </Section>


        {/* ASSIGNED WORKER */}
        <Section
          title="Assigned Worker"
          icon="tool"
          colors={colors}
        >
          {complaint.assignmentStatus === 'rejected' && (
            <View style={{ marginBottom: 16, backgroundColor: colors.destructive + '15', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.destructive + '30' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Feather name="x-circle" size={16} color={colors.destructive} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.destructive, fontFamily: 'Inter_700Bold' }}>
                  Worker Rejected Assignment
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.destructive, fontFamily: 'Inter_400Regular', lineHeight: 18 }}>
                Reason: {complaint.rejectionReason || 'No reason provided.'}
              </Text>
            </View>
          )}

          {complaint.assignedTo ? (
            <View style={styles.workerCard}>
              <View style={styles.workerAvatar}>
                {complaint.assignedTo
                  .profileImage ? (
                  <Image
                    source={{
                      uri: complaint
                        .assignedTo
                        .profileImage,
                    }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text
                    style={
                      styles.avatarText
                    }
                  >
                    {complaint.assignedTo.name
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                )}
              </View>

              <View style={styles.flex}>
                <Text style={styles.workerName}>
                  {
                    complaint
                      .assignedTo.name
                  }
                </Text>

                <Text style={styles.workerEmail}>
                  {
                    complaint
                      .assignedTo.email
                  }
                </Text>

                <Text style={styles.workerPhone}>
                  {
                    complaint
                      .assignedTo.phone
                  }
                </Text>

                {complaint.assignedTo
                  .workerProfile
                  ?.skills &&
                  complaint.assignedTo
                    .workerProfile.skills
                    .length > 0 && (
                    <Text
                      style={
                        styles.workerSkills
                      }
                    >
                      {complaint.assignedTo
                        .workerProfile.skills
                        .join(', ')}
                    </Text>
                  )}
              </View>

              <Pressable
                onPress={openWorkerModal}
                style={styles.changeButton}
              >
                <Text
                  style={styles.changeButtonText}
                >
                  Change
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.unassigned}>
              <Feather
                name="user-x"
                size={22}
                color={
                  colors.mutedForeground
                }
              />

              <View style={styles.flex}>
                <Text
                  style={
                    styles.unassignedTitle
                  }
                >
                  No worker assigned
                </Text>

                <Text
                  style={
                    styles.unassignedText
                  }
                >
                  Assign an approved worker to
                  handle this complaint.
                </Text>
              </View>
            </View>
          )}

          <Pressable
            onPress={openWorkerModal}
            disabled={actionLoading}
            style={styles.assignButton}
          >
            <Feather
              name={
                complaint.assignedTo
                  ? 'refresh-cw'
                  : 'user-plus'
              }
              size={16}
              color="#fff"
            />

            <Text
              style={styles.assignButtonText}
            >
              {complaint.assignedTo
                ? 'Change Worker'
                : 'Assign Worker'}
            </Text>
          </Pressable>
        </Section>


        {/* STATUS MANAGEMENT */}
        <Section
          title="Complaint Actions"
          icon="settings"
          colors={colors}
        >
          <Text style={styles.actionHint}>
            Current status:{' '}
            <Text
              style={{
                color: statusColor,
                fontFamily:
                  'Inter_600SemiBold',
              }}
            >
              {formatStatus(
                complaint.status
              )}
            </Text>
          </Text>

          <View style={styles.actionGrid}>

            {complaint.status !==
              'pending' && (
              <ActionButton
                label="Pending"
                icon="clock"
                active={
                  complaint.status ===
                  'pending'
                }
                onPress={() =>
                  handleStatusChange(
                    'pending'
                  )
                }
                disabled={actionLoading}
                colors={colors}
              />
            )}

            {complaint.status !==
              'in_progress' && (
              <ActionButton
                label="In Progress"
                icon="play-circle"
                active={
                  complaint.status ===
                  'in_progress'
                }
                onPress={() =>
                  handleStatusChange(
                    'in_progress'
                  )
                }
                disabled={actionLoading}
                colors={colors}
              />
            )}

            {complaint.status !==
              'resolved' && (
              <ActionButton
                label="Resolve"
                icon="check-circle"
                active={false}
                onPress={() =>
                  handleStatusChange(
                    'resolved'
                  )
                }
                disabled={actionLoading}
                colors={colors}
              />
            )}

            {complaint.status !==
              'rejected' && (
              <ActionButton
                label="Reject"
                icon="x-circle"
                active={false}
                danger
                onPress={() =>
                  handleStatusChange(
                    'rejected'
                  )
                }
                disabled={actionLoading}
                colors={colors}
              />
            )}
          </View>
        </Section>


        {/* RESOLUTION / REJECTION */}
        {(complaint.resolvedAt ||
          complaint.rejectedAt ||
          complaint.rejectionReason) && (
          <Section
            title="Status History"
            icon="clock"
            colors={colors}
          >
            {complaint.resolvedAt && (
              <InfoRow
                icon="check-circle"
                label="Resolved At"
                value={formatDate(
                  complaint.resolvedAt
                )}
                colors={colors}
              />
            )}

            {complaint.rejectedAt && (
              <InfoRow
                icon="x-circle"
                label="Rejected At"
                value={formatDate(
                  complaint.rejectedAt
                )}
                colors={colors}
              />
            )}

            {complaint.rejectionReason ? (
              <View
                style={
                  styles.reasonBox
                }
              >
                <Text
                  style={
                    styles.reasonLabel
                  }
                >
                  Rejection Reason
                </Text>

                <Text
                  style={
                    styles.reasonText
                  }
                >
                  {
                    complaint.rejectionReason
                  }
                </Text>
              </View>
            ) : null}
          </Section>
        )}


        {/* META */}
        <Section
          title="Complaint Information"
          icon="info"
          colors={colors}
        >
          <InfoRow
            icon="hash"
            label="Complaint ID"
            value={complaint._id}
            colors={colors}
          />

          <InfoRow
            icon="calendar"
            label="Created"
            value={formatDate(
              complaint.createdAt
            )}
            colors={colors}
          />

          <InfoRow
            icon="edit"
            label="Last Updated"
            value={formatDate(
              complaint.updatedAt
            )}
            colors={colors}
          />
        </Section>

      </ScrollView>


      {/* WORKER MODAL */}
      <Modal
        visible={workerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setWorkerModalVisible(false)
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <View style={styles.modal}>

            <View
              style={styles.modalHeader}
            >
              <View>
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Assign Worker
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  Select an approved active
                  worker
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setWorkerModalVisible(
                    false
                  )
                }
                style={styles.modalClose}
              >
                <Feather
                  name="x"
                  size={20}
                  color={
                    colors.foreground
                  }
                />
              </Pressable>
            </View>

            {workersLoading ? (
              <View
                style={
                  styles.modalLoading
                }
              >
                <ActivityIndicator
                  size="large"
                  color={
                    colors.primary
                  }
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Loading workers...
                </Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
              >
                {workers.length === 0 ? (
                  <View
                    style={
                      styles.noWorkers
                    }
                  >
                    <Feather
                      name="users"
                      size={38}
                      color={
                        colors.mutedForeground
                      }
                    />

                    <Text
                      style={
                        styles.emptyTitle
                      }
                    >
                      No workers available
                    </Text>
                  </View>
                ) : (
                  workers.map(
                    (worker) => (
                      <Pressable
                        key={worker._id}
                        onPress={() =>
                          handleAssignWorker(
                            worker
                          )
                        }
                        disabled={
                          actionLoading
                        }
                        style={[
                          styles.workerOption,
                          complaint.assignedWorker
                            ?._id ===
                            worker._id &&
                            styles.workerOptionActive,
                        ]}
                      >
                        <View
                          style={
                            styles.optionAvatar
                          }
                        >
                          <Text
                            style={
                              styles.avatarText
                            }
                          >
                            {worker.name
                              .charAt(0)
                              .toUpperCase()}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.flex
                          }
                        >
                          <Text
                            style={
                              styles.optionName
                            }
                          >
                            {worker.name}
                          </Text>

                          <Text
                            style={
                              styles.optionEmail
                            }
                          >
                            {worker.email}
                          </Text>

                          {worker
                            .workerProfile
                            ?.skills
                            ?.length ? (
                            <Text
                              style={
                                styles.optionSkills
                              }
                              numberOfLines={
                                1
                              }
                            >
                              {worker
                                .workerProfile
                                .skills
                                .join(
                                  ', '
                                )}
                            </Text>
                          ) : null}
                        </View>

                        {complaint
                          .assignedWorker
                          ?._id ===
                          worker._id && (
                          <Feather
                            name="check-circle"
                            size={21}
                            color={
                              colors.success
                            }
                          />
                        )}
                      </Pressable>
                    )
                  )
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {actionLoading && (
        <View style={styles.actionLoading}>
          <ActivityIndicator
            size="small"
            color="#fff"
          />

          <Text
            style={styles.actionLoadingText}
          >
            Updating...
          </Text>
        </View>
      )}
    </View>
  );
}


/*
|--------------------------------------------------------------------------
| SMALL COMPONENTS
|--------------------------------------------------------------------------
*/

function Section({
  title,
  icon,
  colors,
  children,
}: {
  title: string;
  icon: React.ComponentProps<
    typeof Feather
  >['name'];
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Feather
          name={icon}
          size={17}
          color={colors.primary}
        />

        <Text style={styles.sectionTitle}>
          {title}
        </Text>
      </View>

      {children}
    </View>
  );
}


function InfoRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ComponentProps<
    typeof Feather
  >['name'];
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  const styles = createStyles(colors);

  return (
    <View style={styles.infoRow}>
      <Feather
        name={icon}
        size={15}
        color={colors.mutedForeground}
      />

      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text
        style={styles.infoValue}
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
  );
}


function ActionButton({
  label,
  icon,
  active,
  danger,
  onPress,
  disabled,
  colors,
}: {
  label: string;
  icon: React.ComponentProps<
    typeof Feather
  >['name'];
  active: boolean;
  danger?: boolean;
  onPress: () => void;
  disabled: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const styles = createStyles(colors);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.actionButton,
        active && {
          backgroundColor:
            colors.primary,
          borderColor:
            colors.primary,
        },
        danger && {
          borderColor:
            colors.destructive + '50',
        },
      ]}
    >
      <Feather
        name={icon}
        size={16}
        color={
          active
            ? '#fff'
            : danger
              ? colors.destructive
              : colors.primary
        }
      />

      <Text
        style={[
          styles.actionButtonText,
          {
            color: active
              ? '#fff'
              : danger
                ? colors.destructive
                : colors.primary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}


/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const createStyles = (
  colors: ReturnType<typeof useColors>
) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    center: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },

    header: {
      backgroundColor: colors.navy,
      paddingTop: 55,
      paddingBottom: 18,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        'rgba(255,255,255,0.14)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    headerText: {
      flex: 1,
    },

    headerTitle: {
      color: '#fff',
      fontSize: 20,
      fontFamily:
        'Inter_700Bold',
    },

    headerSubtitle: {
      color:
        'rgba(255,255,255,.65)',
      fontSize: 12,
      marginTop: 2,
      fontFamily:
        'Inter_400Regular',
    },

    content: {
      padding: 16,
      gap: 12,
      paddingBottom: 40,
    },

    card: {
      backgroundColor:
        colors.card,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        colors.border,
      padding: 15,
    },

    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 11,
    },

    categoryIcon: {
      width: 44,
      height: 44,
      borderRadius: 11,
      backgroundColor:
        colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },

    flex: {
      flex: 1,
    },

    title: {
      color:
        colors.foreground,
      fontSize: 18,
      fontFamily:
        'Inter_700Bold',
    },

    date: {
      color:
        colors.mutedForeground,
      fontSize: 11,
      marginTop: 4,
      fontFamily:
        'Inter_400Regular',
    },

    badgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
      marginTop: 13,
    },

    badge: {
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 7,
    },

    badgeText: {
      fontSize: 10,
      fontFamily:
        'Inter_600SemiBold',
      textTransform:
        'capitalize',
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 13,
    },

    sectionTitle: {
      color:
        colors.foreground,
      fontSize: 15,
      fontFamily:
        'Inter_700Bold',
    },

    bodyText: {
      color:
        colors.mutedForeground,
      fontSize: 13,
      lineHeight: 20,
      fontFamily:
        'Inter_400Regular',
    },

    imageList: {
      gap: 10,
    },

    complaintImage: {
      width: 190,
      height: 150,
      borderRadius: 11,
      backgroundColor:
        colors.muted,
    },

    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 11,
      gap: 8,
    },

    infoLabel: {
      width: 82,
      color:
        colors.mutedForeground,
      fontSize: 11,
      fontFamily:
        'Inter_500Medium',
    },

    infoValue: {
      flex: 1,
      color:
        colors.foreground,
      fontSize: 12,
      fontFamily:
        'Inter_500Medium',
    },

    workerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },

    workerAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor:
        colors.primary + '18',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },

    avatarImage: {
      width: '100%',
      height: '100%',
    },

    avatarText: {
      color: colors.primary,
      fontSize: 17,
      fontFamily:
        'Inter_700Bold',
    },

    workerName: {
      color:
        colors.foreground,
      fontSize: 14,
      fontFamily:
        'Inter_600SemiBold',
    },

    workerEmail: {
      color:
        colors.mutedForeground,
      fontSize: 10,
      marginTop: 2,
      fontFamily:
        'Inter_400Regular',
    },

    workerPhone: {
      color:
        colors.mutedForeground,
      fontSize: 10,
      marginTop: 2,
      fontFamily:
        'Inter_400Regular',
    },

    workerSkills: {
      color:
        colors.primary,
      fontSize: 10,
      marginTop: 4,
      fontFamily:
        'Inter_500Medium',
    },

    changeButton: {
      paddingHorizontal: 9,
      paddingVertical: 7,
      borderRadius: 7,
      backgroundColor:
        colors.primary + '12',
    },

    changeButtonText: {
      color: colors.primary,
      fontSize: 10,
      fontFamily:
        'Inter_600SemiBold',
    },

    unassigned: {
      flexDirection: 'row',
      gap: 11,
      alignItems: 'center',
      paddingVertical: 8,
    },

    unassignedTitle: {
      color:
        colors.foreground,
      fontSize: 13,
      fontFamily:
        'Inter_600SemiBold',
    },

    unassignedText: {
      color:
        colors.mutedForeground,
      fontSize: 11,
      marginTop: 3,
      lineHeight: 16,
      fontFamily:
        'Inter_400Regular',
    },

    assignButton: {
      height: 43,
      borderRadius: 10,
      backgroundColor:
        colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
    },

    assignButtonText: {
      color: '#fff',
      fontSize: 12,
      fontFamily:
        'Inter_600SemiBold',
    },

    actionHint: {
      color:
        colors.mutedForeground,
      fontSize: 11,
      marginBottom: 12,
      fontFamily:
        'Inter_400Regular',
    },

    actionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 9,
      borderWidth: 1,
      borderColor:
        colors.primary + '40',
      backgroundColor:
        colors.card,
    },

    actionButtonText: {
      fontSize: 11,
      fontFamily:
        'Inter_600SemiBold',
    },

    reasonBox: {
      backgroundColor:
        colors.destructive + '10',
      borderRadius: 9,
      padding: 11,
      marginTop: 4,
    },

    reasonLabel: {
      color:
        colors.destructive,
      fontSize: 11,
      fontFamily:
        'Inter_600SemiBold',
      marginBottom: 4,
    },

    reasonText: {
      color:
        colors.foreground,
      fontSize: 12,
      lineHeight: 18,
      fontFamily:
        'Inter_400Regular',
    },

    primaryButton: {
      marginTop: 15,
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 9,
      backgroundColor:
        colors.primary,
    },

    primaryButtonText: {
      color: '#fff',
      fontFamily:
        'Inter_600SemiBold',
    },

    loadingText: {
      color:
        colors.mutedForeground,
      fontSize: 12,
      marginTop: 10,
      fontFamily:
        'Inter_400Regular',
    },

    emptyTitle: {
      color:
        colors.foreground,
      fontSize: 16,
      marginTop: 10,
      fontFamily:
        'Inter_600SemiBold',
    },

    modalOverlay: {
      flex: 1,
      backgroundColor:
        'rgba(0,0,0,.5)',
      justifyContent: 'flex-end',
    },

    modal: {
      maxHeight: '82%',
      backgroundColor:
        colors.background,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      padding: 18,
    },

    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },

    modalTitle: {
      color:
        colors.foreground,
      fontSize: 18,
      fontFamily:
        'Inter_700Bold',
    },

    modalSubtitle: {
      color:
        colors.mutedForeground,
      fontSize: 11,
      marginTop: 3,
      fontFamily:
        'Inter_400Regular',
    },

    modalClose: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor:
        colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },

    modalLoading: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 50,
    },

    noWorkers: {
      alignItems: 'center',
      paddingVertical: 40,
    },

    workerOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderRadius: 11,
      borderWidth: 1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.card,
      marginBottom: 8,
    },

    workerOptionActive: {
      borderColor:
        colors.primary,
      backgroundColor:
        colors.primary + '10',
    },

    optionAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },

    optionName: {
      color:
        colors.foreground,
      fontSize: 13,
      fontFamily:
        'Inter_600SemiBold',
    },

    optionEmail: {
      color:
        colors.mutedForeground,
      fontSize: 10,
      marginTop: 2,
      fontFamily:
        'Inter_400Regular',
    },

    optionSkills: {
      color:
        colors.primary,
      fontSize: 10,
      marginTop: 3,
      fontFamily:
        'Inter_500Medium',
    },

    actionLoading: {
      position: 'absolute',
      bottom: 20,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor:
        colors.navy,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 20,
    },

    actionLoadingText: {
      color: '#fff',
      fontSize: 11,
      fontFamily:
        'Inter_500Medium',
    },
  });
