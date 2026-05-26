import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Search,
  Moon,
  Sun,
  Download,
  TrendingUp,
  TrendingDown,
  PiggyBank,
} from "lucide-react";

type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
};

const CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Entertainment", "Health", "Other"];
const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#94a3b8"];

const STORAGE_KEY = "ft.expenses.v1";
const BUDGET_KEY = "ft.budget.v1";
const THEME_KEY = "ft.theme.v1";

function loadExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Expense[]) : [];
  } catch {
    return [];
  }
}
function loadBudget(): number {
  try {
    return Number(localStorage.getItem(BUDGET_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function FinanceTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<number>(0);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [dark, setDark] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().slice(0, 10),
  });

  // Hydrate from localStorage (client only)
  useEffect(() => {
    setExpenses(loadExpenses());
    setBudget(loadBudget());
    const t = localStorage.getItem(THEME_KEY);
    if (t === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(BUDGET_KEY, String(budget));
  }, [budget]);

  const toggleTheme = useCallback(() => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      return next;
    });
  }, []);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date.startsWith(currentMonth)),
    [expenses, currentMonth],
  );

  const totalSpent = useMemo(
    () => monthExpenses.reduce((s, e) => s + e.amount, 0),
    [monthExpenses],
  );
  const remaining = Math.max(budget - totalSpent, 0);
  const percentUsed = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses
      .filter((e) => (filterCat === "all" ? true : e.category === filterCat))
      .filter(
        (e) =>
          !q ||
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q),
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [expenses, search, filterCat]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [monthExpenses]);

  const last7Days = useMemo(() => {
    const days: { date: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const total = expenses
        .filter((e) => e.date === iso)
        .reduce((s, e) => s + e.amount, 0);
      days.push({
        date: d.toLocaleDateString(undefined, { weekday: "short" }),
        total,
      });
    }
    return days;
  }, [expenses]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      title: "",
      amount: "",
      category: "Food",
      date: new Date().toISOString().slice(0, 10),
    });
    setDialogOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({
      title: e.title,
      amount: String(e.amount),
      category: e.category,
      date: e.date,
    });
    setDialogOpen(true);
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const amt = parseFloat(form.amount);
    if (!form.title.trim() || isNaN(amt) || amt <= 0 || !form.date) {
      toast.error("Please fill all fields correctly");
      return;
    }
    if (editing) {
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === editing.id
            ? { ...e, title: form.title.trim(), amount: amt, category: form.category, date: form.date }
            : e,
        ),
      );
      toast.success("Expense updated");
    } else {
      const newExp: Expense = {
        id: crypto.randomUUID(),
        title: form.title.trim(),
        amount: amt,
        category: form.category,
        date: form.date,
      };
      setExpenses((prev) => [newExp, ...prev]);
      toast.success("Expense added");
    }
    setDialogOpen(false);
  };

  const remove = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    toast.success("Expense deleted");
  };

  const exportCSV = () => {
    const rows = [
      ["Title", "Amount", "Category", "Date"],
      ...expenses.map((e) => [e.title, e.amount, e.category, e.date]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { style: "currency", currency: "USD" });

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Toaster />
      <header className="border-b sticky top-0 bg-background/80 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Finance Tracker</h1>
              <p className="text-xs text-muted-foreground">Manage expenses & budgets</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={exportCSV} title="Export CSV">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={toggleTheme} title="Toggle theme">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary cards */}
        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm text-muted-foreground">Monthly Budget</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                min="0"
                value={budget || ""}
                onChange={(e) => setBudget(Number(e.target.value) || 0)}
                placeholder="Set budget"
                className="text-2xl font-bold h-auto py-1 border-0 px-0 shadow-none focus-visible:ring-0"
              />
              <p className="text-xs text-muted-foreground mt-1">For {currentMonth}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm text-muted-foreground">Spent This Month</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(totalSpent)}</div>
              <Progress value={percentUsed} className="mt-3" />
              <p className="text-xs text-muted-foreground mt-1">
                {percentUsed.toFixed(0)}% of budget used
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm text-muted-foreground">Remaining</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fmt(remaining)}</div>
              <p className="text-xs text-muted-foreground mt-3">
                {budget > 0 && totalSpent > budget
                  ? "⚠ Over budget"
                  : `${monthExpenses.length} transactions`}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Charts */}
        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Spending by Category</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {byCategory.length === 0 ? (
                <div className="h-full grid place-items-center text-sm text-muted-foreground">
                  No expenses this month yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={2}
                    >
                      {byCategory.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <RTooltip
                      formatter={(v: number) => fmt(v)}
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <RTooltip
                    formatter={(v: number) => fmt(v)}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        {/* Filters + List */}
        <section>
          <Card>
            <CardHeader className="gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <CardTitle className="text-base">Expenses</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 w-full sm:w-56"
                    />
                  </div>
                  <Select value={filterCat} onValueChange={setFilterCat}>
                    <SelectTrigger className="w-full sm:w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  No expenses found. Click <span className="font-medium">Add</span> to create one.
                </div>
              ) : (
                <ul className="divide-y">
                  {filtered.map((e) => (
                    <li
                      key={e.id}
                      className="py-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-1 duration-200"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{e.title}</span>
                          <Badge variant="secondary" className="shrink-0">
                            {e.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{e.date}</p>
                      </div>
                      <div className="font-semibold tabular-nums">{fmt(e.amount)}</div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(e)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(e.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Expense" : "Add Expense"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Coffee, Groceries..."
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editing ? "Save" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
