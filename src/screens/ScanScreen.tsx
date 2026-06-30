import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { X, ImageIcon, Camera as CameraIcon, AlertTriangle } from "lucide-react-native";
import { RecognitionResult, MealEntry, MealItem } from "@/types";
import { useLogStore } from "@/store/logStore";
import { recognizeMeal } from "@/services/recognitionService";
import { toResizedBase64, saveThumbnail } from "@/utils/image";
import { scalePer100, sumNutrition, clampGrams } from "@/utils/nutrition";
import { today } from "@/utils/date";
import { newId } from "@/utils/id";
import { colors } from "@/theme/colors";
import ResultCard from "@/components/ResultCard";

type Phase = "capture" | "processing" | "result" | "error";

export default function ScanScreen() {
  const navigation = useNavigation();
  const addMeal = useLogStore((s) => s.addMeal);

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [phase, setPhase] = useState<Phase>("capture");
  const [cameraReady, setCameraReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Prompt for camera access as soon as the modal opens (the natural moment to
  // ask), unless the user has permanently denied it.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const runRecognition = async (uri: string) => {
    setPhotoUri(uri);
    setErrorMsg("");
    setPhase("processing");
    try {
      const base64 = await toResizedBase64(uri);
      const r = await recognizeMeal(base64, "image/jpeg");
      setResult(r);
      setPhase("result");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("error");
    }
  };

  const onCapture = async () => {
    if (!cameraReady || busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.6 });
      if (photo?.uri) await runRecognition(photo.uri);
    } catch {
      setErrorMsg("Couldn't take the photo. Try again.");
      setPhase("error");
    } finally {
      setBusy(false);
    }
  };

  const onPickFromGallery = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        await runRecognition(res.assets[0].uri);
      }
    } finally {
      setBusy(false);
    }
  };

  const onChangeGrams = (index: number, grams: number) => {
    setResult((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((it, i) =>
              i === index ? { ...it, grams: clampGrams(grams) } : it,
            ),
          }
        : prev,
    );
  };

  const onRemoveItem = (index: number) => {
    setResult((prev) =>
      prev && prev.items.length > 1
        ? { ...prev, items: prev.items.filter((_, i) => i !== index) }
        : prev,
    );
  };

  const onSave = async () => {
    if (!result || result.items.length === 0 || saving) return;
    setSaving(true);

    const id = newId();
    const items: MealItem[] = result.items.map((it) => ({
      name: it.name,
      grams: it.grams,
      source: it.source,
      ...scalePer100(it, it.grams),
    }));
    const totals = sumNutrition(items);
    const servingG = items.reduce((sum, it) => sum + it.grams, 0);
    // The meal is an AI estimate unless every component came from Open Food Facts.
    const source = items.every((it) => it.source === "openfoodfacts")
      ? "openfoodfacts"
      : "gemini_estimate";

    // Persist a small thumbnail (not the full-res original). Failing to make one
    // shouldn't block logging the meal — fall back to no image.
    let imageUri: string | undefined;
    if (photoUri) {
      try {
        imageUri = await saveThumbnail(photoUri, id);
      } catch {
        imageUri = undefined;
      }
    }

    const entry: MealEntry = {
      id,
      name: result.name,
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      servingG,
      source,
      timestamp: new Date().toISOString(),
      imageUri,
      items,
    };
    addMeal(today(), entry);
    navigation.goBack();
  };

  const onRetake = () => {
    setResult(null);
    setPhotoUri(null);
    setErrorMsg("");
    setPhase("capture");
  };

  const closeButton = (
    <Pressable
      onPress={() => navigation.goBack()}
      hitSlop={12}
      className="w-10 h-10 rounded-full bg-black/40 items-center justify-center active:opacity-70"
    >
      <X color="#FFFFFF" size={24} />
    </Pressable>
  );

  // ---- Permission still resolving ---------------------------------------
  if (phase === "capture" && !permission) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // ---- Permission gate ---------------------------------------------------
  if (phase === "capture" && permission && !permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
        <View className="flex-row justify-end px-5 pt-2">{closeButton}</View>
        <View className="flex-1 items-center justify-center px-8">
          <CameraIcon color={colors.textSecondary} size={48} />
          <Text className="text-textPrimary text-xl font-semibold text-center mt-4">
            Camera access needed
          </Text>
          <Text className="text-textMuted text-center mt-2">
            Allow camera access to snap a meal, or pick a photo from your
            gallery instead.
          </Text>
          <Pressable
            onPress={requestPermission}
            className="bg-accent rounded-xl px-6 py-3 mt-6 active:opacity-80"
          >
            <Text className="text-onAccent font-bold">Grant camera access</Text>
          </Pressable>
          <Pressable
            onPress={onPickFromGallery}
            className="flex-row items-center mt-4 active:opacity-70"
          >
            <ImageIcon color={colors.textSecondary} size={18} />
            <Text className="text-textSecondary font-semibold ml-2">
              Choose from gallery
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Capture (live camera) --------------------------------------------
  if (phase === "capture") {
    return (
      <View className="flex-1 bg-black">
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
        />
        <SafeAreaView
          className="absolute inset-0"
          edges={["top", "bottom"]}
          pointerEvents="box-none"
        >
          <View className="flex-row justify-end px-5 pt-2">{closeButton}</View>

          <View className="flex-1" pointerEvents="none">
            <Text className="text-white/80 text-center mt-4">
              Center your meal in the frame
            </Text>
          </View>

          {/* Bottom controls */}
          <View className="flex-row items-center justify-between px-10 pb-8">
            <Pressable
              onPress={onPickFromGallery}
              className="w-12 h-12 rounded-full bg-black/40 items-center justify-center active:opacity-70"
            >
              <ImageIcon color="#FFFFFF" size={24} />
            </Pressable>

            <Pressable
              onPress={onCapture}
              disabled={!cameraReady || busy}
              className="w-20 h-20 rounded-full items-center justify-center active:opacity-80"
              style={{ opacity: cameraReady ? 1 : 0.5 }}
            >
              <View className="w-20 h-20 rounded-full border-4 border-white items-center justify-center">
                <View className="rounded-full bg-white" style={{ width: 60, height: 60 }} />
              </View>
            </Pressable>

            {/* Spacer to balance the gallery button */}
            <View className="w-12 h-12" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ---- Processing --------------------------------------------------------
  if (phase === "processing") {
    return (
      <View className="flex-1 bg-black">
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={{ flex: 1, opacity: 0.4 }}
            resizeMode="cover"
          />
        ) : null}
        <View className="absolute inset-0 items-center justify-center px-8">
          <ActivityIndicator size="large" color={colors.accent} />
          <Text className="text-white text-lg font-semibold mt-4">
            Analyzing your meal…
          </Text>
          <Text className="text-white/70 text-center mt-1">
            Identifying the dish and looking up nutrition.
          </Text>
        </View>
      </View>
    );
  }

  // ---- Error -------------------------------------------------------------
  if (phase === "error") {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
        <View className="flex-row justify-end px-5 pt-2">{closeButton}</View>
        <View className="flex-1 items-center justify-center px-8">
          <AlertTriangle color={colors.warn} size={44} />
          <Text className="text-textPrimary text-xl font-semibold text-center mt-4">
            Couldn't analyze that
          </Text>
          <Text className="text-textMuted text-center mt-2">{errorMsg}</Text>
          <View className="flex-row gap-3 mt-6">
            <Pressable
              onPress={onRetake}
              className="bg-accent rounded-xl px-6 py-3 active:opacity-80"
            >
              <Text className="text-onAccent font-bold">Try again</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Result ------------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row justify-end px-5 pt-2">{closeButton}</View>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={{ width: "100%", height: 180, borderRadius: 20, marginBottom: 16 }}
            resizeMode="cover"
          />
        ) : null}
        {result ? (
          <ResultCard
            name={result.name}
            confidence={result.confidence}
            items={result.items}
            onChangeGrams={onChangeGrams}
            onRemoveItem={onRemoveItem}
            onSave={onSave}
            onRetake={onRetake}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
