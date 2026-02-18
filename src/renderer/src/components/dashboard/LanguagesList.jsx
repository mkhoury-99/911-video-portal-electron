import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Input, InputGroup } from "../ui/input";
import { Button } from "../ui/button";
import { Heading } from "../ui/heading";
import { Text } from "../ui/text";
import {
  listLanguages,
  getAvailableLanguages,
  getTopLanguages,
} from "../../api/CustomerApi";
import { useZoomVideo } from "../../hooks/useZoomVideo";
import { echo } from "../../lib/echo";

/** Trim _Video and _Audio suffix from language name before handling. */
function trimLanguageSuffix(name) {
  if (typeof name !== "string") return name ?? "";
  return (
    name
      .replace(/_Video$/i, "")
      .replace(/_Audio$/i, "")
      .trim() || name
  );
}

function VideoIcon({ disabled, className = "" }) {
  const fill = disabled ? "#9ca3af" : "currentColor";
  return (
    <svg viewBox="0 0 20 20" fill={fill} className={`size-5 ${className}`}>
      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
    </svg>
  );
}

function PhoneIcon({ disabled, className = "" }) {
  const fill = disabled ? "#9ca3af" : "currentColor";
  return (
    <svg viewBox="0 0 20 20" fill={fill} className={`size-5 ${className}`}>
      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-5">
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function RefreshIcon({ spinning }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`size-5 ${spinning ? "animate-spin" : ""}`}
    >
      <path
        fillRule="evenodd"
        d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.312.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31a7 7 0 00-11.713 3.138.75.75 0 001.45.389 5.5 5.5 0 019.202-2.466l.312.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// Shared availability logic and button styles for video/audio (used in top languages and list)
function getAvailability(lang, isReady) {
  const videoDisabled = (lang?.opted_in_count_video ?? 0) === 0 || !isReady;
  const audioDisabled =
    (lang?.opted_in_count_audio ?? 0) === 0 ||
    !isReady ||
    (lang?.language && lang.language.includes("ASL"));
  return { videoDisabled, audioDisabled };
}

const CALL_BUTTON_ENABLED_CLASS =
  "bg-green-600 text-white hover:bg-green-700 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md";
const CALL_BUTTON_DISABLED_CLASS =
  "border-zinc-300 bg-white text-zinc-400 cursor-not-allowed";
const CALL_BUTTON_BASE_CLASS =
  "relative flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed";

export default function LanguagesList() {
  const [languages, setLanguages] = useState([]);
  const [filteredLanguages, setFilteredLanguages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [topLanguages, setTopLanguages] = useState([]);
  const { startVideoCall, isReady } = useZoomVideo();

  /** Silent refresh: only fetch availability and merge into current languages (no loading state). */
  const refreshAvailability = async () => {
    try {
      const availRes = await getAvailableLanguages();
      const availRaw = availRes?.data ?? availRes?.items ?? availRes;
      const availList = Array.isArray(availRaw) ? availRaw : [];
      const availabilityByLanguage = {};
      for (const item of availList) {
        const raw = typeof item === "object" && item !== null ? item : {};
        const rawLang = typeof item === "string" ? item : item?.language ?? "";
        const baseName = trimLanguageSuffix(rawLang);
        if (!baseName) continue;
        if (!availabilityByLanguage[baseName]) {
          availabilityByLanguage[baseName] = {
            opted_in_count_video: 0,
            opted_in_count_audio: 0,
          };
        }
        const v =
          Number(raw.opted_in_count_video ?? raw.optedInCountVideo ?? 0) || 0;
        const a =
          Number(raw.opted_in_count_audio ?? raw.optedInCountAudio ?? 0) || 0;
        availabilityByLanguage[baseName].opted_in_count_video = Math.max(
          availabilityByLanguage[baseName].opted_in_count_video ?? 0,
          v
        );
        availabilityByLanguage[baseName].opted_in_count_audio = Math.max(
          availabilityByLanguage[baseName].opted_in_count_audio ?? 0,
          a
        );
      }
      setLanguages((prev) =>
        prev.map((lang) => {
          const baseName = trimLanguageSuffix(lang.language);
          const avail = availabilityByLanguage[baseName];
          return {
            ...lang,
            opted_in_count_video: avail?.opted_in_count_video ?? 0,
            opted_in_count_audio: avail?.opted_in_count_audio ?? 0,
          };
        })
      );
      // Also update top languages with fresh availability
      setTopLanguages((prev) =>
        prev.map((lang) => {
          const baseName = trimLanguageSuffix(lang.language);
          const avail = availabilityByLanguage[baseName];
          return {
            ...lang,
            opted_in_count_video: avail?.opted_in_count_video ?? 0,
            opted_in_count_audio: avail?.opted_in_count_audio ?? 0,
          };
        })
      );
    } catch (err) {
      console.error("Background languages availability refresh failed:", err);
    }
  };

  useEffect(() => {
    loadLanguages();
  }, []);

  useEffect(() => {
    const channel = echo.channel("video-status");
    channel.listen(".contact_center.user_status_changed", () => {
      console.log("User status changed");
      refreshAvailability();
    });

    return () => {
      echo.leave("video-status");
    };
  }, []);

  // Load top languages from API and fetch availability separately
  useEffect(() => {
    const loadTopLanguages = async () => {
      try {
        // Fetch top languages (only returns language names)
        const topRes = await getTopLanguages();
        const topRaw = topRes?.data ?? topRes?.items ?? topRes;
        const topList = Array.isArray(topRaw) ? topRaw : [];
        const topLangNames = topList
          .map((item) => item?.language ?? item?.name ?? "")
          .filter(Boolean);

        // Fetch availability data
        const availRes = await getAvailableLanguages();
        const availRaw = availRes?.data ?? availRes?.items ?? availRes;
        const availList = Array.isArray(availRaw) ? availRaw : [];

        // Build availability lookup
        const availabilityByLanguage = {};
        for (const item of availList) {
          const raw = typeof item === "object" && item !== null ? item : {};
          const rawLang =
            typeof item === "string" ? item : item?.language ?? "";
          const baseName = trimLanguageSuffix(rawLang);
          if (!baseName) continue;
          if (!availabilityByLanguage[baseName]) {
            availabilityByLanguage[baseName] = {
              opted_in_count_video: 0,
              opted_in_count_audio: 0,
            };
          }
          const v =
            Number(raw.opted_in_count_video ?? raw.optedInCountVideo ?? 0) || 0;
          const a =
            Number(raw.opted_in_count_audio ?? raw.optedInCountAudio ?? 0) || 0;
          availabilityByLanguage[baseName].opted_in_count_video = Math.max(
            availabilityByLanguage[baseName].opted_in_count_video ?? 0,
            v
          );
          availabilityByLanguage[baseName].opted_in_count_audio = Math.max(
            availabilityByLanguage[baseName].opted_in_count_audio ?? 0,
            a
          );
        }

        // Merge top languages with availability
        const merged = topLangNames.map((name) => ({
          language: name,
          ...(availabilityByLanguage[trimLanguageSuffix(name)] ?? {
            opted_in_count_video: 0,
            opted_in_count_audio: 0,
          }),
        }));

        setTopLanguages(merged);
      } catch (err) {
        console.error("Failed to load top languages:", err);
        setTopLanguages([]);
      }
    };

    loadTopLanguages();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredLanguages(languages);
    } else {
      const filtered = languages.filter((lang) =>
        lang.language.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLanguages(filtered);
    }
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchQuery, languages]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredLanguages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLanguages = filteredLanguages.slice(startIndex, endIndex);

  /** First load all languages (list-languages), then load available by video/audio; trim _Video/_Audio before use. */
  const loadLanguages = async () => {
    try {
      setLoading(true);
      setError(null);

      const listRes = await listLanguages();
      const listRaw = listRes?.data ?? listRes?.items ?? listRes;
      const list = Array.isArray(listRaw) ? listRaw : [];
      const allNames = list.map((item) =>
        typeof item === "string" ? item : item?.language ?? item?.name ?? ""
      );
      const allLanguageNames = allNames.filter(Boolean);

      const availRes = await getAvailableLanguages();
      const availRaw = availRes?.data ?? availRes?.items ?? availRes;
      const availList = Array.isArray(availRaw) ? availRaw : [];
      const availabilityByLanguage = {};
      for (const item of availList) {
        const raw = typeof item === "object" && item !== null ? item : {};
        const rawLang = typeof item === "string" ? item : item?.language ?? "";
        const baseName = trimLanguageSuffix(rawLang);
        if (!baseName) continue;
        if (!availabilityByLanguage[baseName]) {
          availabilityByLanguage[baseName] = {
            opted_in_count_video: 0,
            opted_in_count_audio: 0,
          };
        }
        // API always sends _Video suffix for each language; one row has both video and audio counts
        const v =
          Number(raw.opted_in_count_video ?? raw.optedInCountVideo ?? 0) || 0;
        const a =
          Number(raw.opted_in_count_audio ?? raw.optedInCountAudio ?? 0) || 0;
        availabilityByLanguage[baseName].opted_in_count_video = Math.max(
          availabilityByLanguage[baseName].opted_in_count_video ?? 0,
          v
        );
        availabilityByLanguage[baseName].opted_in_count_audio = Math.max(
          availabilityByLanguage[baseName].opted_in_count_audio ?? 0,
          a
        );
      }

      const merged = allLanguageNames.map((name) => ({
        language: name,
        ...(availabilityByLanguage[trimLanguageSuffix(name)] ?? {
          opted_in_count_video: 0,
          opted_in_count_audio: 0,
        }),
      }));

      setLanguages(merged);
      setFilteredLanguages(merged);
      // Also update top languages with fresh availability
      setTopLanguages((prev) =>
        prev.map((lang) => {
          const baseName = trimLanguageSuffix(lang.language);
          const avail = availabilityByLanguage[baseName];
          return {
            ...lang,
            opted_in_count_video: avail?.opted_in_count_video ?? 0,
            opted_in_count_audio: avail?.opted_in_count_audio ?? 0,
          };
        })
      );
    } catch (err) {
      setError("Failed to load languages. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoCall = async (language, callType = "video") => {
    if (!isReady) {
      alert("Video client is not ready yet. Please wait a moment.");
      return;
    }

    // TODO: Get entryId from API based on language
    const entryId = "4PUouPs7RXSNQJYW6W896Q";

    try {
      await startVideoCall(entryId, language, "Customer", callType);
    } catch (err) {
      console.error("Failed to start video call:", err);
      alert("Failed to start video call. Please try again.");
    }
  };

  if (loading && languages.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Text>Loading languages...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Text className="text-red-600">{error}</Text>
        <Button
          onClick={loadLanguages}
          className="bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all duration-200 px-6 py-2.5 font-medium shadow-sm hover:shadow-md"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Heading>Available Languages</Heading>
          <Text className="text-zinc-500 mt-2">
            Select a language and choose video or audio call
          </Text>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadLanguages}
          disabled={loading}
          className="border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400 active:scale-95 transition-all duration-200 shrink-0 flex items-center gap-2"
          title="Refresh languages"
        >
          <RefreshIcon spinning={loading} />
          <span>{loading ? "Refreshing..." : "Refresh"}</span>
        </Button>
      </div>

      <div className="max-w-md w-full">
        <InputGroup>
          <Input
            type="text"
            placeholder="Search languages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </InputGroup>
      </div>

      {/* Top languages – small cards, list-style buttons */}
      {topLanguages.length > 0 && (
        <section className="space-y-2">
          <Heading level={2} className="text-sm font-semibold text-zinc-800">
            Top languages
          </Heading>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
            {topLanguages.map((lang) => {
              const { videoDisabled, audioDisabled } = getAvailability(
                lang,
                isReady
              );
              return (
                <Card key={lang.language} className="border-zinc-200 px-3 py-2">
                  <div className="flex flex-col items-center justify-between gap-2 min-w-0">
                    <span className="text-sm font-medium text-zinc-950 truncate">
                      {trimLanguageSuffix(lang.language)}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="default"
                        disabled={videoDisabled}
                        onClick={() => handleVideoCall(lang.language, "video")}
                        className={`p-2 ${CALL_BUTTON_BASE_CLASS} ${
                          videoDisabled
                            ? CALL_BUTTON_DISABLED_CLASS
                            : CALL_BUTTON_ENABLED_CLASS
                        }`}
                      >
                        <VideoIcon
                          disabled={videoDisabled}
                          className={videoDisabled ? "" : "text-white"}
                        />
                      </Button>
                      {!lang.language?.includes("ASL") && (
                        <Button
                          variant="outline"
                          size="default"
                          disabled={audioDisabled}
                          onClick={() =>
                            handleVideoCall(lang.language, "audio")
                          }
                          className={`p-2 ${CALL_BUTTON_BASE_CLASS} ${
                            audioDisabled
                              ? CALL_BUTTON_DISABLED_CLASS
                              : CALL_BUTTON_ENABLED_CLASS
                          }`}
                        >
                          <PhoneIcon
                            disabled={audioDisabled}
                            className={audioDisabled ? "" : "text-white"}
                          />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <div className="space-y-4">
        {filteredLanguages.length === 0 ? (
          <div className="py-12 text-center">
            <Text className="text-zinc-500">No languages found</Text>
          </div>
        ) : (
          <>
            <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-200">
              {paginatedLanguages.map((lang) => (
                <div
                  key={lang.language}
                  className="flex items-center justify-between px-4 py-1 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-zinc-950">
                        {trimLanguageSuffix(lang.language)}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const { videoDisabled, audioDisabled } = getAvailability(
                        lang,
                        isReady
                      );
                      return (
                        <>
                          <Button
                            variant="outline"
                            size="default"
                            disabled={videoDisabled}
                            onClick={() =>
                              handleVideoCall(lang.language, "video")
                            }
                            className={`gap-2 px-4 py-2 ${CALL_BUTTON_BASE_CLASS} ${
                              videoDisabled
                                ? CALL_BUTTON_DISABLED_CLASS
                                : CALL_BUTTON_ENABLED_CLASS
                            }`}
                          >
                            <VideoIcon
                              disabled={videoDisabled}
                              className={videoDisabled ? "" : "text-white"}
                            />
                          </Button>
                          {!lang.language?.includes("ASL") && (
                            <Button
                              variant="outline"
                              size="default"
                              disabled={audioDisabled}
                              onClick={() =>
                                handleVideoCall(lang.language, "audio")
                              }
                              className={`gap-2 px-4 py-2 ${CALL_BUTTON_BASE_CLASS} ${
                                audioDisabled
                                  ? CALL_BUTTON_DISABLED_CLASS
                                  : CALL_BUTTON_ENABLED_CLASS
                              }`}
                            >
                              <PhoneIcon
                                disabled={audioDisabled}
                                className={audioDisabled ? "" : "text-white"}
                              />
                            </Button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <Text className="text-sm text-zinc-500">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredLanguages.length)} of{" "}
                  {filteredLanguages.length} languages
                </Text>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2"
                  >
                    Previous
                  </Button>
                  <Text className="text-sm text-zinc-500">
                    Page {currentPage} of {totalPages}
                  </Text>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
