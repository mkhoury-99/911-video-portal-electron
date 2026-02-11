import { useState } from "react";
import { StackedLayout } from "../ui/stacked-layout";
import {
  Sidebar,
  SidebarHeader,
  SidebarBody,
  SidebarFooter,
  SidebarSection,
  SidebarItem,
  SidebarLabel,
} from "../ui/sidebar";
import { Button } from "../ui/button";
import { Navbar, NavbarSection, NavbarSpacer, NavbarItem } from "../ui/navbar";
import { Text } from "../ui/text";
import { Input, InputGroup } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../api/CustomerApi";
import LanguagesList from "./LanguagesList";
import CallsHistory from "./CallsHistory";
import Reports from "./Reports";
import ProfileManagement from "./ProfileManagement";

function VideoIcon() {
  return (
    <svg
      data-slot="icon"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-5"
    >
      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      data-slot="icon"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-5"
    >
      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      data-slot="icon"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-5"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg
      data-slot="icon"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-5"
    >
      <path
        fillRule="evenodd"
        d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5V3.5A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5a1.5 1.5 0 001.5 1.5h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      data-slot="icon"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-5"
    >
      <path
        fillRule="evenodd"
        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PowerOffIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-5">
      <path
        fillRule="evenodd"
        d="M10 2a.75.75 0 01.75.75v5.5a.75.75 0 01-1.5 0v-5.5A.75.75 0 0110 2zM5.404 4.343a.75.75 0 010 1.06 6.5 6.5 0 109.192 0 .75.75 0 111.06-1.06 8 8 0 11-11.313 0 .75.75 0 011.06 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("languages");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const openChangePassword = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangePasswordError("");
    setChangePasswordOpen(true);
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setChangePasswordError("");
    if (!oldPassword.trim()) {
      setChangePasswordError("Current password is required.");
      return;
    }
    if (!newPassword.trim()) {
      setChangePasswordError("New password is required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError("New password and confirmation do not match.");
      return;
    }
    setChangePasswordLoading(true);
    try {
      const response = await changePassword(
        oldPassword,
        newPassword,
        confirmPassword
      );
      const newToken =
        response?.access_token ??
        response?.token ??
        response?.data?.access_token ??
        response?.data?.token;
      if (newToken) {
        sessionStorage.setItem("token", newToken);
        setChangePasswordOpen(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        "Failed to change password. Please check your current password.";
      setChangePasswordError(message);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "CU";

  const sidebar = (closeMobileSidebar) => (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-4">
          {/* <div className="flex size-10 items-center justify-center rounded-lg bg-blue-600 text-white font-semibold">
            {userInitials}
          </div> */}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-zinc-950 truncate">
              {user?.email || "Video Portal"}
            </div>
            <div className="text-xs text-zinc-500">
              {sessionStorage.getItem("customer_name") || "Video Portal"}
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarBody>
        <SidebarSection className="w-full">
          {/* <SidebarItem
            current={activeSection === "reports"}
            onClick={() => setActiveSection("reports")}
          >
            <ReportIcon />
            <SidebarLabel>Reports</SidebarLabel>
          </SidebarItem> */}
          <SidebarItem
            current={activeSection === "languages"}
            onClick={() => {
              setActiveSection("languages");
              closeMobileSidebar();
            }}
          >
            <VideoIcon />
            <SidebarLabel>Languages</SidebarLabel>
          </SidebarItem>
          <SidebarItem
            current={activeSection === "history"}
            onClick={() => {
              setActiveSection("history");
              closeMobileSidebar();
            }}
          >
            <HistoryIcon />
            <SidebarLabel>Call History</SidebarLabel>
          </SidebarItem>
          <SidebarItem
            current={activeSection === "profile"}
            onClick={() => {
              setActiveSection("profile");
              closeMobileSidebar();
            }}
          >
            <UserIcon />
            <SidebarLabel>Profile</SidebarLabel>
          </SidebarItem>
        </SidebarSection>
      </SidebarBody>
      <SidebarFooter className="flex flex-col gap-2">
        <Button
          onClick={() => {
            openChangePassword();
            closeMobileSidebar();
          }}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400 active:scale-95 transition-all duration-200 px-4 py-2.5 font-medium"
        >
          <Lock className="size-5" />
          <span>Change password</span>
        </Button>
        <Button
          onClick={() => {
            closeMobileSidebar();
            handleLogout();
          }}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 active:scale-95 transition-all duration-200 px-4 py-2.5 font-medium"
        >
          <PowerOffIcon />
          <span>Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );

  const navbar = (
    <Navbar>
      <Text className="capitalize !text-gray-600 font-light text-sm px-2">
        Customer Video Portal
      </Text>
    </Navbar>
  );

  return (
    <>
      <StackedLayout sidebar={sidebar}>
        {activeSection === "reports" && <Reports />}
        {activeSection === "languages" && <LanguagesList />}
        {activeSection === "history" && <CallsHistory />}
        {activeSection === "profile" && <ProfileManagement />}
      </StackedLayout>

      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="old-password">Current password</Label>
              <InputGroup>
                <Input
                  id="old-password"
                  type="password"
                  placeholder="Current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full"
                />
              </InputGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <InputGroup>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full"
                />
              </InputGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <InputGroup>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full"
                />
              </InputGroup>
            </div>
            {changePasswordError && (
              <Text className="text-sm text-red-600">
                {changePasswordError}
              </Text>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setChangePasswordOpen(false)}
                disabled={changePasswordLoading}
                className="border-zinc-300 hover:bg-zinc-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={changePasswordLoading}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {changePasswordLoading ? "Updating…" : "Update password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
