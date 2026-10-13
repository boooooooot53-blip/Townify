import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getErrorMessage } from "@/api/axios";
import { useColors } from "@/hooks/useColors";
import { useAuth, UserRole } from "@/context/AuthContext";
import { Button, Input } from "@/components/ThemedComponents";
import { pickImage, uploadImages, takePhoto } from "@/utils/imageUpload";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { email: prefillEmail } = useLocalSearchParams<{ email?: string }>();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [professions, setProfessions] = useState<string[]>([]);
  const [isProfessionDropdownOpen, setIsProfessionDropdownOpen] = useState(false);
  const [cnicFront, setCnicFront] = useState<string | null>(null);
  const [cnicBack, setCnicBack] = useState<string | null>(null);
  const [imagePickerTarget, setImagePickerTarget] = useState<'front' | 'back' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const WORKER_PROFESSIONS = [
    { id: 'electrical', label: 'Electrician', icon: 'zap' },
    { id: 'plumbing', label: 'Plumber', icon: 'droplet' },
    { id: 'carpentry', label: 'Carpenter', icon: 'tool' },
    { id: 'ac_repair', label: 'AC Technician', icon: 'wind' },
    { id: 'painting', label: 'Painter', icon: 'edit-2' },
    { id: 'pest_control', label: 'Pest Control', icon: 'shield' },
  ];

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim() || !/^(03\d{2}-\d{7}|03\d{9})$/.test(phone.trim())) {
      setError("Please fill in all required fields including a valid phone number.");
      return;
    }
    if (role === "worker") {
      if (professions.length === 0) {
        setError("Please select at least one profession.");
        return;
      }
      if (!cnicFront || !cnicBack) {
        setError("Please upload both front and back of your CNIC.");
        return;
      }
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      let frontUrl, backUrl;
      if (role === "worker" && cnicFront && cnicBack) {
        const uploaded = await uploadImages([cnicFront, cnicBack]);
        frontUrl = uploaded[0];
        backUrl = uploaded[1];
      }
      await register(
        name.trim(), 
        email.trim(), 
        phone.trim(), 
        password, 
        role, 
        role === "worker" ? professions : undefined,
        frontUrl,
        backUrl
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace("/(tabs)");
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  const isWeb = Platform.OS === "web";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: isWeb ? (colors.muted + "25") : colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          {
            flexGrow: 1,
            paddingBottom: bottomInset + 24,
          },
          isWeb && {
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 48,
            paddingHorizontal: 20,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            { width: "100%" },
            isWeb && {
              maxWidth: 520,
              backgroundColor: colors.card,
              borderRadius: 24,
              overflow: "hidden",
              borderWidth: 1.5,
              borderColor: colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.08,
              shadowRadius: 28,
              elevation: 4,
            },
          ]}
        >
          <View
            style={{
              backgroundColor: colors.primary,
              paddingTop: isWeb ? 32 : topInset + 20,
              paddingHorizontal: isWeb ? 32 : 24,
              paddingBottom: 28,
              borderBottomWidth: 4,
              borderBottomColor: colors.border,
            }}
          >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.secondary,
              borderWidth: 3,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              shadowColor: colors.border,
              shadowOffset: { width: 3, height: 3 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "900",
              color: "#FFFFFF",
              fontFamily: "Inter_700Bold",
              textShadowColor: colors.border,
              textShadowOffset: {width: 2, height: 2},
              textShadowRadius: 0
            }}
          >
            Create Account
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: "#FFFFFF",
              fontFamily: "Inter_400Regular",
              marginTop: 6,
            }}
          >
            Join your community today
          </Text>
        </View>

        <View style={{ paddingHorizontal: isWeb ? 32 : 24, paddingTop: 28, paddingBottom: isWeb ? 36 : 0, gap: 18 }}>
          {error ? (
            <View
              style={{
                backgroundColor: colors.destructive + "18",
                borderRadius: colors.radius,
                padding: 12,
                flexDirection: "row",
                gap: 8,
              }}
            >
              <Feather name="alert-circle" size={16} color={colors.destructive} />
              <Text
                style={{ flex: 1, fontSize: 13, color: colors.destructive, fontFamily: "Inter_400Regular" }}
              >
                {error}
              </Text>
            </View>
          ) : null}

          {/* Role Selection */}
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "500",
                color: colors.mutedForeground,
                fontFamily: "Inter_500Medium",
              }}
            >
              Account Type
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {(["user", "worker"] as UserRole[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setRole(r)}
                  style={{
                    flex: 1,
                    height: 50,
                    borderRadius: colors.radius,
                    borderWidth: 2,
                    borderColor: role === r ? colors.primary : colors.border,
                    backgroundColor: role === r ? colors.primary + "12" : colors.card,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  <Feather
                    name={r === "user" ? "user" : "tool"}
                    size={16}
                    color={role === r ? colors.primary : colors.mutedForeground}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      fontFamily: "Inter_600SemiBold",
                      color: role === r ? colors.primary : colors.mutedForeground,
                      textTransform: "capitalize",
                    }}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {role === "worker" && (
            <View style={{ gap: 8, marginTop: 4 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: colors.mutedForeground,
                  fontFamily: "Inter_500Medium",
                }}
              >
                Select Your Professions *
              </Text>
              <TouchableOpacity
                onPress={() => setIsProfessionDropdownOpen(!isProfessionDropdownOpen)}
                style={{
                  height: 52,
                  borderRadius: colors.radius,
                  backgroundColor: colors.card,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderWidth: 1.5,
                  borderColor: isProfessionDropdownOpen ? colors.primary : colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 }}>
                  <Feather name="briefcase" size={16} color={professions.length > 0 ? colors.primary : colors.mutedForeground} />
                  <Text 
                    numberOfLines={1} 
                    style={{ flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: professions.length > 0 ? colors.foreground : colors.mutedForeground }}
                  >
                    {professions.length > 0 
                      ? professions.map(id => WORKER_PROFESSIONS.find(p => p.id === id)?.label).join(', ')
                      : 'Select your professions...'}
                  </Text>
                </View>
                <Feather name={isProfessionDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>

              {isProfessionDropdownOpen && (
                <View style={{
                  marginTop: 4,
                  backgroundColor: colors.card,
                  borderRadius: colors.radius,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  overflow: 'hidden'
                }}>
                  {WORKER_PROFESSIONS.map((p, index) => {
                    const isSelected = professions.includes(p.id);
                    return (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => {
                          if (isSelected) {
                            setProfessions(prev => prev.filter(id => id !== p.id));
                          } else {
                            setProfessions(prev => [...prev, p.id]);
                          }
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          borderBottomWidth: index === WORKER_PROFESSIONS.length - 1 ? 0 : 1,
                          borderBottomColor: colors.border,
                          backgroundColor: isSelected ? colors.primary + '12' : 'transparent'
                        }}
                      >
                        <Feather 
                          name={p.icon as any} 
                          size={16} 
                          color={isSelected ? colors.primary : colors.mutedForeground} 
                          style={{ marginRight: 12 }} 
                        />
                        <Text 
                          style={{ 
                            flex: 1, 
                            fontSize: 14, 
                            fontFamily: 'Inter_500Medium', 
                            color: isSelected ? colors.primary : colors.foreground 
                          }}
                        >
                          {p.label}
                        </Text>
                        {isSelected && <Feather name="check" size={16} color={colors.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              
              <View style={{ gap: 8, marginTop: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: "500", color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>
                  Upload CNIC (Required) *
                </Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => setImagePickerTarget('front')}
                    style={{
                      flex: 1,
                      height: 100,
                      borderRadius: colors.radius,
                      backgroundColor: cnicFront ? colors.card : colors.background,
                      borderWidth: 1.5,
                      borderStyle: cnicFront ? "solid" : "dashed",
                      borderColor: cnicFront ? colors.primary : colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden"
                    }}
                  >
                    {cnicFront ? (
                      <View style={{ width: "100%", height: "100%" }}>
                        <Image source={{ uri: cnicFront }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", paddingVertical: 4, alignItems: "center" }}>
                          <Text style={{ fontSize: 10, color: "#fff", fontFamily: "Inter_500Medium" }}>Front</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={{ alignItems: "center", gap: 6 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}>
                          <Feather name="plus" size={16} color={colors.mutedForeground} />
                        </View>
                        <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground }}>Front Side</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setImagePickerTarget('back')}
                    style={{
                      flex: 1,
                      height: 100,
                      borderRadius: colors.radius,
                      backgroundColor: cnicBack ? colors.card : colors.background,
                      borderWidth: 1.5,
                      borderStyle: cnicBack ? "solid" : "dashed",
                      borderColor: cnicBack ? colors.primary : colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden"
                    }}
                  >
                    {cnicBack ? (
                      <View style={{ width: "100%", height: "100%" }}>
                        <Image source={{ uri: cnicBack }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", paddingVertical: 4, alignItems: "center" }}>
                          <Text style={{ fontSize: 10, color: "#fff", fontFamily: "Inter_500Medium" }}>Back</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={{ alignItems: "center", gap: 6 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}>
                          <Feather name="plus" size={16} color={colors.mutedForeground} />
                        </View>
                        <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.mutedForeground }}>Back Side</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <Input
            label="Full Name *"
            value={name}
            onChangeText={setName}
            placeholder="Ahmad Ali"
            leftIcon={<Feather name="user" size={16} color={colors.mutedForeground} />}
          />

          <Input
            label="Email Address *"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Feather name="mail" size={16} color={colors.mutedForeground} />}
          />

          <Input
            label="Phone Number *"
            value={phone}
            onChangeText={setPhone}
            placeholder="03XX-XXXXXXX"
            keyboardType="phone-pad"
            leftIcon={<Feather name="phone" size={16} color={colors.mutedForeground} />}
          />

          <Input
            label="Password *"
            value={password}
            onChangeText={setPassword}
            placeholder="Minimum 6 characters"
            secureTextEntry
            leftIcon={<Feather name="lock" size={16} color={colors.mutedForeground} />}
          />

          <Button title="Create Account" onPress={handleRegister} loading={loading} size="lg" />

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
            <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.primary,
                  fontWeight: "600",
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
          </View>
        </View>
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal
        visible={!!imagePickerTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setImagePickerTarget(null)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
          activeOpacity={1}
          onPress={() => setImagePickerTarget(null)}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: bottomInset + 24,
            }}
          >
            <Text style={{ fontSize: 18, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 20 }}>
              Upload CNIC {imagePickerTarget === 'front' ? 'Front' : 'Back'}
            </Text>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                gap: 16
              }}
              onPress={async () => {
                const target = imagePickerTarget;
                setImagePickerTarget(null);
                try {
                  const uri = await takePhoto({ allowsEditing: true });
                  if (uri) {
                    if (target === 'front') setCnicFront(uri);
                    if (target === 'back') setCnicBack(uri);
                  }
                } catch (err) {
                  setError(getErrorMessage(err, "Camera failed."));
                }
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }}>
                <Feather name="camera" size={20} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 16, fontFamily: "Inter_500Medium", color: colors.foreground }}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                gap: 16
              }}
              onPress={async () => {
                const target = imagePickerTarget;
                setImagePickerTarget(null);
                try {
                  const uris = await pickImage({ allowsEditing: true });
                  if (uris && uris.length > 0) {
                    if (target === 'front') setCnicFront(uris[0]);
                    if (target === 'back') setCnicBack(uris[0]);
                  }
                } catch (err) {
                  setError(getErrorMessage(err, "Gallery failed."));
                }
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent + "15", alignItems: "center", justifyContent: "center" }}>
                <Feather name="image" size={20} color={colors.accent} />
              </View>
              <Text style={{ fontSize: 16, fontFamily: "Inter_500Medium", color: colors.foreground }}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}
