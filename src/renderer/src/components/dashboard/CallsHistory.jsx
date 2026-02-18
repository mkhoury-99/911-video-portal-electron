import { useState, useEffect, useCallback, useRef } from "react";
import { Table } from "antd";
import moment from "moment-timezone";
import { Calendar as CalendarIcon, Download, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Heading } from "../ui/heading";
import { Text } from "../ui/text";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils";
import {
  listCallsHistoryVideo,
  downloadCallsHistoryVideoCsv,
  getCallsSummary,
  listLanguages,
} from "../../api/CustomerApi";

const MAX_RANGE_DAYS = 31;
const EST_TIMEZONE = "America/New_York";

// Helper function to get today's date range (start and end of today in EST)
function getTodayDateRange() {
  const today = moment().tz(EST_TIMEZONE);
  const from = today.clone().startOf("day").toDate();
  const to = today.clone().endOf("day").toDate();
  return { from, to };
}

// Convert date range to EST YYYY-MM-DD for API (consistent with display timezone)
function toESTDateString(date) {
  return moment(date).tz(EST_TIMEZONE).format("YYYY-MM-DD");
}

// Parse date string as UTC (backend sends UTC). Strings without Z or offset
// are otherwise interpreted as local time, causing wrong display.
function parseAsUTC(dateString) {
  if (!dateString) return null;
  const s = String(dateString).trim();
  if (/Z$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s)) {
    return new Date(s);
  }
  return new Date(s + "Z");
}

function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    const date = parseAsUTC(dateString);
    if (!date || isNaN(date.getTime())) return dateString;
    return date.toLocaleString("en-US", {
      timeZone: EST_TIMEZONE,
      dateStyle: "short",
      timeStyle: "medium",
    });
  } catch {
    return dateString;
  }
}

function trimLanguageSuffix(name) {
  if (typeof name !== "string") return name ?? "";
  return (
    name
      .replace(/_Video$/i, "")
      .replace(/_Audio$/i, "")
      .trim() || name
  );
}

export default function CallsHistory() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalCalls: 0,
    totalMinutes: 0,
    topLanguages: [],
  });
  const [error, setError] = useState(null);
  const [date, setDate] = useState(() => getTodayDateRange());
  const [languageOptions, setLanguageOptions] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const abortRef = useRef(null);

  const loadCallHistory = useCallback(
    async (page = 1, pageSize = 10, dateFrom, dateTo, languages = []) => {
      // Cancel any in-flight request to prevent race conditions
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      try {
        setLoading(true);
        setError(null);
        const params = { page, pageSize, signal };
        if (dateFrom) params.startDate = dateFrom;
        if (dateTo) params.endDate = dateTo;
        if (Array.isArray(languages) && languages.length > 0) {
          params.languages = languages;
        }
        const response = await listCallsHistoryVideo(params);

        if (signal.aborted) return;

        const items = response?.data ?? response?.items ?? response;
        const total =
          response?.meta?.total ??
          response?.total ??
          (Array.isArray(items) ? items.length : 0);
        const data = Array.isArray(items) ? items : [];

        setCalls(data);
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize,
          total: typeof total === "number" ? total : data.length,
        }));
      } catch (err) {
        if (
          err?.name === "CanceledError" ||
          err?.name === "AbortError" ||
          err?.code === "ERR_CANCELED"
        )
          return;
        setError("Failed to load call history. Please try again.");
        console.error(err);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [],
  );

  const getDateParams = useCallback(() => {
    if (!date?.from) return {};
    const from = date.from;
    const to = date.to ?? date.from;
    return {
      dateFrom: toESTDateString(from),
      dateTo: toESTDateString(to),
    };
  }, [date]);

  const loadCallsSummary = useCallback(
    async (dateFrom, dateTo, languages = []) => {
      try {
        setSummaryLoading(true);
        const languageParams =
          Array.isArray(languages) && languages.length > 0 ? { languages } : {};
        const response = await getCallsSummary({
          startDate: dateFrom,
          endDate: dateTo,
          ...languageParams,
        });
        const data = response?.data ?? response ?? {};
        const totalCalls =
          Number(
            data?.calls_count ??
              data?.total_calls ??
              data?.totalCalls ??
              data?.calls ??
              0,
          ) || 0;
        const totalMinutesRaw =
          data?.total_minutes ??
          data?.totalMinutes ??
          data?.minutes ??
          data?.total_min ??
          null;
        const totalSeconds =
          Number(
            data?.total_duration_s ??
              data?.total_seconds ??
              data?.totalSeconds ??
              data?.seconds ??
              0,
          ) || 0;
        const totalMinutes =
          totalMinutesRaw != null && !isNaN(Number(totalMinutesRaw))
            ? Number(totalMinutesRaw)
            : Math.round((totalSeconds / 60) * 100) / 100;
        const rawTopLanguages =
          data?.top_languages ?? data?.topLanguages ?? data?.languages ?? [];
        const topLanguages = Array.isArray(rawTopLanguages)
          ? rawTopLanguages
              .map((item) => {
                const language = item?.language ?? item?.name ?? item?.label;
                const seconds =
                  Number(
                    item?.total_duration_s ??
                      item?.total_seconds ??
                      item?.seconds ??
                      0,
                  ) || 0;
                const minutes = Math.round((seconds / 60) * 100) / 100;
                return language ? { language, minutes } : null;
              })
              .filter(Boolean)
              .slice(0, 5)
          : [];

        setSummary({ totalCalls, totalMinutes, topLanguages });
      } catch (err) {
        console.error(err);
        setSummary({ totalCalls: 0, totalMinutes: 0, topLanguages: [] });
      } finally {
        setSummaryLoading(false);
      }
    },
    [],
  );

  const loadLanguageOptions = useCallback(async () => {
    try {
      const response = await listLanguages();
      const raw = response?.data ?? response?.items ?? response;
      const list = Array.isArray(raw) ? raw : [];
      const unique = Array.from(
        new Set(
          list
            .map((item) =>
              trimLanguageSuffix(
                typeof item === "string"
                  ? item
                  : (item?.language ?? item?.name ?? ""),
              ),
            )
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b));
      setLanguageOptions(unique);
    } catch (err) {
      console.error("Failed to load language options:", err);
      setLanguageOptions([]);
    }
  }, []);

  useEffect(() => {
    loadLanguageOptions();
  }, [loadLanguageOptions]);

  useEffect(() => {
    const { dateFrom, dateTo } = getDateParams();
    if (!dateFrom) return;
    loadCallHistory(
      1,
      pagination.pageSize,
      dateFrom,
      dateTo ?? dateFrom,
      selectedLanguages,
    );
    loadCallsSummary(dateFrom, dateTo ?? dateFrom, selectedLanguages);

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [
    date,
    selectedLanguages,
    pagination.pageSize,
    getDateParams,
    loadCallHistory,
    loadCallsSummary,
  ]);

  const handleTableChange = (newPagination) => {
    const { dateFrom, dateTo } = getDateParams();
    loadCallHistory(
      newPagination.current,
      newPagination.pageSize,
      dateFrom,
      dateTo,
      selectedLanguages,
    );
  };

  // Handle date selection - matches CallsReport.jsx logic exactly
  const handleDateSelect = (newDate) => {
    // Handle case where newDate is undefined/null - default to today
    if (!newDate) {
      setDate(getTodayDateRange());
      return;
    }

    // Handle case where from date is cleared - default to today
    if (!newDate.from) {
      setDate(getTodayDateRange());
      return;
    }

    // Check if range is more than 31 days (only if both dates exist)
    if (newDate.to && newDate.from) {
      const daysDifference = Math.ceil(
        Math.abs(newDate.to.getTime() - newDate.from.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysDifference > MAX_RANGE_DAYS) {
        // Don't update if range exceeds limit
        return;
      }
    }

    // Start of day
    const fromDate = new Date(
      newDate.from.getFullYear(),
      newDate.from.getMonth(),
      newDate.from.getDate(),
    );

    let toDate;
    if (newDate.to) {
      // Start of day for range end
      toDate = new Date(
        newDate.to.getFullYear(),
        newDate.to.getMonth(),
        newDate.to.getDate(),
      );
    } else {
      // For single day selection, set to end of the same day
      toDate = new Date(
        newDate.from.getFullYear(),
        newDate.from.getMonth(),
        newDate.from.getDate(),
        23,
        59,
        59,
        999,
      );
    }

    setDate({
      from: fromDate,
      to: toDate,
    });
  };

  const columns = [
    {
      title: "Call Start",
      dataIndex: "engagement_start_ts",
      key: "date",
      width: 180,
      render: (text) => formatDate(text),
    },
    {
      title: "Call End",
      dataIndex: "engagement_end_ts",
      key: "date",
      width: 180,
      render: (text) => formatDate(text),
    },
    {
      title: "Type",
      dataIndex: "channel",
      key: "type",
      width: 100,
      render: (channel) => channel || "-",
    },
    {
      title: "Language",
      dataIndex: "language",
      key: "language",
      width: 120,
    },
    {
      title: "Interpreter ID",
      dataIndex: "interpreter_answered_s_id",
      key: "interpreter_answered_s_id",
      width: 120,
      render: (interpreter_answered_s_id) => interpreter_answered_s_id || "-",
    },
    {
      title: "Duration",
      dataIndex: "interpretation_duration_s",
      key: "duration",
      width: 100,
      render: (seconds) => {
        if (seconds == null || isNaN(seconds)) return "-";
        const s = Math.floor(Number(seconds));
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        const pad = (v) => v.toString().padStart(2, "0");
        return `${pad(h)}:${pad(m)}:${pad(sec)}`;
      },
    },
    {
      title: "Total Billed ($)",
      dataIndex: "customer_bill",
      key: "customer_bill",
      width: 120,
      render: (customer_bill) => customer_bill || "0",
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Text className="text-red-600">{error}</Text>
        <button
          onClick={() => {
            const { dateFrom, dateTo } = getDateParams();
            loadCallHistory(
              pagination.current,
              pagination.pageSize,
              dateFrom,
              dateTo,
              selectedLanguages,
            );
            loadCallsSummary(dateFrom, dateTo ?? dateFrom, selectedLanguages);
          }}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:scale-95 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
        >
          Retry
        </button>
      </div>
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { dateFrom, dateTo } = getDateParams();
      await Promise.all([
        loadCallHistory(
          pagination.current,
          pagination.pageSize,
          dateFrom,
          dateTo,
          selectedLanguages,
        ),
        loadCallsSummary(dateFrom, dateTo ?? dateFrom, selectedLanguages),
      ]);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 500);
    }
  };

  const clearAllFilters = () => {
    setDate(getTodayDateRange());
    setSelectedLanguages([]);
  };

  const toggleLanguage = (language) => {
    setSelectedLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((item) => item !== language)
        : [...prev, language],
    );
  };

  const languageFilterLabel =
    selectedLanguages.length === 0
      ? "All languages"
      : selectedLanguages.length === 1
        ? selectedLanguages[0]
        : `${selectedLanguages.length} selected`;

  const handleDownloadCsv = async () => {
    try {
      setDownloadingCsv(true);
      const { dateFrom, dateTo } = getDateParams();
      const response = await downloadCallsHistoryVideoCsv({
        startDate: dateFrom,
        endDate: dateTo ?? dateFrom,
        ...(selectedLanguages.length > 0
          ? {
              languages: selectedLanguages,
            }
          : {}),
      });

      const csvBlob = response?.data;
      if (!(csvBlob instanceof Blob)) {
        throw new Error("Invalid CSV download response");
      }

      const fallbackFileName = `video_calls_${moment().format(
        "YYYY-MM-DD_HH-mm-ss",
      )}.csv`;
      const contentDisposition =
        response?.headers?.["content-disposition"] ?? "";
      const filenameMatch =
        contentDisposition.match(/filename\*=UTF-8''([^;]+)/i) ||
        contentDisposition.match(/filename="?([^";]+)"?/i);
      const fileName = filenameMatch
        ? decodeURIComponent(filenameMatch[1])
        : fallbackFileName;

      const url = window.URL.createObjectURL(csvBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      window.alert("Failed to download CSV. Please try again.");
    } finally {
      setDownloadingCsv(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Heading>Call History</Heading>
          <Text className="text-zinc-500 mt-2">
            View your past video and audio calls
          </Text>
        </div>
      </div>

      {/* Date Range Filter - Matches CallsReport.jsx exactly */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col">
          <label className="text-sm text-muted-foreground mb-1">
            Date Range{" "}
            <span className="text-xs text-gray-400">(max 31 days)</span>
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal cursor-pointer",
                  !date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {moment(date.from).tz(EST_TIMEZONE).format("MMM D, y")} -{" "}
                      {moment(date.to).tz(EST_TIMEZONE).format("MMM D, y")}
                    </>
                  ) : (
                    moment(date.from).tz(EST_TIMEZONE).format("MMM D, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1 z-50 bg-white" align="center">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                disabled={(calendarDate) => {
                  // If we have a selected start date, disable dates that would make range > 31 days
                  if (date?.from && !date?.to && calendarDate instanceof Date) {
                    const daysDifference = Math.abs(
                      Math.ceil(
                        (calendarDate.getTime() - date.from.getTime()) /
                          (1000 * 60 * 60 * 24),
                      ),
                    );
                    return daysDifference > MAX_RANGE_DAYS;
                  }
                  return false;
                }}
                onSelect={handleDateSelect}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col min-w-[220px]">
          <label className="text-sm text-muted-foreground mb-1">Language</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="justify-between w-full font-normal cursor-pointer"
              >
                <span className="truncate">{languageFilterLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[260px] max-h-[300px] overflow-y-auto"
              align="start"
            >
              <DropdownMenuLabel>Languages</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedLanguages.length === 0}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => setSelectedLanguages([])}
              >
                All languages
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {languageOptions.map((lang) => (
                <DropdownMenuCheckboxItem
                  key={lang}
                  checked={selectedLanguages.includes(lang)}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={() => toggleLanguage(lang)}
                >
                  {lang}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button
          variant="outline"
          className="flex items-center gap-2 cursor-pointer border-red-500 text-red-500 hover:bg-red-50"
          onClick={clearAllFilters}
        >
          Clear Filters
        </Button>

        <Button
          variant="outline"
          className="flex items-center gap-2 cursor-pointer"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>

        <Button
          variant="outline"
          className="flex items-center gap-2 cursor-pointer"
          onClick={handleDownloadCsv}
          disabled={downloadingCsv}
        >
          <Download className="h-4 w-4" />
          {downloadingCsv ? "Downloading..." : "Download CSV"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
          <Text className="text-[11px] uppercase tracking-wide text-zinc-500">
            Total Calls
          </Text>
          <Text className="text-lg font-semibold text-zinc-900">
            {summaryLoading ? "..." : summary.totalCalls}
          </Text>
        </div>
        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
          <Text className="text-[11px] uppercase tracking-wide text-zinc-500">
            Total Minutes
          </Text>
          <Text className="text-lg font-semibold text-zinc-900">
            {summaryLoading ? "..." : summary.totalMinutes}
          </Text>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Text className="text-xs text-zinc-500">Top languages:</Text>
        {summaryLoading ? (
          <Text className="text-xs text-zinc-400">...</Text>
        ) : summary.topLanguages.length ? (
          summary.topLanguages.map((item) => (
            <span
              key={item.language}
              className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-700"
            >
              {item.language} ({item.minutes} min)
            </span>
          ))
        ) : (
          <Text className="text-xs text-zinc-400">-</Text>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <Table
          columns={columns}
          dataSource={calls}
          rowKey={(record, index) =>
            record.engagement_id ?? record.id ?? record.key ?? `row-${index}`
          }
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} records`,
            pageSizeOptions: ["10", "20", "30", "50"],
            onChange: (page, pageSize) =>
              handleTableChange({ current: page, pageSize }),
          }}
          scroll={{ x: "max-content" }}
          style={{ minWidth: "max-content" }}
        />
      </div>
    </div>
  );
}
