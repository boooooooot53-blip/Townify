import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewProps,
} from "react-native";
import { useColors } from "@/hooks/useColors";

// Card
export function Card({
  children,
  style,
  ...props
}: ViewProps & { children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          padding: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 4,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

// Button
interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading,
  icon,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const colors = useColors();
  const bgMap = {
    primary: colors.primary,
    secondary: colors.secondary,
    outline: "transparent",
    ghost: "transparent",
    danger: colors.destructive,
  };
  const textColorMap = {
    primary: colors.primaryForeground,
    secondary: colors.secondaryForeground,
    outline: colors.primary,
    ghost: colors.primary,
    danger: colors.destructiveForeground,
  };
  const sizeMap = { sm: 44, md: 54, lg: 64 };
  const fontMap = { sm: 14, md: 16, lg: 18 };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      disabled={disabled || loading}
      style={[
        {
          backgroundColor: bgMap[variant],
          height: sizeMap[size],
          borderRadius: colors.radius, // Sleek professional shape instead of cartoon pill
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingHorizontal: 24,
          opacity: disabled ? 0.6 : 1,
          shadowColor: disabled ? "transparent" : (variant === 'primary' ? colors.primary : "#000"),
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: variant === 'primary' ? 0.3 : 0.05,
          shadowRadius: 8,
          elevation: disabled ? 0 : 4,
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColorMap[variant]} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={{
              color: textColorMap[variant],
              fontSize: fontMap[size],
              fontWeight: "600",
              fontFamily: "Inter_600SemiBold",
            }}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// Input
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  ...props
}: InputProps) {
  const colors = useColors();
  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text
          style={{
            fontSize: 13,
            fontWeight: "500",
            color: colors.mutedForeground,
            fontFamily: "Inter_500Medium",
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
            borderRadius: colors.radius,
            borderWidth: 1,
            borderColor: error ? colors.destructive : colors.border,
            paddingHorizontal: 16,
            height: 56,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.03,
            shadowRadius: 4,
            elevation: 1,
          },
        ]}
      >
        {leftIcon && <View style={{ marginRight: 10 }}>{leftIcon}</View>}
        <TextInput
          style={[
            {
              flex: 1,
              fontSize: 15,
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
            },
            style,
          ]}
          placeholderTextColor={colors.mutedForeground}
          {...props}
        />
        {rightIcon && <View style={{ marginLeft: 10 }}>{rightIcon}</View>}
      </View>
      {error && (
        <Text
          style={{
            fontSize: 12,
            color: colors.destructive,
            fontFamily: "Inter_400Regular",
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

// Badge
interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "muted";
  size?: "sm" | "md";
}

export function Badge({ label, variant = "default", size = "sm" }: BadgeProps) {
  const colors = useColors();
  const bgMap = {
    default: colors.primary + "18",
    success: colors.success + "18",
    warning: colors.warning + "18",
    danger: colors.destructive + "18",
    info: colors.info + "18",
    muted: colors.muted,
  };
  const textColorMap = {
    default: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.destructive,
    info: colors.info,
    muted: colors.mutedForeground,
  };
  return (
    <View
      style={{
        backgroundColor: bgMap[variant],
        borderRadius: 100,
        paddingHorizontal: size === "sm" ? 8 : 12,
        paddingVertical: size === "sm" ? 3 : 5,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          fontSize: size === "sm" ? 11 : 13,
          fontWeight: "600",
          color: textColorMap[variant],
          fontFamily: "Inter_600SemiBold",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// Section Header
export function SectionHeader({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: colors.foreground,
            fontFamily: "Inter_700Bold",
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: 13,
              color: colors.mutedForeground,
              marginTop: 2,
              fontFamily: "Inter_400Regular",
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text
            style={{
              fontSize: 13,
              color: colors.primary,
              fontWeight: "600",
              fontFamily: "Inter_600SemiBold",
            }}
          >
            {action}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Empty State
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View
      style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.muted,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          fontSize: 17,
          fontWeight: "600",
          color: colors.foreground,
          fontFamily: "Inter_600SemiBold",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{
            fontSize: 14,
            color: colors.mutedForeground,
            fontFamily: "Inter_400Regular",
            textAlign: "center",
            lineHeight: 21,
          }}
        >
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} size="sm" style={{ marginTop: 8 }} />
      )}
    </View>
  );
}

// Loading Skeleton
export function Skeleton({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: colors.muted,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({});
