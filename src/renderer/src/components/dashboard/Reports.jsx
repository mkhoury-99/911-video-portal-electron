import { useState, useEffect, useCallback } from "react";
import { Table } from "antd";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../ui/card";
import { Heading } from "../ui/heading";
import { Text } from "../ui/text";
import {
  getUsageByVideoCustomer,
  listLanguagesUsageByCustomer,
} from "../../api/CustomerApi";

/** Seconds to minutes for display (rounded to 2 decimals). */
function secondsToMinutes(seconds) {
  const s = Number(seconds);
  if (s == null || isNaN(s)) return 0;
  return Math.round((s / 60) * 100) / 100;
}

export default function Reports() {
  const [totalCalls, setTotalCalls] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [totalSecondsByCustomer, setTotalSecondsByCustomer] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsageByVideoCustomer();
      setTotalCalls(
        data?.total_calls ?? data?.totalCalls ?? data?.calls ?? 0
      );
      setTotalMinutes(
        data?.total_minutes ?? data?.totalMinutes ?? data?.minutes ?? 0
      );
    } catch (err) {
      setError("Failed to load usage summary.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLanguagesUsage = useCallback(
    async (page = 1, pageSize = 10) => {
      try {
        setTableLoading(true);
        const response = await listLanguagesUsageByCustomer({
          page,
          pageSize,
        });

        const languages = response?.languages ?? response?.data ?? response?.items ?? response;
        const totalSeconds = Number(response?.total_seconds_by_customer ?? 0) || 0;
        const list = Array.isArray(languages) ? languages : [];
        const total = response?.meta?.total ?? response?.total ?? list.length;

        setTotalSecondsByCustomer(totalSeconds);
        setTableData(list);
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize,
          total: typeof total === "number" ? total : list.length,
        }));
      } catch (err) {
        console.error(err);
      } finally {
        setTableLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadLanguagesUsage(pagination.current, pagination.pageSize);
  }, [loadLanguagesUsage]);

  const handleTableChange = (newPagination) => {
    loadLanguagesUsage(newPagination.current, newPagination.pageSize);
  };

  const getRowSeconds = (row) => {
    const sec = row?.total_seconds ?? row?.totalSeconds ?? row?.seconds;
    if (sec != null && !isNaN(Number(sec))) return Number(sec);
    const mins = row?.total_minutes ?? row?.totalMinutes ?? row?.minutes;
    if (mins != null && !isNaN(Number(mins))) return Number(mins) * 60;
    return 0;
  };

  const columns = [
    {
      title: "Language",
      dataIndex: "language",
      key: "language",
      width: 160,
      render: (val) => val ?? "-",
    },
    {
      title: "Total Calls",
      dataIndex: "total_calls",
      key: "total_calls",
      width: 120,
      render: (val, row) =>
        val ?? row?.totalCalls ?? row?.calls ?? 0,
    },
    {
      title: "Total Minutes",
      key: "total_minutes",
      width: 140,
      render: (_, row) => secondsToMinutes(getRowSeconds(row)),
    },
    {
      title: "% of Total Minutes",
      key: "pct_minutes",
      width: 160,
      render: (_, row) => {
        const rowSeconds = getRowSeconds(row);
        if (!totalSecondsByCustomer || totalSecondsByCustomer === 0)
          return "0%";
        const pct = (rowSeconds / totalSecondsByCustomer) * 100;
        return `${pct.toFixed(1)}%`;
      },
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Text className="text-red-600">{error}</Text>
        <button
          onClick={loadSummary}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Heading>Usage Report - Calls</Heading>
        <Text className="text-zinc-500 mt-2">
          Overview of your call usage by language
        </Text>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <Card className="border-zinc-950/10 shadow-xs">
          <CardHeader className="border-b border-zinc-950/5 pb-4">
            <CardTitle className="text-base font-semibold text-zinc-950">
              Total Calls
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <Text className="text-zinc-500">...</Text>
            ) : (
              <span className="text-2xl font-bold text-zinc-950">
                {totalCalls}
              </span>
            )}
          </CardContent>
        </Card>
        <Card className="border-zinc-950/10 shadow-xs">
          <CardHeader className="border-b border-zinc-950/5 pb-4">
            <CardTitle className="text-base font-semibold text-zinc-950">
              Total Minutes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <Text className="text-zinc-500">...</Text>
            ) : (
              <span className="text-2xl font-bold text-zinc-950">
                {totalMinutes}
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="w-full overflow-x-auto">
        <Table
          columns={columns}
          dataSource={tableData}
          rowKey={(record) =>
            record.language ?? record.id ?? record.key ?? Math.random()
          }
          loading={tableLoading}
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
