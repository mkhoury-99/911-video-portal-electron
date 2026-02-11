import { useState, useEffect } from "react";
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
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const isSharedAccount = accountType === "shared";

  const hasChanges =
    originalProfile &&
    (profile.first_name !== originalProfile.first_name ||
      profile.last_name !== originalProfile.last_name ||
      profile.phone !== originalProfile.phone);

  useEffect(() => {
    loadProfile();
  }, []);

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
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Manage your account details and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <Text className="text-red-600">{error}</Text>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <Text className="text-green-600">
                  Profile updated successfully!
                </Text>
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
