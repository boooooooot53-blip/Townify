import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { MapPressEvent, MarkerDragStartEndEvent, Region } from "react-native-maps";
import { MapView, Marker } from "./MapView";

import { useColors } from "@/hooks/useColors";
import {
  DEFAULT_REGION,
  formatLocationLabel,
  getCurrentPickedLocation,
  pickedLocationFromCoordinates,
  type PickedLocation,
} from "@/utils/location";

const LIGHT_MAP_STYLE: any[] = [];

interface LocationPickerProps {
  label?: string;
  value: PickedLocation | null;
  onChange: (location: PickedLocation | null) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function LocationPicker({
  label = "Location",
  value,
  onChange,
  placeholder = "Tap to pick a location on the map",
  required,
  error,
}: LocationPickerProps) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pickerError, setPickerError] = useState("");
  const [draft, setDraft] = useState<PickedLocation | null>(value);
  const [region, setRegion] = useState<Region>({
    latitude: value?.coordinates[1] ?? DEFAULT_REGION.latitude,
    longitude: value?.coordinates[0] ?? DEFAULT_REGION.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    if (visible) {
      setDraft(value);
      if (value?.coordinates) {
        setRegion((prev) => ({
          ...prev,
          latitude: value.coordinates[1],
          longitude: value.coordinates[0],
        }));
      }
    }
  }, [visible, value]);

  async function handleUseCurrentLocation() {
    setLoading(true);
    setPickerError("");
    try {
      const current = await getCurrentPickedLocation();
      setDraft(current);
      setRegion((prev) => ({
        ...prev,
        latitude: current.coordinates[1],
        longitude: current.coordinates[0],
      }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      setPickerError(err instanceof Error ? err.message : "Could not get current location");
    } finally {
      setLoading(false);
    }
  }

  async function handleCoordinatePick(latitude: number, longitude: number) {
    setLoading(true);
    setPickerError("");
    try {
      const picked = await pickedLocationFromCoordinates(latitude, longitude);
      setDraft(picked);
      Haptics.selectionAsync().catch(() => {});
    } catch {
      setPickerError("Could not resolve address for this point");
    } finally {
      setLoading(false);
    }
  }

  function handleMapPress(event: MapPressEvent) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    void handleCoordinatePick(latitude, longitude);
  }

  function handleMarkerDragEnd(event: MarkerDragStartEndEvent) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    void handleCoordinatePick(latitude, longitude);
  }

  function handleConfirm() {
    if (!draft?.address?.trim()) {
      setPickerError("Please select a location on the map or use current location");
      return;
    }
    onChange(draft);
    setVisible(false);
    setPickerError("");
  }

  function handleClear() {
    onChange(null);
    setDraft(null);
    setVisible(false);
  }

  const displayText = formatLocationLabel(value) || placeholder;
  const hasValue = !!value?.address;

  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "500",
          color: error ? colors.destructive : colors.mutedForeground,
          fontFamily: "Inter_500Medium",
        }}
      >
        {label}
        {required ? " *" : ""}
      </Text>

      <TouchableOpacity
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
        style={{
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderWidth: 1.5,
          borderColor: error ? colors.destructive : colors.border,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary + "15",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="map-pin" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              color: hasValue ? colors.foreground : colors.mutedForeground,
              fontFamily: "Inter_400Regular",
            }}
            numberOfLines={2}
          >
            {displayText}
          </Text>
          {hasValue ? (
            <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 4, fontFamily: "Inter_400Regular" }}>
              {value!.coordinates[1].toFixed(5)}, {value!.coordinates[0].toFixed(5)}
            </Text>
          ) : null}
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {error ? (
        <Text style={{ fontSize: 12, color: colors.destructive, fontFamily: "Inter_400Regular" }}>{error}</Text>
      ) : null}

      <Modal visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View
            style={{
              paddingTop: Platform.OS === "web" ? 20 : 56,
              paddingHorizontal: 20,
              paddingBottom: 16,
              backgroundColor: colors.navy,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.iconBtn}>
              <Feather name="x" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold" }}>
                Pick Location
              </Text>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular", marginTop: 2 }}>
                Tap the map or use your current location
              </Text>
            </View>
          </View>

          {Platform.OS !== "web" ? (
            <MapView
              style={{ height: 280, width: "100%" }}
              region={region}
              userInterfaceStyle="light"
              customMapStyle={LIGHT_MAP_STYLE}
              onRegionChangeComplete={setRegion}
              onPress={handleMapPress}
            >
              {draft ? (
                <Marker
                  coordinate={{
                    latitude: draft.coordinates[1],
                    longitude: draft.coordinates[0],
                  }}
                  draggable
                  onDragEnd={handleMarkerDragEnd}
                />
              ) : null}
            </MapView>
          ) : (
            <View
              style={{
                height: 120,
                margin: 20,
                borderRadius: 12,
                backgroundColor: colors.muted,
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
              }}
            >
              <Text style={{ textAlign: "center", color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                Map picker is limited on web. Use current location or enter the address below.
              </Text>
            </View>
          )}

          <View style={{ padding: 20, gap: 14, flex: 1 }}>
            <TouchableOpacity
              onPress={handleUseCurrentLocation}
              disabled={loading}
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: colors.primary,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="navigation" size={16} color="#FFFFFF" />
                  <Text style={{ color: "#FFFFFF", fontWeight: "600", fontFamily: "Inter_600SemiBold" }}>
                    Use Current Location
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>
                Address
              </Text>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: colors.radius,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  padding: 14,
                }}
              >
                <TextInput
                  value={draft?.address ?? ""}
                  onChangeText={(text) =>
                    setDraft((prev) =>
                      prev
                        ? { ...prev, address: text }
                        : {
                            address: text,
                            coordinates: [DEFAULT_REGION.longitude, DEFAULT_REGION.latitude],
                          }
                    )
                  }
                  placeholder="Street, area, landmark..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  style={{ fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular", minHeight: 60 }}
                />
              </View>
            </View>

            {pickerError ? (
              <Text style={{ color: colors.destructive, fontSize: 13, fontFamily: "Inter_400Regular" }}>{pickerError}</Text>
            ) : null}

            <View style={{ flexDirection: "row", gap: 10, marginTop: "auto" }}>
              {value ? (
                <Pressable
                  onPress={handleClear}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>Clear</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={handleConfirm}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontFamily: "Inter_700Bold" }}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
