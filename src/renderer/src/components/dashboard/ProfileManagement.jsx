import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Heading } from "../ui/heading";
import { Text } from "../ui/text";
import { Button } from "../ui/button";
import { Field, Label } from "../ui/fieldset";
import { Input } from "../ui/input";
import { useAuth } from "../../context/AuthContext";
import {
  changeProfilePictureVideo,
  deleteProfilePictureVideo,
  getCustomerVideoAccountById,
  userUpdateCustomerVideoAccount,
} from "../../api/CustomerApi";

export default function ProfileManagement() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    email: user?.email || "",
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [originalProfile, setOriginalProfile] = useState(null);
  const [accountType, setAccountType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);
  const [photoSuccessMessage, setPhotoSuccessMessage] = useState("");
  const [photoError, setPhotoError] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);

  const isSharedAccount = accountType === "shared";

  const hasChanges =
    originalProfile &&
    (profile.first_name !== originalProfile.first_name ||
      profile.last_name !== originalProfile.last_name ||
      profile.phone !== originalProfile.phone);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resolveProfileImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;

    const apiBase = import.meta.env.VITE_API_URL || "";
    const origin = apiBase.replace(/\/api\/?$/, "");
    if (!origin) return path;
    return `${origin}/${String(path).replace(/^\/+/, "")}`;
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomerVideoAccountById();

      // Map API response to form fields (support snake_case and camelCase)
      const loaded = {
        email: data?.email ?? user?.email ?? "",
        first_name: data?.first_name ?? data?.firstName ?? "",
        last_name: data?.last_name ?? data?.lastName ?? "",
        phone: data?.phone ?? data?.phone_number ?? "",
      };
      setProfile(loaded);
      setOriginalProfile(loaded);
      setAccountType(data?.account_type ?? data?.accountType ?? null);
      const photoPath =
        data?.profile_picture_url ?? data?.profilePicturePath ?? "";
      setProfileImageUrl(resolveProfileImageUrl(photoPath));
    } catch (err) {
      setError("Failed to load profile. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (originalProfile) {
      setProfile(originalProfile);
    }
  };

  const clearPhotoMessages = () => {
    setPhotoError(null);
    setPhotoSuccess(false);
    setPhotoSuccessMessage("");
  };

  const handlePickPhoto = () => {
    clearPhotoMessages();
    fileInputRef.current?.click();
  };

  const handlePhotoSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    clearPhotoMessages();

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image must be 5MB or smaller.");
      return;
    }

    const nextPreview = URL.createObjectURL(file);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(nextPreview);

    try {
      setUploadingPhoto(true);
      await changeProfilePictureVideo(file);
      setPhotoSuccessMessage("Profile photo updated successfully!");
      setPhotoSuccess(true);
      setTimeout(() => setPhotoSuccess(false), 3000);
      await loadProfile();
    } catch (err) {
      setPhotoError("Failed to update photo. Please try again.");
      console.error(err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    clearPhotoMessages();
    try {
      setUploadingPhoto(true);
      await deleteProfilePictureVideo();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl("");
      setProfileImageUrl("");
      setPhotoSuccessMessage("Profile photo removed successfully!");
      setPhotoSuccess(true);
      setTimeout(() => setPhotoSuccess(false), 3000);
      await loadProfile();
    } catch (err) {
      setPhotoError("Failed to remove photo. Please try again.");
      console.error(err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await userUpdateCustomerVideoAccount({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone_number: profile.phone,
      });
      setOriginalProfile({ ...profile });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Text>Loading profile...</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Heading>Profile Management</Heading>
        <Text className="text-zinc-500 mt-2">
          Update your account information
        </Text>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="mt-4">Personal Information</CardTitle>
          <CardDescription>
            Manage your account details and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Field>
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center">
                  {previewUrl || profileImageUrl ? (
                    <img
                      src={previewUrl || profileImageUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Text className="text-zinc-500 text-xs">No photo</Text>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelected}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePickPhoto}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemovePhoto}
                    disabled={
                      uploadingPhoto || !(previewUrl || profileImageUrl)
                    }
                  >
                    Remove Photo
                  </Button>
                </div>
              </div>
              <Text className="text-xs text-zinc-500 mt-2">
                JPG, PNG, or WebP.
              </Text>
            </Field>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <Text className="text-red-600">{error}</Text>
              </div>
            )}

            {photoError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <Text className="text-red-600">{photoError}</Text>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <Text className="text-green-600">
                  Profile updated successfully!
                </Text>
              </div>
            )}

            {photoSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <Text className="text-green-600">{photoSuccessMessage}</Text>
              </div>
            )}

            <Field>
              <Label>Email</Label>
              <Input
                type="email"
                value={profile.email}
                disabled
                className="bg-zinc-50"
              />
              <Text className="text-xs text-zinc-500 mt-1">
                Email cannot be changed
              </Text>
            </Field>

            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
              <Field>
                <Label>First Name</Label>
                <Input
                  type="text"
                  value={profile.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  required
                  disabled={isSharedAccount}
                  className={`w-full ${isSharedAccount ? "bg-zinc-50" : ""}`}
                />
                {isSharedAccount && (
                  <Text className="text-xs text-zinc-500 mt-1">
                    Not editable for shared accounts
                  </Text>
                )}
              </Field>

              <Field>
                <Label>Last Name</Label>
                <Input
                  type="text"
                  value={profile.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  required
                  disabled={isSharedAccount}
                  className={`w-full ${isSharedAccount ? "bg-zinc-50" : ""}`}
                />
              </Field>
            </div>

            <Field>
              <Label>Phone Number</Label>
              <Input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+15551234567"
                disabled={isSharedAccount}
                className={isSharedAccount ? "bg-zinc-50" : ""}
              />
            </Field>

            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={!hasChanges || saving}
                className="w-full sm:w-auto border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!hasChanges || saving}
                className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 font-medium shadow-sm hover:shadow-md"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
